<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepairStatusHistory extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'repair_status_history';

    protected $fillable = [
        'repair_id',
        'user_id',
        'from_status',
        'to_status',
        'notes',
    ];

    public function repair(): BelongsTo
    {
        return $this->belongsTo(Repair::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
