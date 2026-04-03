<?php

namespace App\Notifications;

use App\Models\Repair;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class RepairStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Repair $repair;
    protected string $oldStatus;
    protected string $newStatus;

    /**
     * Create a new notification instance.
     */
    public function __construct(Repair $repair, string $oldStatus, string $newStatus)
    {
        $this->repair = $repair;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'repair_id' => $this->repair->id,
            'job_number' => $this->repair->job_number,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'device' => "{$this->repair->device_type} {$this->repair->device_brand} {$this->repair->device_model}",
            'customer_name' => $this->repair->customer?->name ?? 'Walk-in',
            'message' => $this->getStatusMessage(),
        ];
    }

    /**
     * Get status change message
     */
    protected function getStatusMessage(): string
    {
        $statusLabels = [
            'received' => 'Received',
            'diagnosing' => 'Diagnosing',
            'waiting_parts' => 'Waiting for Parts',
            'in_progress' => 'In Progress',
            'on_hold' => 'On Hold',
            'completed' => 'Completed',
            'delivered' => 'Delivered',
            'cancelled' => 'Cancelled',
        ];

        $newLabel = $statusLabels[$this->newStatus] ?? $this->newStatus;

        return "Repair #{$this->repair->job_number} status changed to {$newLabel}";
    }
}
