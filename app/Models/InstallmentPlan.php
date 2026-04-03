<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToShop;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InstallmentPlan extends Model
{
    use HasFactory, HasUuid, BelongsToShop, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'sale_id',
        'customer_id',
        'total_amount',
        'down_payment',
        'remaining_amount',
        'number_of_installments',
        'installment_amount',
        'interest_rate',
        'status',
        'start_date',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'down_payment' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'installment_amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'start_date' => 'date',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function installments(): HasMany
    {
        return $this->hasMany(Installment::class);
    }

    /**
     * Get paid amount.
     */
    public function getPaidAmountAttribute(): float
    {
        return $this->down_payment + $this->installments()->sum('paid_amount');
    }

    /**
     * Get remaining balance.
     */
    public function getRemainingBalanceAttribute(): float
    {
        return $this->total_amount - $this->paid_amount;
    }

    /**
     * Get overdue installments.
     */
    public function getOverdueInstallments()
    {
        return $this->installments()
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->get();
    }

    /**
     * Create installment schedule.
     */
    public function createSchedule(): void
    {
        $dueDate = $this->start_date->copy();

        for ($i = 1; $i <= $this->number_of_installments; $i++) {
            $dueDate->addMonth();

            $this->installments()->create([
                'installment_number' => $i,
                'amount' => $this->installment_amount,
                'due_date' => $dueDate->copy(),
                'status' => 'pending',
            ]);
        }
    }

    /**
     * Update plan status based on installments.
     */
    public function updateStatus(): void
    {
        $allPaid = $this->installments()->where('status', '!=', 'paid')->doesntExist();

        if ($allPaid) {
            $this->update(['status' => 'completed']);
        }
    }
}
