<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepairItem extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = [
        'repair_id',
        'product_id',
        'inventory_item_id',
        'description',
        'type',
        'quantity',
        'unit_cost',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function repair(): BelongsTo
    {
        return $this->belongsTo(Repair::class);
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
        return $this->unit_price * $this->quantity;
    }

    /**
     * Get profit for this item.
     */
    public function getProfit(): float
    {
        return $this->total_price - ($this->unit_cost * $this->quantity);
    }
}
