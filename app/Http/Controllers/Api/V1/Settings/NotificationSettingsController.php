<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NotificationSettingsController extends Controller
{
    /**
     * Get notification settings
     */
    public function index()
    {
        $shop = auth()->user()->shop;
        $settings = $shop->settings ?? [];

        // Check if WhatsApp is configured for this shop
        $whatsappEnabled = $this->isWhatsAppConfigured($settings);
        $provider = $settings['whatsapp_provider'] ?? 'meta';

        return response()->json([
            'whatsapp_enabled' => $whatsappEnabled,
            'whatsapp_provider' => $provider,
            'whatsapp_notifications' => $settings['whatsapp_notifications'] ?? true,
            'notify_on_statuses' => $settings['notify_on_statuses'] ?? [
                'received',
                'diagnosing',
                'in_progress',
                'completed',
                'delivered',
            ],
            'send_payment_reminders' => $settings['send_payment_reminders'] ?? true,
            'payment_reminder_days' => $settings['payment_reminder_days'] ?? 3,
            // Show masked credentials for display
            'has_meta_credentials' => !empty($settings['whatsapp_meta_access_token']),
            'has_twilio_credentials' => !empty($settings['twilio_sid']),
            'meta_phone_number_id' => $settings['whatsapp_meta_phone_number_id'] ?? '',
            'twilio_whatsapp_from' => $settings['twilio_whatsapp_from'] ?? '',
        ]);
    }

    /**
     * Check if WhatsApp is configured
     */
    private function isWhatsAppConfigured(array $settings): bool
    {
        $provider = $settings['whatsapp_provider'] ?? 'meta';

        if ($provider === 'twilio') {
            return !empty($settings['twilio_sid']) &&
                   !empty($settings['twilio_auth_token']) &&
                   !empty($settings['twilio_whatsapp_from']);
        }

        // Meta WhatsApp Cloud API
        return !empty($settings['whatsapp_meta_access_token']) &&
               !empty($settings['whatsapp_meta_phone_number_id']);
    }

    /**
     * Update notification settings
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'whatsapp_provider' => 'sometimes|string|in:meta,twilio',
            'whatsapp_notifications' => 'sometimes|boolean',
            'notify_on_statuses' => 'sometimes|array',
            'notify_on_statuses.*' => 'string|in:received,diagnosing,waiting_parts,in_progress,on_hold,completed,delivered,cancelled',
            'send_payment_reminders' => 'sometimes|boolean',
            'payment_reminder_days' => 'sometimes|integer|min:1|max:30',
            // Meta WhatsApp credentials
            'whatsapp_meta_access_token' => 'sometimes|nullable|string',
            'whatsapp_meta_phone_number_id' => 'sometimes|nullable|string',
            // Twilio credentials
            'twilio_sid' => 'sometimes|nullable|string',
            'twilio_auth_token' => 'sometimes|nullable|string',
            'twilio_whatsapp_from' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $shop = auth()->user()->shop;
        $settings = $shop->settings ?? [];

        // Update provider
        if ($request->has('whatsapp_provider')) {
            $settings['whatsapp_provider'] = $request->whatsapp_provider;
        }

        // Update notification preferences
        if ($request->has('whatsapp_notifications')) {
            $settings['whatsapp_notifications'] = $request->whatsapp_notifications;
        }
        if ($request->has('notify_on_statuses')) {
            $settings['notify_on_statuses'] = $request->notify_on_statuses;
        }
        if ($request->has('send_payment_reminders')) {
            $settings['send_payment_reminders'] = $request->send_payment_reminders;
        }
        if ($request->has('payment_reminder_days')) {
            $settings['payment_reminder_days'] = $request->payment_reminder_days;
        }

        // Update Meta WhatsApp credentials (only if provided and not empty)
        if ($request->filled('whatsapp_meta_access_token')) {
            $settings['whatsapp_meta_access_token'] = $request->whatsapp_meta_access_token;
        }
        if ($request->filled('whatsapp_meta_phone_number_id')) {
            $settings['whatsapp_meta_phone_number_id'] = $request->whatsapp_meta_phone_number_id;
        }

        // Update Twilio credentials (only if provided and not empty)
        if ($request->filled('twilio_sid')) {
            $settings['twilio_sid'] = $request->twilio_sid;
        }
        if ($request->filled('twilio_auth_token')) {
            $settings['twilio_auth_token'] = $request->twilio_auth_token;
        }
        if ($request->filled('twilio_whatsapp_from')) {
            $settings['twilio_whatsapp_from'] = $request->twilio_whatsapp_from;
        }

        $shop->update(['settings' => $settings]);

        return response()->json([
            'message' => 'Notification settings updated successfully',
            'whatsapp_enabled' => $this->isWhatsAppConfigured($settings),
        ]);
    }

    /**
     * Test WhatsApp notification
     */
    public function testWhatsApp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $shop = auth()->user()->shop;
        $settings = $shop->settings ?? [];

        if (!$this->isWhatsAppConfigured($settings)) {
            return response()->json([
                'success' => false,
                'message' => 'WhatsApp is not configured. Please add your credentials first.',
            ], 400);
        }

        // Create WhatsApp service with shop settings
        $whatsAppService = new WhatsAppService($shop);

        $result = $whatsAppService->sendMessage(
            $request->phone,
            "This is a test message from {$shop->name}. Your WhatsApp notifications are working correctly!"
        );

        return response()->json([
            'success' => $result['success'],
            'provider' => $result['provider'] ?? ($settings['whatsapp_provider'] ?? 'meta'),
            'message' => $result['success']
                ? 'Test message sent successfully!'
                : 'Failed to send test message: ' . ($result['error'] ?? 'Unknown error'),
        ], $result['success'] ? 200 : 400);
    }
}
