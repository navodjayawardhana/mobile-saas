<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToShop;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Sale extends Model
{
    use HasFactory, HasUuid, BelongsToShop, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'customer_id',
        'user_id',
        'invoice_number',
        'sale_date',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'total_amount',
        'paid_amount',
        'due_amount',
        'payment_status',
        'sale_type',
        'status',
        'notes',
    ];

    protected $casts = [
        'sale_date' => 'datetime',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($sale) {
            if (empty($sale->invoice_number)) {
                $sale->invoice_number = static::generateInvoiceNumber($sale->shop_id);
            }
        });
    }

    public static function generateInvoiceNumber(string $shopId): string
    {
        $lastSale = static::withoutGlobalScopes()
            ->where('shop_id', $shopId)
            ->orderBy('created_at', 'desc')
            ->first();

        $prefix = 'INV-' . date('Ymd') . '-';

        if ($lastSale && str_starts_with($lastSale->invoice_number, $prefix)) {
            $lastNumber = intval(substr($lastSale->invoice_number, strlen($prefix)));
            return $prefix . str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        }

        return $prefix . '0001';
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    public function installmentPlan(): HasOne
    {
        return $this->hasOne(InstallmentPlan::class);
    }

    /**
     * Calculate and update totals.
     */
    public function calculateTotals(): void
    {
        $this->subtotal = $this->items()->sum('total_price');
        $this->total_amount = $this->subtotal + $this->tax_amount - $this->discount_amount;
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
     * Add payment to sale.
     */
    public function addPayment(float $amount, string $paymentMethodId, ?string $reference = null): Payment
    {
        $payment = $this->payments()->create([
            'shop_id' => $this->shop_id,
            'user_id' => auth()->id(),
            'amount' => $amount,
            'payment_method_id' => $paymentMethodId,
            'reference_number' => $reference,
            'payment_date' => now(),
        ]);

        $this->paid_amount += $amount;
        $this->due_amount = $this->total_amount - $this->paid_amount;
        $this->updatePaymentStatus();
        $this->save();

        // Update customer totals
        if ($this->customer) {
            $this->customer->updateTotals();
        }

        return $payment;
    }

    /**
     * Get profit for this sale.
     */
    public function getProfit(): float
    {
        $totalCost = $this->items()->sum(DB::raw('cost_price * quantity'));
        return $this->total_amount - $totalCost;
    }
}
