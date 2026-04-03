<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = [
        'sale_id',
        'product_id',
        'inventory_item_id',
        'quantity',
        'unit_price',
        'cost_price',
        'discount_amount',
        'total_price',
        'warranty_months',
        'warranty_expires_at',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_price' => 'decimal:2',
        'warranty_expires_at' => 'date',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    /**
     * Calculate total price.
     */
    public function calculateTotal(): float
    {
        return ($this->unit_price * $this->quantity) - $this->discount_amount;
    }

    /**
     * Get profit for this item.
     */
    public function getProfit(): float
    {
        return $this->total_price - ($this->cost_price * $this->quantity);
    }
}
