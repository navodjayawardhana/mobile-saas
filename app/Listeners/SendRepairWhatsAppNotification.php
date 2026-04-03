<?php

namespace App\Listeners;

use App\Events\RepairStatusChanged;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendRepairWhatsAppNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(RepairStatusChanged $event): void
    {
        $repair = $event->repair;

        // Load relationships if not already loaded
        $repair->load(['customer', 'shop']);

        // Check if customer exists and has a phone number
        if (!$repair->customer || !$repair->customer->phone) {
            Log::info('No customer phone for repair notification', [
                'repair_id' => $repair->id,
                'job_number' => $repair->job_number,
            ]);
            return;
        }

        // Check if shop has WhatsApp notifications enabled
        $shopSettings = $repair->shop->settings ?? [];
        if (!($shopSettings['whatsapp_notifications'] ?? true)) {
            Log::info('WhatsApp notifications disabled for shop', [
                'shop_id' => $repair->shop_id,
            ]);
            return;
        }

        // Create WhatsApp service for this shop
        $whatsAppService = new WhatsAppService($repair->shop);

        // Check if WhatsApp is configured for this shop
        if (!$whatsAppService->isEnabled()) {
            Log::info('WhatsApp not configured for shop', [
                'shop_id' => $repair->shop_id,
            ]);
            return;
        }

        // Determine which statuses should trigger notifications
        $notifyStatuses = $shopSettings['notify_on_statuses'] ?? [
            'received',
            'diagnosing',
            'in_progress',
            'completed',
            'delivered',
        ];

        if (!in_array($event->newStatus, $notifyStatuses)) {
            Log::info('Status not in notification list', [
                'status' => $event->newStatus,
                'notify_statuses' => $notifyStatuses,
            ]);
            return;
        }

        // Build tracking URL
        $trackingUrl = config('app.url') . '/track-repair?job=' . urlencode($repair->job_number);

        // Send notification
        $result = $whatsAppService->sendRepairStatusNotification(
            $repair->customer->phone,
            $repair->customer->name,
            $repair->job_number,
            $event->newStatus,
            $repair->shop->name,
            $trackingUrl
        );

        if ($result['success']) {
            Log::info('Repair status WhatsApp notification sent', [
                'repair_id' => $repair->id,
                'job_number' => $repair->job_number,
                'status' => $event->newStatus,
                'customer_phone' => $repair->customer->phone,
                'provider' => $result['provider'] ?? 'unknown',
            ]);
        } else {
            Log::warning('Failed to send repair status WhatsApp notification', [
                'repair_id' => $repair->id,
                'job_number' => $repair->job_number,
                'error' => $result['error'] ?? 'Unknown error',
            ]);
        }

        // Send special "ready for pickup" message when completed
        if ($event->newStatus === 'completed') {
            $deviceInfo = trim("{$repair->device_type} {$repair->device_brand} {$repair->device_model}");

            $whatsAppService->sendReadyForPickup(
                $repair->customer->phone,
                $repair->customer->name,
                $repair->job_number,
                $deviceInfo,
                $repair->shop->name,
                $repair->shop->address
            );
        }
    }

    /**
     * Determine whether the listener should be queued.
     */
    public function shouldQueue(RepairStatusChanged $event): bool
    {
        return true;
    }

    /**
     * Handle a job failure.
     */
    public function failed(RepairStatusChanged $event, \Throwable $exception): void
    {
        Log::error('Failed to send repair WhatsApp notification', [
            'repair_id' => $event->repair->id,
            'job_number' => $event->repair->job_number,
            'error' => $exception->getMessage(),
        ]);
    }
}
