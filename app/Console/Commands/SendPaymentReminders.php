<?php

namespace App\Console\Commands;

use App\Models\Installment;
use App\Models\Sale;
use App\Models\Shop;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendPaymentReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payments:send-reminders {--days=3 : Days before due date to send reminder}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send payment reminders for upcoming and overdue payments';

    /**
     * Cache of WhatsApp services per shop
     */
    protected array $whatsAppServices = [];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $reminderDate = Carbon::today()->addDays($days);
        $today = Carbon::today();

        $this->info("Sending payment reminders for payments due on or before {$reminderDate->toDateString()}");

        // Send installment reminders
        $this->sendInstallmentReminders($reminderDate, $today);

        // Send overdue sale payment reminders
        $this->sendOverdueSaleReminders($today);

        $this->info('Payment reminders sent successfully.');

        return 0;
    }

    /**
     * Get WhatsApp service for a shop
     */
    protected function getWhatsAppService(Shop $shop): ?WhatsAppService
    {
        if (!isset($this->whatsAppServices[$shop->id])) {
            $settings = $shop->settings ?? [];

            // Check if shop has payment reminders enabled
            if (!($settings['send_payment_reminders'] ?? true)) {
                $this->whatsAppServices[$shop->id] = null;
            } else {
                $service = new WhatsAppService($shop);
                $this->whatsAppServices[$shop->id] = $service->isEnabled() ? $service : null;
            }
        }

        return $this->whatsAppServices[$shop->id];
    }

    /**
     * Send reminders for upcoming and overdue installments
     */
    protected function sendInstallmentReminders(Carbon $reminderDate, Carbon $today): void
    {
        $installments = Installment::with(['installmentPlan.customer', 'installmentPlan.sale.shop'])
            ->where('status', 'pending')
            ->whereDate('due_date', '<=', $reminderDate)
            ->get();

        $sentCount = 0;

        foreach ($installments as $installment) {
            $customer = $installment->installmentPlan?->customer;
            $shop = $installment->installmentPlan?->sale?->shop;

            if (!$customer || !$customer->phone || !$shop) {
                continue;
            }

            $whatsAppService = $this->getWhatsAppService($shop);
            if (!$whatsAppService) {
                continue;
            }

            $result = $whatsAppService->sendInstallmentReminder(
                $customer->phone,
                $customer->name,
                $installment->installment_number,
                $installment->amount,
                Carbon::parse($installment->due_date)->format('M d, Y'),
                $shop->name
            );

            if ($result['success']) {
                $sentCount++;
            }
        }

        $this->info("Sent {$sentCount} installment reminders.");
    }

    /**
     * Send reminders for overdue sale payments
     */
    protected function sendOverdueSaleReminders(Carbon $today): void
    {
        // Get sales with due amounts that are overdue
        $sales = Sale::with(['customer', 'shop'])
            ->where('due_amount', '>', 0)
            ->where('payment_status', '!=', 'paid')
            ->where('status', '!=', 'voided')
            ->whereDate('sale_date', '<', $today->subDays(7)) // More than 7 days old
            ->get();

        $sentCount = 0;

        foreach ($sales as $sale) {
            if (!$sale->customer || !$sale->customer->phone) {
                continue;
            }

            $whatsAppService = $this->getWhatsAppService($sale->shop);
            if (!$whatsAppService) {
                continue;
            }

            $result = $whatsAppService->sendPaymentReminder(
                $sale->customer->phone,
                $sale->customer->name,
                $sale->invoice_number,
                $sale->due_amount,
                Carbon::parse($sale->sale_date)->addDays(30)->format('M d, Y'),
                $sale->shop->name
            );

            if ($result['success']) {
                $sentCount++;
            }
        }

        $this->info("Sent {$sentCount} sale payment reminders.");
    }
}
