<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class InventoryItemController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Display a listing of inventory items.
     */
    public function index(Request $request): JsonResponse
    {
        $query = InventoryItem::query()
            ->with(['product:id,name,sku,type,selling_price']);

        // Search filter (serial/IMEI)
        if ($request->filled('search')) {
            $query->where('serial_number', 'like', "%{$request->search}%");
        }

        // Product filter
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Condition filter
        if ($request->filled('condition')) {
            $query->where('condition', $request->condition);
        }

        // Warranty expiring soon filter
        if ($request->boolean('warranty_expiring')) {
            $query->where('warranty_expires_at', '<=', now()->addDays(30))
                  ->where('warranty_expires_at', '>', now());
        }

        // Sorting
        $sortField = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $items = $query->paginate($perPage);

        return response()->json([
            'inventory_items' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    /**
     * Store a newly created inventory item.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|uuid|exists:products,id',
            'serial_number' => [
                'required',
                'string',
                'max:100',
                Rule::unique('inventory_items')->where('shop_id', $request->user()->shop_id),
            ],
            'cost_price' => 'required|numeric|min:0',
            'condition' => 'nullable|in:new,used,refurbished',
            'status' => 'nullable|in:in_stock,reserved,sold,returned,damaged',
            'warranty_expires_at' => 'nullable|date',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        // Verify product is serialized
        if (!$product->is_serialized) {
            return response()->json([
                'message' => 'This product is not serialized. Use stock adjustment for non-serialized products.',
            ], 422);
        }

        // Calculate warranty if product has warranty_months
        if (empty($validated['warranty_expires_at']) && $product->warranty_months) {
            $validated['warranty_expires_at'] = now()->addMonths((int) $product->warranty_months);
        }

        $validated['condition'] = $validated['condition'] ?? 'new';
        $validated['status'] = $validated['status'] ?? 'in_stock';
        $validated['shop_id'] = $request->user()->shop_id;

        $item = InventoryItem::create($validated);

        // Record stock movement
        $this->stockService->recordMovement(
            $product,
            'purchase',
            1,
            'inventory_item',
            $item->id,
            "Added inventory item: {$item->serial_number}"
        );

        return response()->json([
            'message' => 'Inventory item created successfully',
            'inventory_item' => $item->load('product:id,name,sku'),
        ], 201);
    }

    /**
     * Store multiple inventory items at once.
     */
    public function storeBulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|uuid|exists:products,id',
            'items' => 'required|array|min:1|max:100',
            'items.*.serial_number' => [
                'required',
                'string',
                'max:100',
                'distinct',
            ],
            'items.*.cost_price' => 'required|numeric|min:0',
            'items.*.condition' => 'nullable|in:new,used,refurbished',
            'items.*.warranty_expires_at' => 'nullable|date',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        if (!$product->is_serialized) {
            return response()->json([
                'message' => 'This product is not serialized.',
            ], 422);
        }

        // Check for existing serial numbers
        $serialNumbers = array_column($validated['items'], 'serial_number');
        $existing = InventoryItem::where('shop_id', $request->user()->shop_id)
            ->whereIn('serial_number', $serialNumbers)
            ->pluck('serial_number')
            ->toArray();

        if (!empty($existing)) {
            return response()->json([
                'message' => 'Some serial numbers already exist.',
                'duplicates' => $existing,
            ], 422);
        }

        $createdItems = [];

        foreach ($validated['items'] as $itemData) {
            $warrantyExpires = $itemData['warranty_expires_at'] ?? null;
            if (empty($warrantyExpires) && $product->warranty_months) {
                $warrantyExpires = now()->addMonths((int) $product->warranty_months);
            }

            $item = InventoryItem::create([
                'shop_id' => $request->user()->shop_id,
                'product_id' => $product->id,
                'serial_number' => $itemData['serial_number'],
                'cost_price' => $itemData['cost_price'],
                'condition' => $itemData['condition'] ?? 'new',
                'status' => 'in_stock',
                'warranty_expires_at' => $warrantyExpires,
            ]);

            $createdItems[] = $item;
        }

        // Record single stock movement for all items
        $this->stockService->recordMovement(
            $product,
            'purchase',
            count($createdItems),
            null,
            null,
            "Bulk added " . count($createdItems) . " inventory items"
        );

        return response()->json([
            'message' => count($createdItems) . ' inventory items created successfully',
            'inventory_items' => $createdItems,
        ], 201);
    }

    /**
     * Display the specified inventory item.
     */
    public function show(string $id): JsonResponse
    {
        $item = InventoryItem::with([
            'product:id,name,sku,type,category_id,brand_id,selling_price',
            'product.category:id,name',
            'product.brand:id,name',
        ])->findOrFail($id);

        return response()->json([
            'inventory_item' => $item,
        ]);
    }

    /**
     * Get inventory item by serial number.
     */
    public function getBySerial(string $serial): JsonResponse
    {
        $item = InventoryItem::with([
            'product:id,name,sku,type,category_id,brand_id,selling_price',
            'product.category:id,name',
            'product.brand:id,name',
        ])->where('serial_number', $serial)->first();

        if (!$item) {
            return response()->json([
                'message' => 'Inventory item not found',
            ], 404);
        }

        return response()->json([
            'inventory_item' => $item,
        ]);
    }

    /**
     * Update the specified inventory item.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $item = InventoryItem::findOrFail($id);

        // Can't update sold items
        if ($item->status === 'sold') {
            return response()->json([
                'message' => 'Cannot update sold inventory items.',
            ], 422);
        }

        $validated = $request->validate([
            'serial_number' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('inventory_items')
                    ->where('shop_id', $request->user()->shop_id)
                    ->ignore($item->id),
            ],
            'cost_price' => 'sometimes|required|numeric|min:0',
            'condition' => 'nullable|in:new,used,refurbished',
            'status' => 'nullable|in:in_stock,reserved,returned,damaged',
            'warranty_expires_at' => 'nullable|date',
        ]);

        $oldStatus = $item->status;
        $item->update($validated);

        // If status changed to damaged, record movement
        if (isset($validated['status']) && $validated['status'] === 'damaged' && $oldStatus !== 'damaged') {
            $this->stockService->recordMovement(
                $item->product,
                'damage',
                1,
                'inventory_item',
                $item->id,
                "Item marked as damaged: {$item->serial_number}"
            );
        }

        return response()->json([
            'message' => 'Inventory item updated successfully',
            'inventory_item' => $item->fresh()->load('product:id,name,sku'),
        ]);
    }

    /**
     * Remove the specified inventory item.
     */
    public function destroy(string $id): JsonResponse
    {
        $item = InventoryItem::findOrFail($id);

        // Can't delete sold items
        if ($item->status === 'sold') {
            return response()->json([
                'message' => 'Cannot delete sold inventory items.',
            ], 422);
        }

        // Check if used in sale items
        if ($item->saleItem) {
            return response()->json([
                'message' => 'Cannot delete inventory item linked to a sale.',
            ], 422);
        }

        // Record stock movement if was in stock
        if ($item->status === 'in_stock') {
            $this->stockService->recordMovement(
                $item->product,
                'adjustment_out',
                1,
                'inventory_item',
                $item->id,
                "Deleted inventory item: {$item->serial_number}"
            );
        }

        $item->delete();

        return response()->json([
            'message' => 'Inventory item deleted successfully',
        ]);
    }

    /**
     * Get available inventory items for a product (for POS).
     */
    public function getAvailable(string $productId): JsonResponse
    {
        $items = InventoryItem::where('product_id', $productId)
            ->where('status', 'in_stock')
            ->orderBy('created_at')
            ->get(['id', 'serial_number', 'condition', 'cost_price', 'warranty_expires_at']);

        return response()->json([
            'inventory_items' => $items,
        ]);
    }
}
