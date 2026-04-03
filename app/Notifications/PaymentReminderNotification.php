<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PaymentReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected string $invoiceNumber;
    protected float $dueAmount;
    protected string $dueDate;
    protected string $type; // 'sale' or 'installment'

    /**
     * Create a new notification instance.
     */
    public function __construct(string $invoiceNumber, float $dueAmount, string $dueDate, string $type = 'sale')
    {
        $this->invoiceNumber = $invoiceNumber;
        $this->dueAmount = $dueAmount;
        $this->dueDate = $dueDate;
        $this->type = $type;
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
            'type' => $this->type,
            'invoice_number' => $this->invoiceNumber,
            'due_amount' => $this->dueAmount,
            'due_date' => $this->dueDate,
            'message' => $this->getMessage(),
        ];
    }

    /**
     * Get the notification message
     */
    protected function getMessage(): string
    {
        $formattedAmount = number_format($this->dueAmount, 2);

        if ($this->type === 'installment') {
            return "Installment payment of \${$formattedAmount} is due on {$this->dueDate}";
        }

        return "Payment of \${$formattedAmount} for invoice #{$this->invoiceNumber} is due on {$this->dueDate}";
    }
}
