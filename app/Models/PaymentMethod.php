<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToShop;
use App\Traits\PreventDeleteIfUsed;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaymentMethod extends Model
{
    use HasFactory, HasUuid, BelongsToShop, PreventDeleteIfUsed, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'name',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function supplierPayments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public function getPreventDeleteRelations(): array
    {
        return [
            'payments' => 'Cannot delete this payment method because it has been used in payments.',
            'supplierPayments' => 'Cannot delete this payment method because it has been used in supplier payments.',
        ];
    }
}
