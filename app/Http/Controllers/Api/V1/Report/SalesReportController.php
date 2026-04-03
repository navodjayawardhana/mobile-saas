<?php

namespace App\Http\Controllers\Api\V1\Report;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class SalesReportController extends Controller
{
    /**
     * Get sales report
     */
    public function index(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        $query = Sale::where('status', '!=', 'voided')
            ->whereDate('sale_date', '>=', $dateFrom)
            ->whereDate('sale_date', '<=', $dateTo);

        // Summary
        $summary = [
            'total_sales' => (clone $query)->sum('total_amount'),
            'total_cost' => (clone $query)->sum('subtotal') - (clone $query)->sum('discount_amount'),
            'total_discounts' => (clone $query)->sum('discount_amount'),
            'total_tax' => (clone $query)->sum('tax_amount'),
            'total_transactions' => (clone $query)->count(),
            'paid_amount' => (clone $query)->sum('paid_amount'),
            'due_amount' => (clone $query)->sum('due_amount'),
        ];
        $summary['average_sale'] = $summary['total_transactions'] > 0
            ? round($summary['total_sales'] / $summary['total_transactions'], 2)
            : 0;

        // Daily breakdown
        $dailyBreakdown = Sale::selectRaw('DATE(sale_date) as date, SUM(total_amount) as total, COUNT(*) as count')
            ->where('status', '!=', 'voided')
            ->whereDate('sale_date', '>=', $dateFrom)
            ->whereDate('sale_date', '<=', $dateTo)
            ->groupByRaw('DATE(sale_date)')
            ->orderByRaw('DATE(sale_date)')
            ->get();

        // Payment status breakdown
        $paymentBreakdown = Sale::selectRaw('payment_status, COUNT(*) as count, SUM(total_amount) as total')
            ->where('status', '!=', 'voided')
            ->whereDate('sale_date', '>=', $dateFrom)
            ->whereDate('sale_date', '<=', $dateTo)
            ->groupBy('payment_status')
            ->get();

        // Sale type breakdown
        $typeBreakdown = Sale::selectRaw('sale_type, COUNT(*) as count, SUM(total_amount) as total')
            ->where('status', '!=', 'voided')
            ->whereDate('sale_date', '>=', $dateFrom)
            ->whereDate('sale_date', '<=', $dateTo)
            ->groupBy('sale_type')
            ->get();

        return response()->json([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => $summary,
            'daily_breakdown' => $dailyBreakdown,
            'payment_breakdown' => $paymentBreakdown,
            'type_breakdown' => $typeBreakdown,
        ]);
    }

    /**
     * Sales by product
     */
    public function byProduct(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());
        $categoryId = $request->input('category_id');
        $brandId = $request->input('brand_id');

        $query = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->leftJoin('brands', 'products.brand_id', '=', 'brands.id')
            ->where('sales.status', '!=', 'voided')
            ->whereDate('sales.sale_date', '>=', $dateFrom)
            ->whereDate('sales.sale_date', '<=', $dateTo);

        if ($categoryId) {
            $query->where('products.category_id', $categoryId);
        }

        if ($brandId) {
            $query->where('products.brand_id', $brandId);
        }

        $products = $query->selectRaw('
                products.id,
                products.name,
                products.sku,
                categories.name as category_name,
                brands.name as brand_name,
                SUM(sale_items.quantity) as total_qty,
                SUM(sale_items.total_price) as total_revenue,
                AVG(sale_items.unit_price) as avg_price
            ')
            ->groupBy('products.id', 'products.name', 'products.sku', 'categories.name', 'brands.name')
            ->orderByDesc('total_qty')
            ->paginate($request->input('per_page', 20));

        return response()->json($products);
    }

    /**
     * Sales by category
     */
    public function byCategory(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        $categories = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('sales.status', '!=', 'voided')
            ->whereDate('sales.sale_date', '>=', $dateFrom)
            ->whereDate('sales.sale_date', '<=', $dateTo)
            ->selectRaw('
                categories.id,
                categories.name,
                SUM(sale_items.quantity) as total_qty,
                SUM(sale_items.total_price) as total_revenue,
                COUNT(DISTINCT sales.id) as transaction_count
            ')
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('total_revenue')
            ->get();

        $total = $categories->sum('total_revenue');

        $categories = $categories->map(function ($category) use ($total) {
            $category->percentage = $total > 0 ? round(($category->total_revenue / $total) * 100, 2) : 0;
            return $category;
        });

        return response()->json([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'total_revenue' => $total,
            'categories' => $categories,
        ]);
    }

    /**
     * Sales by staff
     */
    public function byStaff(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        $staff = Sale::join('users', 'sales.user_id', '=', 'users.id')
            ->where('sales.status', '!=', 'voided')
            ->whereDate('sales.sale_date', '>=', $dateFrom)
            ->whereDate('sales.sale_date', '<=', $dateTo)
            ->selectRaw('
                users.id,
                users.name,
                COUNT(*) as transaction_count,
                SUM(sales.total_amount) as total_sales,
                SUM(sales.paid_amount) as total_collected,
                AVG(sales.total_amount) as avg_sale
            ')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total_sales')
            ->get();

        return response()->json([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'staff' => $staff,
        ]);
    }

    /**
     * Export sales by staff as PDF
     */
    public function exportStaffPdf(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        $staff = Sale::join('users', 'sales.user_id', '=', 'users.id')
            ->where('sales.status', '!=', 'voided')
            ->whereDate('sales.sale_date', '>=', $dateFrom)
            ->whereDate('sales.sale_date', '<=', $dateTo)
            ->selectRaw('
                users.id,
                users.name,
                COUNT(*) as transaction_count,
                SUM(sales.total_amount) as total_sales,
                SUM(sales.paid_amount) as total_collected,
                AVG(sales.total_amount) as avg_sale
            ')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total_sales')
            ->get();

        $totals = [
            'transactions' => $staff->sum('transaction_count'),
            'sales' => $staff->sum('total_sales'),
            'collected' => $staff->sum('total_collected'),
        ];

        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.sales-by-staff', [
            'shop' => $shop,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'staff' => $staff,
            'totals' => $totals,
        ]);

        $filename = "sales_by_staff_{$dateFrom}_to_{$dateTo}.pdf";

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Sales by customer
     */
    public function byCustomer(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        $customers = Sale::leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->where('sales.status', '!=', 'voided')
            ->whereDate('sales.sale_date', '>=', $dateFrom)
            ->whereDate('sales.sale_date', '<=', $dateTo)
            ->selectRaw('
                customers.id,
                COALESCE(customers.name, "Walk-in Customer") as name,
                customers.phone,
                COUNT(*) as transaction_count,
                SUM(sales.total_amount) as total_spent,
                SUM(sales.due_amount) as total_due
            ')
            ->groupBy('customers.id', 'customers.name', 'customers.phone')
            ->orderByDesc('total_spent')
            ->paginate($request->input('per_page', 20));

        return response()->json($customers);
    }

    /**
     * Export sales report as PDF
     */
    public function exportPdf(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        $query = Sale::where('status', '!=', 'voided')
            ->whereDate('sale_date', '>=', $dateFrom)
            ->whereDate('sale_date', '<=', $dateTo);

        // Summary
        $summary = [
            'total_sales' => (clone $query)->sum('total_amount'),
            'total_cost' => (clone $query)->sum('subtotal') - (clone $query)->sum('discount_amount'),
            'total_discounts' => (clone $query)->sum('discount_amount'),
            'total_tax' => (clone $query)->sum('tax_amount'),
            'total_transactions' => (clone $query)->count(),
            'paid_amount' => (clone $query)->sum('paid_amount'),
            'due_amount' => (clone $query)->sum('due_amount'),
        ];
        $summary['average_sale'] = $summary['total_transactions'] > 0
            ? round($summary['total_sales'] / $summary['total_transactions'], 2)
            : 0;

        // Daily breakdown
        $dailyBreakdown = Sale::selectRaw('DATE(sale_date) as date, SUM(total_amount) as total, COUNT(*) as count')
            ->where('status', '!=', 'voided')
            ->whereDate('sale_date', '>=', $dateFrom)
            ->whereDate('sale_date', '<=', $dateTo)
            ->groupByRaw('DATE(sale_date)')
            ->orderByRaw('DATE(sale_date)')
            ->get();

        // Payment status breakdown
        $paymentBreakdown = Sale::selectRaw('payment_status, COUNT(*) as count, SUM(total_amount) as total')
            ->where('status', '!=', 'voided')
            ->whereDate('sale_date', '>=', $dateFrom)
            ->whereDate('sale_date', '<=', $dateTo)
            ->groupBy('payment_status')
            ->get();

        // Sale type breakdown
        $typeBreakdown = Sale::selectRaw('sale_type, COUNT(*) as count, SUM(total_amount) as total')
            ->where('status', '!=', 'voided')
            ->whereDate('sale_date', '>=', $dateFrom)
            ->whereDate('sale_date', '<=', $dateTo)
            ->groupBy('sale_type')
            ->get();

        // Get shop info from authenticated user
        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.sales-report', [
            'shop' => $shop,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => $summary,
            'daily_breakdown' => $dailyBreakdown,
            'payment_breakdown' => $paymentBreakdown,
            'type_breakdown' => $typeBreakdown,
        ]);

        $filename = "sales_report_{$dateFrom}_to_{$dateTo}.pdf";

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Export sales by product as PDF
     */
    public function exportProductsPdf(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());
        $categoryId = $request->input('category_id');
        $brandId = $request->input('brand_id');

        $query = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->leftJoin('brands', 'products.brand_id', '=', 'brands.id')
            ->where('sales.status', '!=', 'voided')
            ->whereDate('sales.sale_date', '>=', $dateFrom)
            ->whereDate('sales.sale_date', '<=', $dateTo);

        if ($categoryId) {
            $query->where('products.category_id', $categoryId);
        }

        if ($brandId) {
            $query->where('products.brand_id', $brandId);
        }

        $products = $query->selectRaw('
                products.id,
                products.name,
                products.sku,
                categories.name as category_name,
                brands.name as brand_name,
                SUM(sale_items.quantity) as total_qty,
                SUM(sale_items.total_price) as total_revenue,
                AVG(sale_items.unit_price) as avg_price
            ')
            ->groupBy('products.id', 'products.name', 'products.sku', 'categories.name', 'brands.name')
            ->orderByDesc('total_qty')
            ->get();

        $totals = [
            'qty' => $products->sum('total_qty'),
            'revenue' => $products->sum('total_revenue'),
        ];

        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.sales-by-product', [
            'shop' => $shop,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'products' => $products,
            'totals' => $totals,
        ]);

        $filename = "sales_by_product_{$dateFrom}_to_{$dateTo}.pdf";

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Hourly sales distribution
     */
    public function hourlyDistribution(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        $hourly = Sale::where('status', '!=', 'voided')
            ->whereDate('sale_date', '>=', $dateFrom)
            ->whereDate('sale_date', '<=', $dateTo)
            ->selectRaw('HOUR(created_at) as hour, COUNT(*) as count, SUM(total_amount) as total')
            ->groupByRaw('HOUR(created_at)')
            ->orderByRaw('HOUR(created_at)')
            ->get();

        // Fill in missing hours
        $hourlyData = [];
        for ($i = 0; $i < 24; $i++) {
            $found = $hourly->firstWhere('hour', $i);
            $hourlyData[] = [
                'hour' => $i,
                'label' => sprintf('%02d:00', $i),
                'count' => $found ? $found->count : 0,
                'total' => $found ? $found->total : 0,
            ];
        }

        return response()->json($hourlyData);
    }
}
