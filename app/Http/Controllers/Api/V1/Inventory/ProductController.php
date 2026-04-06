<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Display a listing of products.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->with(['category:id,name', 'brand:id,name']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Brand filter
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        // Type filter
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Condition filter
        if ($request->filled('condition')) {
            $query->where('condition', $request->condition);
        }

        // Active filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Serialized filter
        if ($request->has('is_serialized')) {
            $query->where('is_serialized', $request->boolean('is_serialized'));
        }

        // Low stock filter
        if ($request->boolean('low_stock')) {
            $query->whereColumn('quantity', '<=', 'min_stock_alert')
                  ->where('min_stock_alert', '>', 0);
        }

        // Out of stock filter
        if ($request->boolean('out_of_stock')) {
            $query->where('quantity', '<=', 0);
        }

        // Sorting
        $sortField = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $products = $query->paginate($perPage);

        return response()->json([
            'products' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Search products for POS.
     */
    public function search(Request $request): JsonResponse
    {
        $search = $request->get('q', '');

        $query = Product::query()
            ->with(['category:id,name', 'brand:id,name'])
            ->where('is_active', true)
            ->where('quantity', '>', 0)
            ->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%")
                      ->orWhere('barcode', 'like', "%{$search}%");
            });

        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        $products = $query->limit(20)->get();

        return response()->json([
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'barcode' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('products')->where('shop_id', $request->user()->shop_id),
            ],
            'category_id' => 'nullable|uuid|exists:categories,id',
            'brand_id' => 'nullable|uuid|exists:brands,id',
            'type' => 'required|in:phone,accessory,spare_part',
            'condition' => 'nullable|in:new,used,refurbished',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'quantity' => 'nullable|integer|min:0',
            'min_stock_alert' => 'nullable|integer|min:0',
            'is_serialized' => 'boolean',
            'warranty_months' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'specifications' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $initialQty = $validated['quantity'] ?? 0;

        if (empty($validated['sku'])) {
            $validated['sku'] = $this->generateSku($validated['type']);
        }

        $validated['condition'] = $validated['condition'] ?? 'new';
        $validated['min_stock_alert'] = $validated['min_stock_alert'] ?? 5;
        $validated['warranty_months'] = $validated['warranty_months'] ?? 0;
        $validated['is_serialized'] = $validated['is_serialized'] ?? ($validated['type'] === 'phone');
        $validated['is_active'] = $validated['is_active'] ?? true;

        $validated['quantity'] = 0;


        $product = Product::create($validated);

        if (!$product->is_serialized && $initialQty > 0) {
            $this->stockService->recordMovement(
                $product,
                'adjustment_in',
                $initialQty,
                null,
                null,
                'Initial stock'
            );
        }

        return response()->json([
            'message' => 'Product created successfully',
            'product' => $product->fresh()->load(['category:id,name', 'brand:id,name']),
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show(string $id): JsonResponse
    {
        $product = Product::with([
            'category:id,name',
            'brand:id,name',
            'inventoryItems' => function ($q) {
                $q->where('status', 'in_stock')->limit(50);
            },
        ])->findOrFail($id);

        // Get stock movement summary
        $movements = $product->stockMovements()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return response()->json([
            'product' => $product,
            'recent_movements' => $movements,
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'barcode' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('products')
                    ->where('shop_id', $request->user()->shop_id)
                    ->ignore($product->id),
            ],
            'category_id' => 'nullable|uuid|exists:categories,id',
            'brand_id' => 'nullable|uuid|exists:brands,id',
            'type' => 'sometimes|required|in:phone,accessory,spare_part',
            'condition' => 'nullable|in:new,used,refurbished',
            'cost_price' => 'sometimes|required|numeric|min:0',
            'selling_price' => 'sometimes|required|numeric|min:0',
            'min_stock_alert' => 'nullable|integer|min:0',
            'warranty_months' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'specifications' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if (array_key_exists('warranty_months', $validated) && is_null($validated['warranty_months'])) {
            $validated['warranty_months'] = 0;
        }
        if (array_key_exists('min_stock_alert', $validated) && is_null($validated['min_stock_alert'])) {
            $validated['min_stock_alert'] = 0;
        }

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product->fresh()->load(['category:id,name', 'brand:id,name']),
        ]);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(string $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        // Check for sales
        if ($product->saleItems()->exists()) {
            return response()->json([
                'message' => 'Cannot delete product with existing sales. Consider deactivating instead.',
            ], 422);
        }

        // Check for inventory items
        if ($product->inventoryItems()->exists()) {
            return response()->json([
                'message' => 'Cannot delete product with existing inventory items.',
            ], 422);
        }

        // Check for purchase order items
        if ($product->purchaseOrderItems()->exists()) {
            return response()->json([
                'message' => 'Cannot delete product with existing purchase orders.',
            ], 422);
        }

        // Delete images
        if ($product->images) {
            foreach ($product->images as $image) {
                \Storage::disk('public')->delete($image);
            }
        }

        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully',
        ]);
    }

    /**
     * Get product by barcode.
     */
    public function getByBarcode(string $barcode): JsonResponse
    {
        $product = Product::with(['category:id,name', 'brand:id,name'])
            ->where('barcode', $barcode)
            ->first();

        if (!$product) {
            return response()->json([
                'message' => 'Product not found',
            ], 404);
        }

        return response()->json([
            'product' => $product,
        ]);
    }

    /**
     * Upload product images.
     */
    public function uploadImages(Request $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'images' => 'required|array|max:5',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $images = $product->images ?? [];

        foreach ($request->file('images') as $image) {
            $path = $image->store('products', 'public');
            $images[] = $path;
        }

        // Limit to 10 images
        $images = array_slice($images, 0, 10);

        $product->images = $images;
        $product->save();

        return response()->json([
            'message' => 'Images uploaded successfully',
            'images' => $images,
        ]);
    }

    /**
     * Delete a product image.
     */
    public function deleteImage(Request $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'image' => 'required|string',
        ]);

        $images = $product->images ?? [];
        $imageToDelete = $request->image;

        if (in_array($imageToDelete, $images)) {
            \Storage::disk('public')->delete($imageToDelete);
            $images = array_values(array_diff($images, [$imageToDelete]));
            $product->images = $images;
            $product->save();
        }

        return response()->json([
            'message' => 'Image deleted successfully',
            'images' => $images,
        ]);
    }

    /**
     * Toggle product active status.
     */
    public function toggleActive(string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->is_active = !$product->is_active;
        $product->save();

        return response()->json([
            'message' => 'Product status updated successfully',
            'product' => $product,
        ]);
    }

    /**
     * Generate unique SKU.
     */
    private function generateSku(string $type): string
    {
        $prefix = match ($type) {
            'phone' => 'PHN',
            'accessory' => 'ACC',
            'spare_part' => 'SPR',
            default => 'PRD',
        };

        $lastProduct = Product::where('sku', 'like', "{$prefix}%")
            ->orderByDesc('sku')
            ->first();

        if ($lastProduct) {
            $lastNumber = (int) substr($lastProduct->sku, strlen($prefix));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 6, '0', STR_PAD_LEFT);
    }
}
