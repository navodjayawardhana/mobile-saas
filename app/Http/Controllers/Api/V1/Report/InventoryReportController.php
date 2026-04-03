<?php

namespace App\Http\Controllers\Api\V1\Report;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\InventoryItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class InventoryReportController extends Controller
{
    /**
     * Get inventory summary report
     */
    public function index(Request $request)
    {
        $categoryId = $request->input('category_id');
        $brandId = $request->input('brand_id');

        $query = Product::query();

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }
        if ($brandId) {
            $query->where('brand_id', $brandId);
        }

        // Summary stats
        $totalProducts = (clone $query)->count();
        $activeProducts = (clone $query)->where('is_active', true)->count();
        $lowStockProducts = (clone $query)->whereColumn('quantity', '<=', 'min_stock_alert')->where('is_active', true)->count();
        $outOfStockProducts = (clone $query)->where('quantity', 0)->where('is_active', true)->count();

        // Stock value
        $totalStockValue = (clone $query)->selectRaw('SUM(quantity * cost_price) as value')->value('value') ?? 0;
        $totalRetailValue = (clone $query)->selectRaw('SUM(quantity * selling_price) as value')->value('value') ?? 0;

        // By category
        $byCategory = Product::leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->when($categoryId, fn($q) => $q->where('products.category_id', $categoryId))
            ->when($brandId, fn($q) => $q->where('products.brand_id', $brandId))
            ->selectRaw('
                categories.id,
                categories.name,
                COUNT(*) as product_count,
                SUM(products.quantity) as total_stock,
                SUM(products.quantity * products.cost_price) as stock_value
            ')
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('stock_value')
            ->get();

        // By brand
        $byBrand = Product::leftJoin('brands', 'products.brand_id', '=', 'brands.id')
            ->when($categoryId, fn($q) => $q->where('products.category_id', $categoryId))
            ->when($brandId, fn($q) => $q->where('products.brand_id', $brandId))
            ->selectRaw('
                brands.id,
                brands.name,
                COUNT(*) as product_count,
                SUM(products.quantity) as total_stock,
                SUM(products.quantity * products.cost_price) as stock_value
            ')
            ->groupBy('brands.id', 'brands.name')
            ->orderByDesc('stock_value')
            ->get();

        return response()->json([
            'summary' => [
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'low_stock' => $lowStockProducts,
                'out_of_stock' => $outOfStockProducts,
                'total_stock_value' => $totalStockValue,
                'total_retail_value' => $totalRetailValue,
                'potential_profit' => $totalRetailValue - $totalStockValue,
            ],
            'by_category' => $byCategory,
            'by_brand' => $byBrand,
        ]);
    }

    /**
     * Stock valuation report
     */
    public function valuation(Request $request)
    {
        $categoryId = $request->input('category_id');
        $brandId = $request->input('brand_id');

        $query = Product::with(['category:id,name', 'brand:id,name'])
            ->where('quantity', '>', 0);

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }
        if ($brandId) {
            $query->where('brand_id', $brandId);
        }

        $products = $query->orderByDesc(DB::raw('quantity * cost_price'))
            ->paginate($request->input('per_page', 20));

        $products->getCollection()->transform(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'category' => $product->category?->name,
                'brand' => $product->brand?->name,
                'quantity' => $product->quantity,
                'cost_price' => $product->cost_price,
                'selling_price' => $product->selling_price,
                'stock_value' => $product->quantity * $product->cost_price,
                'retail_value' => $product->quantity * $product->selling_price,
                'potential_profit' => $product->quantity * ($product->selling_price - $product->cost_price),
            ];
        });

        // Calculate totals
        $totals = Product::when($categoryId, fn($q) => $q->where('category_id', $categoryId))
            ->when($brandId, fn($q) => $q->where('brand_id', $brandId))
            ->where('quantity', '>', 0)
            ->selectRaw('
                SUM(quantity * cost_price) as total_stock_value,
                SUM(quantity * selling_price) as total_retail_value
            ')
            ->first();

        return response()->json([
            'products' => $products,
            'totals' => [
                'stock_value' => $totals->total_stock_value ?? 0,
                'retail_value' => $totals->total_retail_value ?? 0,
                'potential_profit' => ($totals->total_retail_value ?? 0) - ($totals->total_stock_value ?? 0),
            ],
        ]);
    }

    /**
     * Stock movement report
     */
    public function movements(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());
        $productId = $request->input('product_id');
        $type = $request->input('type');

        $query = StockMovement::with(['product:id,name,sku', 'user:id,name'])
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo);

        if ($productId) {
            $query->where('product_id', $productId);
        }
        if ($type) {
            $query->where('type', $type);
        }

        $movements = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        // Summary by type
        $summary = StockMovement::whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->when($productId, fn($q) => $q->where('product_id', $productId))
            ->selectRaw('type, SUM(ABS(quantity)) as total_qty, COUNT(*) as count')
            ->groupBy('type')
            ->get()
            ->keyBy('type');

        return response()->json([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'movements' => $movements,
            'summary' => $summary,
        ]);
    }

    /**
     * Low stock report
     */
    public function lowStock(Request $request)
    {
        $products = Product::with(['category:id,name', 'brand:id,name'])
            ->whereColumn('quantity', '<=', 'min_stock_alert')
            ->where('is_active', true)
            ->orderBy('quantity')
            ->paginate($request->input('per_page', 20));

        $products->getCollection()->transform(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'category' => $product->category?->name,
                'brand' => $product->brand?->name,
                'quantity' => $product->quantity,
                'min_stock_alert' => $product->min_stock_alert,
                'shortage' => $product->min_stock_alert - $product->quantity,
                'cost_price' => $product->cost_price,
                'restock_value' => ($product->min_stock_alert - $product->quantity) * $product->cost_price,
            ];
        });

        return response()->json($products);
    }

    /**
     * Inventory aging (for serialized items)
     */
    public function aging(Request $request)
    {
        $today = Carbon::today();

        // Get inventory items grouped by age
        $aging = InventoryItem::where('status', 'available')
            ->selectRaw('
                CASE
                    WHEN DATEDIFF(NOW(), created_at) <= 30 THEN "0-30 days"
                    WHEN DATEDIFF(NOW(), created_at) <= 60 THEN "31-60 days"
                    WHEN DATEDIFF(NOW(), created_at) <= 90 THEN "61-90 days"
                    WHEN DATEDIFF(NOW(), created_at) <= 180 THEN "91-180 days"
                    ELSE "Over 180 days"
                END as age_bracket,
                COUNT(*) as count,
                SUM(cost_price) as total_value
            ')
            ->groupByRaw('age_bracket')
            ->get();

        // Old inventory items (over 90 days)
        $oldItems = InventoryItem::with(['product:id,name,sku'])
            ->where('status', 'available')
            ->whereRaw('DATEDIFF(NOW(), created_at) > 90')
            ->orderBy('created_at')
            ->limit(20)
            ->get()
            ->map(function ($item) use ($today) {
                return [
                    'id' => $item->id,
                    'serial_number' => $item->serial_number,
                    'product_name' => $item->product?->name,
                    'product_sku' => $item->product?->sku,
                    'cost_price' => $item->cost_price,
                    'days_in_stock' => $today->diffInDays($item->created_at),
                    'received_date' => $item->created_at,
                ];
            });

        return response()->json([
            'aging_summary' => $aging,
            'old_inventory' => $oldItems,
        ]);
    }

    /**
     * Export inventory report as PDF
     */
    public function exportPdf(Request $request)
    {
        $data = json_decode($this->index($request)->content(), true);
        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.inventory-report', [
            'shop' => $shop,
            'data' => $data,
        ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="inventory_report.pdf"',
        ]);
    }

    /**
     * Export valuation report as PDF
     */
    public function exportValuationPdf(Request $request)
    {
        $categoryId = $request->input('category_id');
        $brandId = $request->input('brand_id');

        $products = Product::with(['category:id,name', 'brand:id,name'])
            ->where('quantity', '>', 0)
            ->when($categoryId, fn($q) => $q->where('category_id', $categoryId))
            ->when($brandId, fn($q) => $q->where('brand_id', $brandId))
            ->orderByDesc(DB::raw('quantity * cost_price'))
            ->get()
            ->map(function ($product) {
                return [
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'category' => $product->category?->name,
                    'quantity' => $product->quantity,
                    'cost_price' => $product->cost_price,
                    'stock_value' => $product->quantity * $product->cost_price,
                    'potential_profit' => $product->quantity * ($product->selling_price - $product->cost_price),
                ];
            });

        $totals = [
            'stock_value' => $products->sum('stock_value'),
            'potential_profit' => $products->sum('potential_profit'),
        ];

        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.inventory-valuation', [
            'shop' => $shop,
            'products' => $products,
            'totals' => $totals,
        ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="inventory_valuation.pdf"',
        ]);
    }

    /**
     * Export low stock report as PDF
     */
    public function exportLowStockPdf(Request $request)
    {
        $products = Product::with(['category:id,name'])
            ->whereColumn('quantity', '<=', 'min_stock_alert')
            ->where('is_active', true)
            ->orderBy('quantity')
            ->get()
            ->map(function ($product) {
                return [
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'category' => $product->category?->name,
                    'quantity' => $product->quantity,
                    'min_stock_alert' => $product->min_stock_alert,
                    'shortage' => $product->min_stock_alert - $product->quantity,
                    'restock_value' => ($product->min_stock_alert - $product->quantity) * $product->cost_price,
                ];
            });

        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.inventory-low-stock', [
            'shop' => $shop,
            'products' => $products,
        ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="low_stock_report.pdf"',
        ]);
    }
}
