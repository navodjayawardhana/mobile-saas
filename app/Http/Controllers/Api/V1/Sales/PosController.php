<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\InventoryItem;
use App\Services\SaleService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class PosController extends Controller
{
    protected SaleService $saleService;

    public function __construct(SaleService $saleService)
    {
        $this->saleService = $saleService;
    }

    /**
     * Search products for POS.
     */
    public function searchProducts(Request $request): JsonResponse
    {
        $search = $request->get('q', '');

        $products = Product::with(['category:id,name', 'brand:id,name'])
            ->where('is_active', true)
            ->where('quantity', '>', 0)
            ->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            })
            ->limit(20)
            ->get(['id', 'name', 'sku', 'barcode', 'category_id', 'brand_id', 'type', 'selling_price', 'quantity', 'is_serialized', 'images']);

        return response()->json([
            'products' => $products,
        ]);
    }

    /**
     * Get product by barcode for POS.
     */
    public function getByBarcode(string $barcode): JsonResponse
    {
        $product = Product::with(['category:id,name', 'brand:id,name'])
            ->where('barcode', $barcode)
            ->where('is_active', true)
            ->first();

        if (!$product) {
            return response()->json([
                'message' => 'Product not found',
            ], 404);
        }

        if ($product->quantity <= 0) {
            return response()->json([
                'message' => 'Product is out of stock',
            ], 422);
        }

        return response()->json([
            'product' => $product,
        ]);
    }

    /**
     * Get available inventory items for a serialized product.
     */
    public function getInventoryItems(string $productId): JsonResponse
    {
        $items = InventoryItem::where('product_id', $productId)
            ->where('status', 'in_stock')
            ->orderBy('created_at')
            ->get(['id', 'serial_number', 'condition', 'cost_price', 'warranty_expires_at']);

        return response()->json([
            'inventory_items' => $items,
        ]);
    }

    /**
     * Create a quick POS sale.
     */
    public function sale(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.inventory_item_id' => 'nullable|uuid|exists:inventory_items,id',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'payment_method_id' => 'required|uuid|exists:payment_methods,id',
            'payment_reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $validated['sale_type'] = 'direct';

        try {
            $sale = $this->saleService->createSale($validated);

            return response()->json([
                'message' => 'Sale completed successfully',
                'sale' => $sale,
                'invoice' => $this->saleService->getInvoiceData($sale),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Hold a sale for later.
     */
    public function hold(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.inventory_item_id' => 'nullable|uuid|exists:inventory_items,id',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $shopId = auth()->user()->shop_id;
        $userId = auth()->id();
        $holdId = uniqid('hold_');

        $heldSale = [
            'id' => $holdId,
            'user_id' => $userId,
            'user_name' => auth()->user()->name,
            'customer_id' => $validated['customer_id'] ?? null,
            'customer_name' => $validated['customer_name'] ?? null,
            'items' => $validated['items'],
            'discount_amount' => $validated['discount_amount'] ?? 0,
            'notes' => $validated['notes'] ?? null,
            'held_at' => now()->toISOString(),
        ];

        // Store in cache for 24 hours
        $cacheKey = "held_sales_{$shopId}";
        $heldSales = Cache::get($cacheKey, []);
        $heldSales[$holdId] = $heldSale;
        Cache::put($cacheKey, $heldSales, now()->addHours(24));

        return response()->json([
            'message' => 'Sale held successfully',
            'held_sale' => $heldSale,
        ]);
    }

    /**
     * Get held sales.
     */
    public function getHeld(): JsonResponse
    {
        $shopId = auth()->user()->shop_id;
        $cacheKey = "held_sales_{$shopId}";
        $heldSales = Cache::get($cacheKey, []);

        // Enrich with product details
        foreach ($heldSales as &$held) {
            foreach ($held['items'] as &$item) {
                $product = Product::find($item['product_id']);
                if ($product) {
                    $item['product'] = [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'selling_price' => $product->selling_price,
                    ];
                }
            }
        }

        return response()->json([
            'held_sales' => array_values($heldSales),
        ]);
    }

    /**
     * Delete a held sale.
     */
    public function deleteHeld(string $id): JsonResponse
    {
        $shopId = auth()->user()->shop_id;
        $cacheKey = "held_sales_{$shopId}";
        $heldSales = Cache::get($cacheKey, []);

        if (!isset($heldSales[$id])) {
            return response()->json([
                'message' => 'Held sale not found',
            ], 404);
        }

        unset($heldSales[$id]);
        Cache::put($cacheKey, $heldSales, now()->addHours(24));

        return response()->json([
            'message' => 'Held sale deleted successfully',
        ]);
    }

    /**
     * Resume a held sale.
     */
    public function resumeHeld(string $id): JsonResponse
    {
        $shopId = auth()->user()->shop_id;
        $cacheKey = "held_sales_{$shopId}";
        $heldSales = Cache::get($cacheKey, []);

        if (!isset($heldSales[$id])) {
            return response()->json([
                'message' => 'Held sale not found',
            ], 404);
        }

        $heldSale = $heldSales[$id];

        // Enrich with current product details
        foreach ($heldSale['items'] as &$item) {
            $product = Product::with(['category:id,name', 'brand:id,name'])->find($item['product_id']);
            if ($product) {
                $item['product'] = $product;
                // Check if still in stock
                $item['in_stock'] = $product->quantity > 0;
            }
        }

        // Remove from held sales
        unset($heldSales[$id]);
        Cache::put($cacheKey, $heldSales, now()->addHours(24));

        return response()->json([
            'held_sale' => $heldSale,
        ]);
    }

    /**
     * Get quick access products (best sellers).
     */
    public function quickProducts(): JsonResponse
    {
        // Get top 12 active products by sales count
        $products = Product::where('is_active', true)
            ->withCount(['saleItems', 'availableInventoryItems'])
            ->orderByDesc('sale_items_count')
            ->limit(12)
            ->get(['id', 'name', 'sku', 'selling_price', 'quantity', 'is_serialized', 'images']);

        // Add available stock info
        $products->each(function ($product) {
            $product->available_stock = $product->is_serialized
                ? $product->available_inventory_items_count
                : $product->quantity;
        });

        return response()->json([
            'products' => $products,
        ]);
    }
}
