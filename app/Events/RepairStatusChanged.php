<?php

namespace App\Events;

use App\Models\Repair;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RepairStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Repair $repair;
    public string $oldStatus;
    public string $newStatus;
    public ?string $notes;

    /**
     * Create a new event instance.
     */
    public function __construct(Repair $repair, string $oldStatus, string $newStatus, ?string $notes = null)
    {
        $this->repair = $repair;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->notes = $notes;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('shop.' . $this->repair->shop_id),
        ];
    }
}
