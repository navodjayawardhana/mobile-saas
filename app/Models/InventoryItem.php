<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToShop;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryItem extends Model
{
    use HasFactory, HasUuid, BelongsToShop, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'product_id',
        'serial_number',
        'cost_price',
        'condition',
        'status',
        'warranty_expires_at',
        'purchase_order_id',
        'notes',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'warranty_expires_at' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function repairItems(): HasMany
    {
        return $this->hasMany(RepairItem::class);
    }

    /**
     * Scope for available/in_stock items.
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'in_stock');
    }

    /**
     * Scope for in_stock items.
     */
    public function scopeInStock($query)
    {
        return $query->where('status', 'in_stock');
    }

    /**
     * Mark item as sold.
     */
    public function markAsSold(): void
    {
        $this->update(['status' => 'sold']);
    }

    /**
     * Mark item as reserved.
     */
    public function markAsReserved(): void
    {
        $this->update(['status' => 'reserved']);
    }

    /**
     * Mark item as in_stock.
     */
    public function markAsInStock(): void
    {
        $this->update(['status' => 'in_stock']);
    }

    /**
     * Check if item is in stock.
     */
    public function isInStock(): bool
    {
        return $this->status === 'in_stock';
    }

    /**
     * Check if item is available (alias for isInStock).
     */
    public function isAvailable(): bool
    {
        return $this->status === 'in_stock';
    }

    /**
     * Check if warranty is still valid.
     */
    public function hasValidWarranty(): bool
    {
        if (!$this->warranty_expires_at) {
            return false;
        }

        return $this->warranty_expires_at->isFuture();
    }
}
