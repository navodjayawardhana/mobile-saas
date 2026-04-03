<?php

namespace App\Traits;

use App\Models\Shop;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToShop
{
    /**
     * Boot the trait.
     */
    protected static function bootBelongsToShop(): void
    {
        // Auto-set shop_id on creation
        static::creating(function ($model) {
            if (empty($model->shop_id) && auth()->check() && auth()->user()->shop_id) {
                $model->shop_id = auth()->user()->shop_id;
            }
        });

        // Global scope to filter by current shop
        static::addGlobalScope('shop', function (Builder $builder) {
            if (auth()->check() && auth()->user()->shop_id) {
                $builder->where($builder->getModel()->getTable() . '.shop_id', auth()->user()->shop_id);
            }
        });
    }

    /**
     * Get the shop that owns the model.
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Scope a query to a specific shop.
     */
    public function scopeForShop(Builder $query, string $shopId): Builder
    {
        return $query->withoutGlobalScope('shop')->where('shop_id', $shopId);
    }

    /**
     * Scope a query to bypass shop filtering.
     */
    public function scopeWithoutShopScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('shop');
    }
}
