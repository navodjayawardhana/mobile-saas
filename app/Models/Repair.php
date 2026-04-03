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
use Carbon\Carbon;

class Repair extends Model
{
    use HasFactory, HasUuid, BelongsToShop, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'customer_id',
        'technician_id',
        'received_by_id',
        'job_number',
        'device_type',
        'device_brand',
        'device_model',
        'serial_imei',
        'device_condition',
        'reported_issues',
        'diagnosis',
        'accessories_received',
        'estimated_cost',
        'final_cost',
        'paid_amount',
        'status',
        'priority',
        'received_at',
        'estimated_completion',
        'completed_at',
        'delivered_at',
        'warranty_days',
        'notes',
        'internal_notes',
    ];

    protected $casts = [
        'accessories_received' => 'array',
        'estimated_cost' => 'decimal:2',
        'final_cost' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'received_at' => 'datetime',
        'estimated_completion' => 'datetime',
        'completed_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    protected $appends = [
        'due_amount',
        'warranty_expires_at'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($repair) {
            if (empty($repair->job_number)) {
                $repair->job_number = static::generateJobNumber($repair->shop_id);
            }
        });
    }

    public static function generateJobNumber(string $shopId): string
    {
        $lastRepair = static::withoutGlobalScopes()
            ->where('shop_id', $shopId)
            ->orderBy('created_at', 'desc')
            ->first();

        $prefix = 'REP-' . date('Ymd') . '-';

        if ($lastRepair && str_starts_with($lastRepair->job_number, $prefix)) {
            $lastNumber = intval(substr($lastRepair->job_number, strlen($prefix)));
            return $prefix . str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        }

        return $prefix . '0001';
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RepairItem::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(RepairStatusHistory::class)->orderBy('created_at', 'desc');
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    /**
     * Get due amount.
     */
    public function getDueAmountAttribute(): float
    {
        return $this->final_cost - $this->paid_amount;
    }

    /**
     * Calculate final cost from items.
     */
    public function calculateFinalCost(): void
    {
        $this->final_cost = $this->items()->sum('total_price');
        $this->save();
    }

    /**
     * Update status with history.
     */
    public function updateStatus(string $newStatus, ?string $notes = null): void
    {
        $oldStatus = $this->status;

        $this->statusHistory()->create([
            'user_id' => auth()->id(),
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'notes' => $notes,
        ]);

        $this->status = $newStatus;

        if ($newStatus === 'completed') {
            $this->completed_at = now();
        } elseif ($newStatus === 'delivered') {
            $this->delivered_at = now();
        }

        $this->save();

        // Dispatch event for notifications
        event(new \App\Events\RepairStatusChanged($this, $oldStatus, $newStatus, $notes));
    }

    /**
     * Get warranty expiry date.
     */
    public function getWarrantyExpiresAtAttribute(): ?Carbon
    {
        if ($this->warranty_days <= 0 || !$this->delivered_at) {
            return null;
        }

        return $this->delivered_at->copy()->addDays($this->warranty_days);
    }

    /**
     * Check if warranty is valid.
     */
    public function hasValidWarranty(): bool
    {
        $expiresAt = $this->warranty_expires_at;

        if (!$expiresAt) {
            return false;
        }

        return $expiresAt->isFuture();
    }
}
