<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToShop;
use App\Traits\PreventDeleteIfUsed;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, HasUuid, BelongsToShop, PreventDeleteIfUsed, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
        'payment_terms',
        'total_purchases',
        'total_due',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'total_purchases' => 'decimal:2',
        'total_due' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public function getPreventDeleteRelations(): array
    {
        return [
            'purchaseOrders' => 'Cannot delete this supplier because they have purchase orders.',
        ];
    }

    /**
     * Update supplier totals.
     */
    public function updateTotals(): void
    {
        $this->total_purchases = $this->purchaseOrders()->sum('total_amount');
        $this->total_due = $this->purchaseOrders()->sum('due_amount');
        $this->save();
    }

    /**
     * Scope for active suppliers.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
