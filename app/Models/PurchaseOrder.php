<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToShop;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrder extends Model
{
    use HasFactory, HasUuid, BelongsToShop, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'supplier_id',
        'user_id',
        'po_number',
        'order_date',
        'expected_date',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'shipping_cost',
        'total_amount',
        'paid_amount',
        'due_amount',
        'status',
        'payment_status',
        'notes',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($po) {
            if (empty($po->po_number)) {
                $po->po_number = static::generatePoNumber($po->shop_id);
            }
        });
    }

    public static function generatePoNumber(string $shopId): string
    {
        $lastPo = static::withoutGlobalScopes()
            ->where('shop_id', $shopId)
            ->orderBy('created_at', 'desc')
            ->first();

        if ($lastPo) {
            $lastNumber = intval(substr($lastPo->po_number, 3));
            return 'PO-' . str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
        }

        return 'PO-000001';
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function inventoryItems(): HasMany
    {
        return $this->hasMany(InventoryItem::class);
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    /**
     * Calculate and update totals.
     */
    public function calculateTotals(): void
    {
        $this->subtotal = $this->items()->sum('total_cost');
        $this->total_amount = $this->subtotal + $this->tax_amount + $this->shipping_cost - $this->discount_amount;
        $this->due_amount = $this->total_amount - $this->paid_amount;
        $this->updatePaymentStatus();
        $this->save();
    }

    /**
     * Update payment status based on amounts.
     */
    public function updatePaymentStatus(): void
    {
        if ($this->paid_amount >= $this->total_amount) {
            $this->payment_status = 'paid';
        } elseif ($this->paid_amount > 0) {
            $this->payment_status = 'partial';
        } else {
            $this->payment_status = 'unpaid';
        }
    }

    /**
     * Check if PO is fully received.
     */
    public function isFullyReceived(): bool
    {
        return $this->items()->whereColumn('quantity_received', '<', 'quantity_ordered')->doesntExist();
    }
}
