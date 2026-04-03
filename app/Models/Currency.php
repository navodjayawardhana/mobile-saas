<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToShop;
use App\Traits\PreventDeleteIfUsed;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Currency extends Model
{
    use HasFactory, HasUuid, BelongsToShop, PreventDeleteIfUsed, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'code',
        'name',
        'symbol',
        'exchange_rate',
        'is_default',
    ];

    protected $casts = [
        'exchange_rate' => 'decimal:6',
        'is_default' => 'boolean',
    ];

    public function getPreventDeleteRelations(): array
    {
        return [];
    }

    /**
     * Set this currency as the default and unset others.
     */
    public function setAsDefault(): void
    {
        // Unset other defaults
        static::where('shop_id', $this->shop_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        // Set this as default
        $this->update(['is_default' => true]);

        // Update shop's default currency
        $this->shop->update(['default_currency_id' => $this->id]);
    }
}
