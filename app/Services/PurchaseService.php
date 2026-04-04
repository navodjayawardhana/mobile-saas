<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Product;
use App\Models\InventoryItem;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Create a new purchase order.
     */
    public function createPurchaseOrder(array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($data) {
            // Generate PO number
            $poNumber = $this->generatePoNumber();

            // Calculate totals
            $subtotal = 0;
            $items = [];

            foreach ($data['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                $quantity = $itemData['quantity_ordered'];
                $unitCost = $itemData['unit_cost'];
                $totalCost = $quantity * $unitCost;

                $items[] = [
                    'product' => $product,
                    'quantity_ordered' => $quantity,
                    'quantity_received' => 0,
                    'unit_cost' => $unitCost,
                    'total_cost' => $totalCost,
                ];

                $subtotal += $totalCost;
            }

            $taxAmount = $data['tax_amount'] ?? 0;
            $totalAmount = $subtotal + $taxAmount;

            // Create purchase order
            $purchaseOrder = PurchaseOrder::create([
                'shop_id' => auth()->user()->shop_id,
                'supplier_id' => $data['supplier_id'],
                'user_id' => auth()->id(),
                'po_number' => $poNumber,
                'order_date' => $data['order_date'] ?? now(),
                'expected_date' => $data['expected_date'] ?? null,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'paid_amount' => 0,
                'due_amount' => $totalAmount,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'notes' => $data['notes'] ?? null,
            ]);

            // Create purchase order items
            foreach ($items as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id' => $item['product']->id,
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_received' => 0,
                    'unit_cost' => $item['unit_cost'],
                    'total_cost' => $item['total_cost'],
                ]);
            }

            // Update supplier total purchases and dues
            $supplier = Supplier::find($data['supplier_id']);
            if ($supplier) {
                $supplier->increment('total_purchases', $totalAmount);
                $supplier->increment('total_due', $totalAmount);
            }

            return $purchaseOrder->load(['items.product', 'supplier', 'user']);
        });
    }

    /**
     * Receive items for a purchase order.
     */
    public function receiveItems(PurchaseOrder $purchaseOrder, array $items): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder, $items) {
            foreach ($items as $itemData) {
                $poItem = PurchaseOrderItem::where('purchase_order_id', $purchaseOrder->id)
                    ->where('id', $itemData['item_id'])
                    ->firstOrFail();

                $quantityToReceive = $itemData['quantity_received'];
                $remainingToReceive = $poItem->quantity_ordered - $poItem->quantity_received;

                if ($quantityToReceive > $remainingToReceive) {
                    throw new \Exception("Cannot receive more than ordered for item: {$poItem->product->name}");
                }

                $poItem->quantity_received += $quantityToReceive;
                $poItem->save();

                $product = $poItem->product;

                // Handle serialized items (phones with IMEI)
                if ($product->is_serialized && !empty($itemData['serial_numbers'])) {
                    foreach ($itemData['serial_numbers'] as $serial) {
                        $warrantyExpires = null;
                        if ($product->warranty_months) {
                            $warrantyExpires = now()->addMonths((int) $product->warranty_months);
                        }

                        InventoryItem::create([
                            'shop_id' => $purchaseOrder->shop_id,
                            'product_id' => $product->id,
                            'serial_number' => $serial['serial_number'],
                            'cost_price' => $serial['cost_price'] ?? $poItem->unit_cost,
                            'condition' => $serial['condition'] ?? 'new',
                            'status' => 'in_stock',
                            'warranty_expires_at' => $warrantyExpires,
                        ]);
                    }

                    // Record stock movement
                    $this->stockService->recordMovement(
                        $product,
                        'purchase',
                        count($itemData['serial_numbers']),
                        'purchase_order',
                        $purchaseOrder->id,
                        "Received from PO #{$purchaseOrder->po_number}"
                    );
                } else {
                    // Non-serialized products
                    $this->stockService->recordMovement(
                        $product,
                        'purchase',
                        $quantityToReceive,
                        'purchase_order',
                        $purchaseOrder->id,
                        "Received from PO #{$purchaseOrder->po_number}"
                    );
                }
            }

            // Update PO status
            $this->updatePurchaseOrderStatus($purchaseOrder);

            return $purchaseOrder->fresh()->load(['items.product', 'supplier']);
        });
    }

    /**
     * Add payment to a purchase order.
     */
    public function addPayment(PurchaseOrder $purchaseOrder, array $data): SupplierPayment
    {
        return DB::transaction(function () use ($purchaseOrder, $data) {
            $amount = min($data['amount'], $purchaseOrder->due_amount);

            if ($amount <= 0) {
                throw new \Exception('Invalid payment amount');
            }

            // Create supplier payment
            $payment = SupplierPayment::create([
                'shop_id' => auth()->user()->shop_id,
                'supplier_id' => $purchaseOrder->supplier_id,
                'user_id' => auth()->id(),
                'amount' => $amount,
                'payment_method_id' => $data['payment_method_id'],
                'reference_number' => $data['reference_number'] ?? null,
                'payment_date' => $data['payment_date'] ?? now(),
                'notes' => $data['notes'] ?? "Payment for PO #{$purchaseOrder->po_number}",
            ]);

            // Update purchase order
            $purchaseOrder->paid_amount += $amount;
            $purchaseOrder->due_amount -= $amount;

            if ($purchaseOrder->due_amount <= 0) {
                $purchaseOrder->payment_status = 'paid';
                $purchaseOrder->due_amount = 0;
            } else {
                $purchaseOrder->payment_status = 'partial';
            }

            $purchaseOrder->save();

            // Update supplier dues
            $supplier = $purchaseOrder->supplier;
            if ($supplier) {
                $supplier->decrement('total_due', $amount);
            }

            return $payment;
        });
    }

    /**
     * Update purchase order status based on received quantities.
     */
    private function updatePurchaseOrderStatus(PurchaseOrder $purchaseOrder): void
    {
        $items = $purchaseOrder->items;
        $totalOrdered = $items->sum('quantity_ordered');
        $totalReceived = $items->sum('quantity_received');

        if ($totalReceived === 0) {
            $purchaseOrder->status = 'pending';
        } elseif ($totalReceived < $totalOrdered) {
            $purchaseOrder->status = 'partial';
        } else {
            $purchaseOrder->status = 'received';
        }

        $purchaseOrder->save();
    }

    /**
     * Cancel a purchase order.
     */
    public function cancelPurchaseOrder(PurchaseOrder $purchaseOrder, string $reason): void
    {
        if ($purchaseOrder->status === 'received') {
            throw new \Exception('Cannot cancel a fully received purchase order');
        }

        DB::transaction(function () use ($purchaseOrder, $reason) {
            // Reverse any received stock
            foreach ($purchaseOrder->items as $item) {
                if ($item->quantity_received > 0) {
                    $product = $item->product;

                    if ($product->is_serialized) {
                        // Mark inventory items as returned/cancelled
                        // This is complex - for now just record the movement
                        $this->stockService->recordMovement(
                            $product,
                            'return_out',
                            $item->quantity_received,
                            'purchase_order_cancel',
                            $purchaseOrder->id,
                            "PO #{$purchaseOrder->po_number} cancelled: {$reason}"
                        );
                    } else {
                        $this->stockService->recordMovement(
                            $product,
                            'return_out',
                            $item->quantity_received,
                            'purchase_order_cancel',
                            $purchaseOrder->id,
                            "PO #{$purchaseOrder->po_number} cancelled: {$reason}"
                        );
                    }
                }
            }

            // Update supplier totals
            $supplier = $purchaseOrder->supplier;
            if ($supplier) {
                $supplier->decrement('total_purchases', $purchaseOrder->total_amount);
                $supplier->decrement('total_due', $purchaseOrder->due_amount);
            }

            // Update PO status
            $purchaseOrder->status = 'cancelled';
            $purchaseOrder->notes = ($purchaseOrder->notes ? $purchaseOrder->notes . "\n" : '') . "Cancelled: {$reason}";
            $purchaseOrder->save();
        });
    }

    /**
     * Generate unique PO number.
     */
    private function generatePoNumber(): string
    {
        $prefix = 'PO';
        $date = now()->format('Ymd');

        $lastPO = PurchaseOrder::where('po_number', 'like', "{$prefix}-{$date}-%")
            ->orderByDesc('po_number')
            ->first();

        if ($lastPO) {
            $lastNumber = (int) substr($lastPO->po_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return "{$prefix}-{$date}-" . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}
