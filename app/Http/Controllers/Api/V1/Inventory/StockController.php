<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StockController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Get stock levels for all products.
     */
    public function levels(Request $request): JsonResponse
    {
        $filters = [
            'category_id' => $request->category_id,
            'brand_id' => $request->brand_id,
            'search' => $request->search,
        ];

        $products = $this->stockService->getStockLevels($filters);

        return response()->json([
            'products' => $products,
        ]);
    }

    /**
     * Get low stock products.
     */
    public function lowStock(): JsonResponse
    {
        $products = $this->stockService->getLowStockProducts();

        return response()->json([
            'products' => $products,
            'count' => $products->count(),
        ]);
    }

    /**
     * Get out of stock products.
     */
    public function outOfStock(): JsonResponse
    {
        $products = $this->stockService->getOutOfStockProducts();

        return response()->json([
            'products' => $products,
            'count' => $products->count(),
        ]);
    }

    /**
     * Get stock movement history.
     */
    public function movements(Request $request): JsonResponse
    {
        $filters = [
            'product_id' => $request->product_id,
            'type' => $request->type,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
        ];

        $perPage = $request->get('per_page', 15);
        $movements = $this->stockService->getMovementHistory($filters, $perPage);

        return response()->json([
            'movements' => $movements->items(),
            'meta' => [
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
                'per_page' => $movements->perPage(),
                'total' => $movements->total(),
            ],
        ]);
    }

    /**
     * Perform stock adjustment for non-serialized products.
     */
    public function adjustment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|uuid|exists:products,id',
            'new_quantity' => 'required|integer|min:0',
            'reason' => 'required|string|max:500',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        // Can't adjust serialized products this way
        if ($product->is_serialized) {
            return response()->json([
                'message' => 'Cannot adjust stock for serialized products. Use inventory item management instead.',
            ], 422);
        }

        $oldQuantity = $product->quantity;
        $newQuantity = $validated['new_quantity'];

        if ($oldQuantity === $newQuantity) {
            return response()->json([
                'message' => 'No change in quantity.',
            ], 422);
        }

        $movement = $this->stockService->adjustStock(
            $product,
            $newQuantity,
            $validated['reason']
        );

        return response()->json([
            'message' => 'Stock adjusted successfully',
            'movement' => $movement,
            'old_quantity' => $oldQuantity,
            'new_quantity' => $product->fresh()->quantity,
        ]);
    }

    /**
     * Add stock for non-serialized products.
     */
    public function addStock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|uuid|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:500',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        if ($product->is_serialized) {
            return response()->json([
                'message' => 'Cannot add stock for serialized products. Use inventory item management instead.',
            ], 422);
        }

        $movement = $this->stockService->recordMovement(
            $product,
            'adjustment_in',
            $validated['quantity'],
            null,
            null,
            $validated['reason'] ?? 'Stock added manually'
        );

        return response()->json([
            'message' => 'Stock added successfully',
            'movement' => $movement,
            'new_quantity' => $product->fresh()->quantity,
        ]);
    }

    /**
     * Remove stock for non-serialized products.
     */
    public function removeStock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|uuid|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|max:500',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        if ($product->is_serialized) {
            return response()->json([
                'message' => 'Cannot remove stock for serialized products. Use inventory item management instead.',
            ], 422);
        }

        if ($product->quantity < $validated['quantity']) {
            return response()->json([
                'message' => 'Insufficient stock. Current quantity: ' . $product->quantity,
            ], 422);
        }

        $movement = $this->stockService->recordMovement(
            $product,
            'adjustment_out',
            $validated['quantity'],
            null,
            null,
            $validated['reason']
        );

        return response()->json([
            'message' => 'Stock removed successfully',
            'movement' => $movement,
            'new_quantity' => $product->fresh()->quantity,
        ]);
    }

    /**
     * Get stock valuation report.
     */
    public function valuation(Request $request): JsonResponse
    {
        $filters = [
            'category_id' => $request->category_id,
            'brand_id' => $request->brand_id,
        ];

        $valuation = $this->stockService->getStockValuation($filters);

        return response()->json($valuation);
    }

    /**
     * Get movement types for filtering.
     */
    public function movementTypes(): JsonResponse
    {
        return response()->json([
            'types' => [
                ['value' => 'purchase', 'label' => 'Purchase'],
                ['value' => 'sale', 'label' => 'Sale'],
                ['value' => 'adjustment_in', 'label' => 'Adjustment In'],
                ['value' => 'adjustment_out', 'label' => 'Adjustment Out'],
                ['value' => 'return_in', 'label' => 'Return (Customer)'],
                ['value' => 'return_out', 'label' => 'Return (Supplier)'],
                ['value' => 'damage', 'label' => 'Damage'],
            ],
        ]);
    }
}
