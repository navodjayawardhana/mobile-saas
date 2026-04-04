<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToShop;
use App\Traits\PreventDeleteIfUsed;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, HasUuid, BelongsToShop, PreventDeleteIfUsed, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'category_id',
        'brand_id',
        'sku',
        'barcode',
        'name',
        'type',
        'condition',
        'cost_price',
        'selling_price',
        'quantity',
        'min_stock_alert',
        'is_serialized',
        'warranty_months',
        'specifications',
        'images',
        'description',
        'is_active',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'is_serialized' => 'boolean',
        'is_active' => 'boolean',
        'specifications' => 'array',
        'images' => 'array',
        'warranty_months' => 'integer',
        'quantity' => 'integer',
        'min_stock_alert' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function inventoryItems(): HasMany
    {
        return $this->hasMany(InventoryItem::class);
    }

    public function availableInventoryItems(): HasMany
    {
        return $this->hasMany(InventoryItem::class)->where('status', 'in_stock');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function repairItems(): HasMany
    {
        return $this->hasMany(RepairItem::class);
    }

    public function getPreventDeleteRelations(): array
    {
        return [
            'saleItems' => 'Cannot delete this product because it has been sold.',
            'inventoryItems' => 'Cannot delete this product because it has inventory items.',
            'purchaseOrderItems' => 'Cannot delete this product because it has purchase orders.',
        ];
    }

    /**
     * Get available stock count.
     */
    public function getAvailableStockAttribute(): int
    {
        if ($this->is_serialized) {
            return $this->availableInventoryItems()->count();
        }
        return $this->quantity;
    }

    /**
     * Check if product is low on stock.
     */
    public function isLowStock(): bool
    {
        return $this->available_stock <= $this->min_stock_alert;
    }

    /**
     * Scope for low stock products.
     */
    public function scopeLowStock($query)
    {
        return $query->whereColumn('quantity', '<=', 'min_stock_alert');
    }

    /**
     * Scope for active products.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
