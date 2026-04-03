<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToShop;
use App\Traits\PreventDeleteIfUsed;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, HasUuid, BelongsToShop, PreventDeleteIfUsed, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'name',
        'email',
        'phone',
        'address',
        'customer_type',
        'credit_limit',
        'total_purchases',
        'total_due',
        'notes',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'total_purchases' => 'decimal:2',
        'total_due' => 'decimal:2',
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function repairs(): HasMany
    {
        return $this->hasMany(Repair::class);
    }

    public function installmentPlans(): HasMany
    {
        return $this->hasMany(InstallmentPlan::class);
    }

    public function getPreventDeleteRelations(): array
    {
        return [
            'sales' => 'Cannot delete this customer because they have sales records.',
            'repairs' => 'Cannot delete this customer because they have repair records.',
        ];
    }

    /**
     * Update customer totals.
     */
    public function updateTotals(): void
    {
        $this->total_purchases = $this->sales()->sum('total_amount');
        $this->total_due = $this->sales()->sum('due_amount');
        $this->save();
    }

    /**
     * Check if customer can make credit purchase.
     */
    public function canMakeCreditPurchase(float $amount): bool
    {
        if ($this->credit_limit <= 0) {
            return false;
        }

        return ($this->total_due + $amount) <= $this->credit_limit;
    }
}
