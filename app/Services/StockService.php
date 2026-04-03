<?php

namespace App\Services;

use App\Models\Product;
use App\Models\InventoryItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Record a stock movement and update product quantity.
     */
    public function recordMovement(
        Product $product,
        string $type,
        int $quantity,
        ?string $referenceType = null,
        ?string $referenceId = null,
        ?string $notes = null,
        ?string $userId = null
    ): StockMovement {
        return DB::transaction(function () use ($product, $type, $quantity, $referenceType, $referenceId, $notes, $userId) {
            // Create stock movement
            $movement = StockMovement::create([
                'shop_id' => $product->shop_id,
                'product_id' => $product->id,
                'user_id' => $userId ?? auth()->id(),
                'type' => $type,
                'quantity' => $quantity,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes,
            ]);

            // Update product quantity based on movement type
            $this->updateProductQuantity($product, $type, $quantity);

            return $movement;
        });
    }

    /**
     * Update product quantity based on movement type.
     */
    private function updateProductQuantity(Product $product, string $type, int $quantity): void
    {
        // For serialized products, count is based on inventory_items
        if ($product->is_serialized) {
            $product->quantity = $product->inventoryItems()
                ->where('status', 'in_stock')
                ->count();
            $product->save();
            return;
        }

        // For non-serialized products
        switch ($type) {
            case 'purchase':
            case 'return_in':
            case 'adjustment_in':
                $product->increment('quantity', $quantity);
                break;
            case 'sale':
            case 'return_out':
            case 'adjustment_out':
            case 'damage':
                $product->decrement('quantity', $quantity);
                break;
            case 'adjustment':
                // Direct adjustment - set to specific quantity
                $product->quantity = $quantity;
                $product->save();
                break;
        }
    }

    /**
     * Add inventory item (for serialized products).
     */
    public function addInventoryItem(
        Product $product,
        string $serialNumber,
        float $costPrice,
        string $condition = 'new',
        ?string $status = 'in_stock',
        ?\DateTime $warrantyExpiresAt = null,
        ?string $referenceType = null,
        ?string $referenceId = null
    ): InventoryItem {
        return DB::transaction(function () use ($product, $serialNumber, $costPrice, $condition, $status, $warrantyExpiresAt, $referenceType, $referenceId) {
            $item = InventoryItem::create([
                'shop_id' => $product->shop_id,
                'product_id' => $product->id,
                'serial_number' => $serialNumber,
                'cost_price' => $costPrice,
                'condition' => $condition,
                'status' => $status,
                'warranty_expires_at' => $warrantyExpiresAt,
            ]);

            // Record stock movement
            $this->recordMovement(
                $product,
                'purchase',
                1,
                $referenceType,
                $referenceId,
                "Added inventory item: {$serialNumber}"
            );

            return $item;
        });
    }

    /**
     * Sell inventory item (for serialized products).
     */
    public function sellInventoryItem(
        InventoryItem $item,
        ?string $referenceType = null,
        ?string $referenceId = null
    ): void {
        DB::transaction(function () use ($item, $referenceType, $referenceId) {
            $item->status = 'sold';
            $item->save();

            // Record stock movement
            $this->recordMovement(
                $item->product,
                'sale',
                1,
                $referenceType,
                $referenceId,
                "Sold inventory item: {$item->serial_number}"
            );
        });
    }

    /**
     * Get stock levels for all products.
     */
    public function getStockLevels(array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        $query = Product::query()
            ->with(['category:id,name', 'brand:id,name'])
            ->select(['id', 'name', 'sku', 'barcode', 'category_id', 'brand_id', 'quantity', 'min_stock_alert', 'is_serialized', 'cost_price', 'selling_price']);

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Get low stock products.
     */
    public function getLowStockProducts(): \Illuminate\Database\Eloquent\Collection
    {
        return Product::query()
            ->with(['category:id,name', 'brand:id,name'])
            ->whereColumn('quantity', '<=', 'min_stock_alert')
            ->where('min_stock_alert', '>', 0)
            ->orderBy('quantity')
            ->get();
    }

    /**
     * Get out of stock products.
     */
    public function getOutOfStockProducts(): \Illuminate\Database\Eloquent\Collection
    {
        return Product::query()
            ->with(['category:id,name', 'brand:id,name'])
            ->where('quantity', '<=', 0)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get stock movement history.
     */
    public function getMovementHistory(array $filters = [], int $perPage = 15)
    {
        $query = StockMovement::query()
            ->with(['product:id,name,sku', 'user:id,name']);

        if (!empty($filters['product_id'])) {
            $query->where('product_id', $filters['product_id']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    /**
     * Perform stock adjustment.
     */
    public function adjustStock(
        Product $product,
        int $newQuantity,
        string $reason,
        ?string $userId = null
    ): StockMovement {
        $currentQuantity = $product->quantity;
        $difference = $newQuantity - $currentQuantity;

        $type = $difference >= 0 ? 'adjustment_in' : 'adjustment_out';
        $quantity = abs($difference);

        return $this->recordMovement(
            $product,
            $type,
            $quantity,
            null,
            null,
            "Stock adjustment: {$reason}. Changed from {$currentQuantity} to {$newQuantity}",
            $userId
        );
    }

    /**
     * Calculate stock valuation.
     */
    public function getStockValuation(array $filters = []): array
    {
        $query = Product::query();

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        $products = $query->where('quantity', '>', 0)->get();

        $totalCostValue = 0;
        $totalRetailValue = 0;
        $items = [];

        foreach ($products as $product) {
            $costValue = $product->quantity * $product->cost_price;
            $retailValue = $product->quantity * $product->selling_price;

            $totalCostValue += $costValue;
            $totalRetailValue += $retailValue;

            $items[] = [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'quantity' => $product->quantity,
                'cost_price' => $product->cost_price,
                'selling_price' => $product->selling_price,
                'cost_value' => $costValue,
                'retail_value' => $retailValue,
            ];
        }

        return [
            'items' => $items,
            'summary' => [
                'total_products' => count($items),
                'total_quantity' => array_sum(array_column($items, 'quantity')),
                'total_cost_value' => $totalCostValue,
                'total_retail_value' => $totalRetailValue,
                'potential_profit' => $totalRetailValue - $totalCostValue,
            ],
        ];
    }
}
