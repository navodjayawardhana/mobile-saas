<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\InventoryItem;
use App\Models\Customer;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SaleService
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Create a new sale.
     */
    public function createSale(array $data): Sale
    {
        return DB::transaction(function () use ($data) {
            // Generate invoice number
            $invoiceNumber = $this->generateInvoiceNumber();

            // Calculate totals
            $subtotal = 0;
            $items = [];

            foreach ($data['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                $quantity = $itemData['quantity'];
                $unitPrice = $itemData['unit_price'] ?? $product->selling_price;
                $discount = $itemData['discount_amount'] ?? 0;
                $totalPrice = ($unitPrice * $quantity) - $discount;

                $items[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => $discount,
                    'total_price' => $totalPrice,
                    'inventory_item_id' => $itemData['inventory_item_id'] ?? null,
                    'warranty_months' => $itemData['warranty_months'] ?? $product->warranty_months,
                ];

                $subtotal += $totalPrice;
            }

            $discountAmount = $data['discount_amount'] ?? 0;
            $taxAmount = $data['tax_amount'] ?? 0;
            $totalAmount = $subtotal - $discountAmount + $taxAmount;
            $paidAmount = $data['paid_amount'] ?? 0;
            $dueAmount = $totalAmount - $paidAmount;

            // Determine payment status
            $paymentStatus = 'unpaid';
            if ($paidAmount >= $totalAmount) {
                $paymentStatus = 'paid';
                $dueAmount = 0;
                $paidAmount = $totalAmount;
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'partial';
            }

            // Create sale
            $sale = Sale::create([
                'shop_id' => auth()->user()->shop_id,
                'customer_id' => $data['customer_id'] ?? null,
                'user_id' => auth()->id(),
                'invoice_number' => $invoiceNumber,
                'sale_date' => $data['sale_date'] ?? now(),
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'sale_type' => $data['sale_type'] ?? 'direct',
                'notes' => $data['notes'] ?? null,
            ]);

            // Create sale items and update stock
            foreach ($items as $item) {
                $warrantyExpiresAt = null;
                if ($item['warranty_months']) {
                    $warrantyExpiresAt = now()->addMonths($item['warranty_months']);
                }

                $saleItem = SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product']->id,
                    'inventory_item_id' => $item['inventory_item_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount_amount' => $item['discount_amount'],
                    'total_price' => $item['total_price'],
                    'warranty_months' => $item['warranty_months'],
                    'warranty_expires_at' => $warrantyExpiresAt,
                ]);

                // Update stock
                if ($item['inventory_item_id']) {
                    // Serialized product - mark item as sold
                    $inventoryItem = InventoryItem::find($item['inventory_item_id']);
                    if ($inventoryItem) {
                        $this->stockService->sellInventoryItem($inventoryItem, 'sale', $sale->id);
                    }
                } else {
                    // Non-serialized product - reduce quantity
                    $this->stockService->recordMovement(
                        $item['product'],
                        'sale',
                        $item['quantity'],
                        'sale',
                        $sale->id,
                        "Sale #{$invoiceNumber}"
                    );
                }
            }

            // Record payment if any
            if ($paidAmount > 0 && isset($data['payment_method_id'])) {
                Payment::create([
                    'shop_id' => auth()->user()->shop_id,
                    'payable_type' => Sale::class,
                    'payable_id' => $sale->id,
                    'user_id' => auth()->id(),
                    'amount' => $paidAmount,
                    'payment_method_id' => $data['payment_method_id'],
                    'reference_number' => $data['payment_reference'] ?? null,
                    'payment_date' => now(),
                    'notes' => 'Initial payment for sale',
                ]);
            }

            // Update customer totals if exists
            if ($sale->customer_id) {
                $customer = Customer::find($sale->customer_id);
                if ($customer) {
                    $customer->increment('total_purchases', $totalAmount);
                    if ($dueAmount > 0) {
                        $customer->increment('total_due', $dueAmount);
                    }
                }
            }

            return $sale->load(['items.product', 'customer', 'user', 'payments.paymentMethod']);
        });
    }

    /**
     * Add payment to a sale.
     */
    public function addPayment(Sale $sale, array $data): Payment
    {
        return DB::transaction(function () use ($sale, $data) {
            $amount = min($data['amount'], $sale->due_amount);

            if ($amount <= 0) {
                throw new \Exception('Invalid payment amount');
            }

            // Create payment
            $payment = Payment::create([
                'shop_id' => auth()->user()->shop_id,
                'payable_type' => Sale::class,
                'payable_id' => $sale->id,
                'user_id' => auth()->id(),
                'amount' => $amount,
                'payment_method_id' => $data['payment_method_id'],
                'reference_number' => $data['reference_number'] ?? null,
                'payment_date' => $data['payment_date'] ?? now(),
                'notes' => $data['notes'] ?? null,
            ]);

            // Update sale
            $sale->paid_amount += $amount;
            $sale->due_amount -= $amount;

            if ($sale->due_amount <= 0) {
                $sale->payment_status = 'paid';
                $sale->due_amount = 0;
            } else {
                $sale->payment_status = 'partial';
            }

            $sale->save();

            // Update customer dues
            if ($sale->customer_id) {
                $customer = Customer::find($sale->customer_id);
                if ($customer) {
                    $customer->decrement('total_due', $amount);
                }
            }

            return $payment;
        });
    }

    /**
     * Void a sale (reverse stock and payments).
     */
    public function voidSale(Sale $sale, string $reason): void
    {
        DB::transaction(function () use ($sale, $reason) {
            // Reverse stock movements
            foreach ($sale->items as $item) {
                if ($item->inventory_item_id) {
                    // Restore serialized item to stock
                    $inventoryItem = InventoryItem::find($item->inventory_item_id);
                    if ($inventoryItem) {
                        $inventoryItem->status = 'in_stock';
                        $inventoryItem->save();

                        $this->stockService->recordMovement(
                            $item->product,
                            'return_in',
                            1,
                            'sale_void',
                            $sale->id,
                            "Sale voided: {$reason}"
                        );
                    }
                } else {
                    // Restore non-serialized stock
                    $this->stockService->recordMovement(
                        $item->product,
                        'return_in',
                        $item->quantity,
                        'sale_void',
                        $sale->id,
                        "Sale voided: {$reason}"
                    );
                }
            }

            // Update customer totals
            if ($sale->customer_id) {
                $customer = Customer::find($sale->customer_id);
                if ($customer) {
                    $customer->decrement('total_purchases', $sale->total_amount);
                    if ($sale->due_amount > 0) {
                        $customer->decrement('total_due', $sale->due_amount);
                    }
                }
            }

            // Mark sale as voided
            $sale->payment_status = 'voided';
            $sale->notes = ($sale->notes ? $sale->notes . "\n" : '') . "Voided: {$reason}";
            $sale->save();
        });
    }

    /**
     * Generate unique invoice number.
     */
    private function generateInvoiceNumber(): string
    {
        $prefix = 'INV';
        $date = now()->format('Ymd');

        $lastSale = Sale::where('invoice_number', 'like', "{$prefix}-{$date}-%")
            ->orderByDesc('invoice_number')
            ->first();

        if ($lastSale) {
            $lastNumber = (int) substr($lastSale->invoice_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return "{$prefix}-{$date}-" . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get invoice data for printing.
     */
    public function getInvoiceData(Sale $sale): array
    {
        $sale->load([
            'items.product',
            'items.inventoryItem',
            'customer',
            'user',
            'payments.paymentMethod',
        ]);

        $shop = $sale->shop;

        return [
            'shop' => [
                'name' => $shop->name,
                'address' => $shop->address,
                'phone' => $shop->phone,
                'email' => $shop->email,
                'logo' => $shop->logo,
            ],
            'sale' => [
                'invoice_number' => $sale->invoice_number,
                'date' => $sale->sale_date->format('Y-m-d H:i'),
                'subtotal' => $sale->subtotal,
                'discount' => $sale->discount_amount,
                'tax' => $sale->tax_amount,
                'total' => $sale->total_amount,
                'paid' => $sale->paid_amount,
                'due' => $sale->due_amount,
                'payment_status' => $sale->payment_status,
            ],
            'customer' => $sale->customer ? [
                'name' => $sale->customer->name,
                'phone' => $sale->customer->phone,
                'email' => $sale->customer->email,
            ] : null,
            'cashier' => $sale->user->name,
            'items' => $sale->items->map(function ($item) {
                return [
                    'name' => $item->product->name,
                    'sku' => $item->product->sku,
                    'serial' => $item->inventoryItem?->serial_number,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'discount' => $item->discount_amount,
                    'total' => $item->total_price,
                    'warranty' => $item->warranty_months ? "{$item->warranty_months} months" : null,
                    'warranty_expires' => $item->warranty_expires_at?->format('Y-m-d'),
                ];
            }),
            'payments' => $sale->payments->map(function ($payment) {
                return [
                    'method' => $payment->paymentMethod->name,
                    'amount' => $payment->amount,
                    'date' => $payment->payment_date->format('Y-m-d H:i'),
                    'reference' => $payment->reference_number,
                ];
            }),
        ];
    }
}
