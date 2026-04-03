<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Installment extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = [
        'installment_plan_id',
        'installment_number',
        'amount',
        'due_date',
        'paid_date',
        'paid_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_date' => 'date',
        'paid_date' => 'date',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(InstallmentPlan::class, 'installment_plan_id');
    }

    /**
     * Get remaining amount.
     */
    public function getRemainingAmountAttribute(): float
    {
        return $this->amount - $this->paid_amount;
    }

    /**
     * Check if overdue.
     */
    public function isOverdue(): bool
    {
        return $this->status !== 'paid' && $this->due_date->isPast();
    }

    /**
     * Record payment.
     */
    public function recordPayment(float $amount): void
    {
        $this->paid_amount += $amount;
        $this->paid_date = now();

        if ($this->paid_amount >= $this->amount) {
            $this->status = 'paid';
        } else {
            $this->status = 'partial';
        }

        $this->save();

        // Update plan status
        $this->plan->updateStatus();
    }

    /**
     * Update overdue status.
     */
    public function updateOverdueStatus(): void
    {
        if ($this->isOverdue() && $this->status === 'pending') {
            $this->update(['status' => 'overdue']);
        }
    }
}
