<?php

namespace App\Services;

use App\Models\Shop;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $provider;
    protected bool $enabled;

    // Twilio settings
    protected string $twilioSid;
    protected string $twilioToken;
    protected string $twilioFrom;

    // WhatsApp Cloud API (Meta) settings
    protected string $metaAccessToken;
    protected string $metaPhoneNumberId;
    protected string $metaApiVersion = 'v18.0';

    protected ?Shop $shop;

    public function __construct(?Shop $shop = null)
    {
        $this->shop = $shop;

        if ($shop) {
            // Use per-shop settings from database
            $settings = $shop->settings ?? [];
            $this->provider = $settings['whatsapp_provider'] ?? 'meta';

            // Twilio config from shop settings
            $this->twilioSid = $settings['twilio_sid'] ?? '';
            $this->twilioToken = $settings['twilio_auth_token'] ?? '';
            $this->twilioFrom = $settings['twilio_whatsapp_from'] ?? '';

            // Meta WhatsApp Cloud API config from shop settings
            $this->metaAccessToken = $settings['whatsapp_meta_access_token'] ?? '';
            $this->metaPhoneNumberId = $settings['whatsapp_meta_phone_number_id'] ?? '';

            $this->enabled = $this->checkEnabled();
        } else {
            // Fallback to global env config (for backward compatibility)
            $this->provider = config('services.whatsapp.provider', 'meta');
            $this->enabled = config('services.whatsapp.enabled', false);

            // Twilio config
            $this->twilioSid = config('services.twilio.sid', '');
            $this->twilioToken = config('services.twilio.token', '');
            $this->twilioFrom = config('services.twilio.whatsapp_from', '');

            // Meta WhatsApp Cloud API config
            $this->metaAccessToken = config('services.whatsapp.meta_access_token', '');
            $this->metaPhoneNumberId = config('services.whatsapp.meta_phone_number_id', '');
        }
    }

    /**
     * Create service for a specific shop
     */
    public static function forShop(Shop $shop): self
    {
        return new self($shop);
    }

    /**
     * Check if WhatsApp credentials are configured
     */
    protected function checkEnabled(): bool
    {
        if ($this->provider === 'twilio') {
            return !empty($this->twilioSid) &&
                   !empty($this->twilioToken) &&
                   !empty($this->twilioFrom);
        }

        // Meta WhatsApp Cloud API
        return !empty($this->metaAccessToken) &&
               !empty($this->metaPhoneNumberId);
    }

    /**
     * Check if WhatsApp service is configured and enabled
     */
    public function isEnabled(): bool
    {
        return $this->enabled || $this->checkEnabled();
    }

    /**
     * Get current provider
     */
    public function getProvider(): string
    {
        return $this->provider;
    }

    /**
     * Send a WhatsApp message
     */
    public function sendMessage(string $to, string $message): array
    {
        if (!$this->isEnabled()) {
            Log::warning('WhatsApp service is not configured', [
                'shop_id' => $this->shop?->id,
            ]);
            return [
                'success' => false,
                'error' => 'WhatsApp service is not configured',
            ];
        }

        // Format phone number
        $to = $this->formatPhoneNumber($to);
        if (!$to) {
            return [
                'success' => false,
                'error' => 'Invalid phone number',
            ];
        }

        if ($this->provider === 'twilio') {
            return $this->sendViaTwilio($to, $message);
        }

        return $this->sendViaMeta($to, $message);
    }

    /**
     * Send message via Twilio
     */
    protected function sendViaTwilio(string $to, string $message): array
    {
        try {
            $response = Http::withBasicAuth($this->twilioSid, $this->twilioToken)
                ->asForm()
                ->post(
                    "https://api.twilio.com/2010-04-01/Accounts/{$this->twilioSid}/Messages.json",
                    [
                        'From' => "whatsapp:{$this->twilioFrom}",
                        'To' => "whatsapp:{$to}",
                        'Body' => $message,
                    ]
                );

            if ($response->successful()) {
                Log::info('WhatsApp message sent via Twilio', [
                    'to' => $to,
                    'sid' => $response->json('sid'),
                    'shop_id' => $this->shop?->id,
                ]);

                return [
                    'success' => true,
                    'message_sid' => $response->json('sid'),
                    'status' => $response->json('status'),
                    'provider' => 'twilio',
                ];
            }

            Log::error('Failed to send WhatsApp message via Twilio', [
                'to' => $to,
                'error' => $response->json(),
                'shop_id' => $this->shop?->id,
            ]);

            return [
                'success' => false,
                'error' => $response->json('message') ?? 'Failed to send message',
                'provider' => 'twilio',
            ];
        } catch (\Exception $e) {
            Log::error('Twilio WhatsApp service error', [
                'to' => $to,
                'error' => $e->getMessage(),
                'shop_id' => $this->shop?->id,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'provider' => 'twilio',
            ];
        }
    }

    /**
     * Send message via Meta WhatsApp Cloud API
     */
    protected function sendViaMeta(string $to, string $message): array
    {
        try {
            // Remove + from phone number for Meta API
            $to = ltrim($to, '+');

            $response = Http::withToken($this->metaAccessToken)
                ->post(
                    "https://graph.facebook.com/{$this->metaApiVersion}/{$this->metaPhoneNumberId}/messages",
                    [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $to,
                        'type' => 'text',
                        'text' => [
                            'preview_url' => false,
                            'body' => $message,
                        ],
                    ]
                );

            if ($response->successful()) {
                $data = $response->json();
                Log::info('WhatsApp message sent via Meta', [
                    'to' => $to,
                    'message_id' => $data['messages'][0]['id'] ?? null,
                    'shop_id' => $this->shop?->id,
                ]);

                return [
                    'success' => true,
                    'message_id' => $data['messages'][0]['id'] ?? null,
                    'provider' => 'meta',
                ];
            }

            Log::error('Failed to send WhatsApp message via Meta', [
                'to' => $to,
                'error' => $response->json(),
                'shop_id' => $this->shop?->id,
            ]);

            $error = $response->json('error');
            return [
                'success' => false,
                'error' => $error['message'] ?? 'Failed to send message',
                'provider' => 'meta',
            ];
        } catch (\Exception $e) {
            Log::error('Meta WhatsApp service error', [
                'to' => $to,
                'error' => $e->getMessage(),
                'shop_id' => $this->shop?->id,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'provider' => 'meta',
            ];
        }
    }

    /**
     * Send a template message via Meta (for business-initiated conversations)
     */
    public function sendTemplate(string $to, string $templateName, array $parameters = [], string $language = 'en'): array
    {
        if (!$this->isEnabled() || $this->provider !== 'meta') {
            return [
                'success' => false,
                'error' => 'Template messages only available via Meta WhatsApp Cloud API',
            ];
        }

        $to = $this->formatPhoneNumber($to);
        if (!$to) {
            return [
                'success' => false,
                'error' => 'Invalid phone number',
            ];
        }

        try {
            $to = ltrim($to, '+');

            $components = [];
            if (!empty($parameters)) {
                $components[] = [
                    'type' => 'body',
                    'parameters' => array_map(fn($p) => ['type' => 'text', 'text' => $p], $parameters),
                ];
            }

            $payload = [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $to,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => [
                        'code' => $language,
                    ],
                ],
            ];

            if (!empty($components)) {
                $payload['template']['components'] = $components;
            }

            $response = Http::withToken($this->metaAccessToken)
                ->post(
                    "https://graph.facebook.com/{$this->metaApiVersion}/{$this->metaPhoneNumberId}/messages",
                    $payload
                );

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'message_id' => $data['messages'][0]['id'] ?? null,
                    'provider' => 'meta',
                ];
            }

            $error = $response->json('error');
            return [
                'success' => false,
                'error' => $error['message'] ?? 'Failed to send template message',
                'provider' => 'meta',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'provider' => 'meta',
            ];
        }
    }

    /**
     * Format phone number for WhatsApp
     * Expects international format: +1234567890
     */
    protected function formatPhoneNumber(string $phone): ?string
    {
        // Remove all non-numeric characters except +
        $phone = preg_replace('/[^0-9+]/', '', $phone);

        // If already has + prefix, return as is
        if (str_starts_with($phone, '+')) {
            return $phone;
        }

        // If starts with 00, replace with +
        if (str_starts_with($phone, '00')) {
            return '+' . substr($phone, 2);
        }

        // Sri Lanka phone number handling
        if (strlen($phone) === 9 && str_starts_with($phone, '7')) {
            return '+94' . $phone;
        }
        if (strlen($phone) === 10 && str_starts_with($phone, '07')) {
            return '+94' . substr($phone, 1);
        }

        // Assume needs country code - return null if unsure
        if (strlen($phone) <= 10) {
            return null;
        }

        return '+' . $phone;
    }

    /**
     * Send repair status notification
     */
    public function sendRepairStatusNotification(
        string $phone,
        string $customerName,
        string $jobNumber,
        string $status,
        string $shopName,
        ?string $trackingUrl = null
    ): array {
        $statusMessages = [
            'received' => "Your device has been received. We'll start the diagnosis soon.",
            'diagnosing' => "We're now examining your device to identify the issues.",
            'waiting_parts' => "Your repair is waiting for parts to arrive. We'll update you when they're in.",
            'in_progress' => "Good news! Your device repair is now in progress.",
            'on_hold' => "Your repair is temporarily on hold. We may contact you for more information.",
            'completed' => "Great news! Your device repair is complete and ready for pickup!",
            'delivered' => "Your device has been delivered. Thank you for choosing us!",
            'cancelled' => "Your repair has been cancelled. Please contact us if you have questions.",
        ];

        $statusMessage = $statusMessages[$status] ?? "Your repair status has been updated to: {$status}";

        $message = "Hi {$customerName}!\n\n";
        $message .= "Update on your repair job #{$jobNumber}:\n\n";
        $message .= "{$statusMessage}\n\n";

        if ($trackingUrl) {
            $message .= "Track your repair: {$trackingUrl}\n\n";
        }

        $message .= "- {$shopName}";

        return $this->sendMessage($phone, $message);
    }

    /**
     * Send payment reminder
     */
    public function sendPaymentReminder(
        string $phone,
        string $customerName,
        string $invoiceNumber,
        float $dueAmount,
        string $dueDate,
        string $shopName
    ): array {
        $formattedAmount = number_format($dueAmount, 2);

        $message = "Hi {$customerName}!\n\n";
        $message .= "Friendly reminder: You have an outstanding balance.\n\n";
        $message .= "Invoice: #{$invoiceNumber}\n";
        $message .= "Amount Due: Rs.{$formattedAmount}\n";
        $message .= "Due Date: {$dueDate}\n\n";
        $message .= "Please make payment at your earliest convenience.\n\n";
        $message .= "- {$shopName}";

        return $this->sendMessage($phone, $message);
    }

    /**
     * Send installment reminder
     */
    public function sendInstallmentReminder(
        string $phone,
        string $customerName,
        int $installmentNumber,
        float $amount,
        string $dueDate,
        string $shopName
    ): array {
        $formattedAmount = number_format($amount, 2);

        $message = "Hi {$customerName}!\n\n";
        $message .= "Reminder: Your installment payment is due.\n\n";
        $message .= "Installment #: {$installmentNumber}\n";
        $message .= "Amount: Rs.{$formattedAmount}\n";
        $message .= "Due Date: {$dueDate}\n\n";
        $message .= "Please visit our store to make your payment.\n\n";
        $message .= "- {$shopName}";

        return $this->sendMessage($phone, $message);
    }

    /**
     * Send repair ready for pickup notification
     */
    public function sendReadyForPickup(
        string $phone,
        string $customerName,
        string $jobNumber,
        string $deviceInfo,
        string $shopName,
        ?string $shopAddress = null
    ): array {
        $message = "Hi {$customerName}!\n\n";
        $message .= "Your device is ready for pickup!\n\n";
        $message .= "Job #: {$jobNumber}\n";
        $message .= "Device: {$deviceInfo}\n\n";
        $message .= "Please bring:\n";
        $message .= "- This job number\n";
        $message .= "- Valid ID\n\n";

        if ($shopAddress) {
            $message .= "Location: {$shopAddress}\n\n";
        }

        $message .= "- {$shopName}";

        return $this->sendMessage($phone, $message);
    }
}
