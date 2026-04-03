<?php

namespace App\Services;

use App\Models\Repair;
use App\Models\RepairItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\InventoryItem;
use Illuminate\Support\Facades\DB;

class RepairService
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Create a new repair job.
     */
    public function createRepair(array $data): Repair
    {
        return DB::transaction(function () use ($data) {
            $repair = Repair::create([
                'shop_id' => auth()->user()->shop_id,
                'customer_id' => $data['customer_id'] ?? null,
                'technician_id' => $data['technician_id'] ?? null,
                'received_by_id' => auth()->id(),
                'device_type' => $data['device_type'],
                'device_brand' => $data['device_brand'] ?? null,
                'device_model' => $data['device_model'] ?? null,
                'serial_imei' => $data['serial_imei'] ?? null,
                'device_condition' => $data['device_condition'] ?? null,
                'reported_issues' => $data['reported_issues'],
                'diagnosis' => $data['diagnosis'] ?? null,
                'accessories_received' => $data['accessories_received'] ?? [],
                'estimated_cost' => $data['estimated_cost'] ?? 0,
                'final_cost' => 0,
                'paid_amount' => 0,
                'status' => 'received',
                'priority' => $data['priority'] ?? 'normal',
                'received_at' => now(),
                'estimated_completion' => $data['estimated_completion'] ?? null,
                'warranty_days' => $data['warranty_days'] ?? 0,
                'notes' => $data['notes'] ?? null,
                'internal_notes' => $data['internal_notes'] ?? null,
            ]);

            // Create initial status history
            $repair->statusHistory()->create([
                'user_id' => auth()->id(),
                'from_status' => null,
                'to_status' => 'received',
                'notes' => 'Repair job created',
            ]);

            return $repair->load(['customer', 'technician', 'receivedBy']);
        });
    }

    /**
     * Update repair status.
     */
    public function updateStatus(Repair $repair, string $newStatus, ?string $notes = null): Repair
    {
        $validTransitions = $this->getValidTransitions($repair->status);

        if (!in_array($newStatus, $validTransitions)) {
            throw new \Exception("Invalid status transition from {$repair->status} to {$newStatus}");
        }

        $repair->updateStatus($newStatus, $notes);

        return $repair->fresh()->load(['customer', 'technician', 'statusHistory.user']);
    }

    /**
     * Get valid status transitions.
     */
    public function getValidTransitions(string $currentStatus): array
    {
        $transitions = [
            'received' => ['diagnosing', 'cancelled'],
            'diagnosing' => ['waiting_parts', 'in_progress', 'cancelled'],
            'waiting_parts' => ['in_progress', 'cancelled'],
            'in_progress' => ['completed', 'on_hold', 'cancelled'],
            'on_hold' => ['in_progress', 'cancelled'],
            'completed' => ['delivered'],
            'delivered' => [],
            'cancelled' => [],
        ];

        return $transitions[$currentStatus] ?? [];
    }

    /**
     * Add item (part or service) to repair.
     */
    public function addItem(Repair $repair, array $data): RepairItem
    {
        return DB::transaction(function () use ($repair, $data) {
            $unitCost = $data['unit_cost'] ?? 0;
            $unitPrice = $data['unit_price'];
            $quantity = $data['quantity'] ?? 1;

            // If using a product from inventory
            if (!empty($data['product_id'])) {
                $product = Product::findOrFail($data['product_id']);
                $unitCost = $product->cost_price;

                // If serialized, handle inventory item
                if ($product->is_serialized && !empty($data['inventory_item_id'])) {
                    $inventoryItem = InventoryItem::where('id', $data['inventory_item_id'])
                        ->where('status', 'in_stock')
                        ->firstOrFail();

                    $inventoryItem->update(['status' => 'reserved']);
                    $unitCost = $inventoryItem->cost_price;
                } elseif (!$product->is_serialized) {
                    // Deduct stock for non-serialized products
                    $this->stockService->recordMovement(
                        $product,
                        'sale',
                        $quantity,
                        'repair',
                        $repair->id,
                        "Used in repair #{$repair->job_number}"
                    );
                }
            }

            $item = RepairItem::create([
                'repair_id' => $repair->id,
                'product_id' => $data['product_id'] ?? null,
                'inventory_item_id' => $data['inventory_item_id'] ?? null,
                'description' => $data['description'],
                'type' => $data['type'] ?? 'part', // part, service, other
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'unit_price' => $unitPrice,
                'total_price' => $unitPrice * $quantity,
            ]);

            // Update repair final cost
            $repair->calculateFinalCost();

            return $item->load('product');
        });
    }

    /**
     * Remove item from repair.
     */
    public function removeItem(Repair $repair, string $itemId): void
    {
        DB::transaction(function () use ($repair, $itemId) {
            $item = RepairItem::where('repair_id', $repair->id)
                ->where('id', $itemId)
                ->firstOrFail();

            // Restore stock if product was used
            if ($item->product_id) {
                $product = $item->product;

                if ($product->is_serialized && $item->inventory_item_id) {
                    // Mark inventory item as available again
                    InventoryItem::where('id', $item->inventory_item_id)
                        ->update(['status' => 'in_stock']);
                } elseif (!$product->is_serialized) {
                    // Add stock back
                    $this->stockService->recordMovement(
                        $product,
                        'return_in',
                        $item->quantity,
                        'repair_return',
                        $repair->id,
                        "Returned from repair #{$repair->job_number}"
                    );
                }
            }

            $item->delete();

            // Update repair final cost
            $repair->calculateFinalCost();
        });
    }

    /**
     * Add payment to repair.
     */
    public function addPayment(Repair $repair, array $data): Payment
    {
        return DB::transaction(function () use ($repair, $data) {
            $dueAmount = $repair->final_cost - $repair->paid_amount;
            $amount = min($data['amount'], $dueAmount);

            if ($amount <= 0) {
                throw new \Exception('Invalid payment amount');
            }

            $payment = Payment::create([
                'shop_id' => auth()->user()->shop_id,
                'payable_type' => Repair::class,
                'payable_id' => $repair->id,
                'user_id' => auth()->id(),
                'amount' => $amount,
                'payment_method_id' => $data['payment_method_id'],
                'reference_number' => $data['reference_number'] ?? null,
                'payment_date' => $data['payment_date'] ?? now(),
                'notes' => $data['notes'] ?? null,
            ]);

            $repair->paid_amount += $amount;
            $repair->save();

            return $payment;
        });
    }

    /**
     * Complete repair and finalize inventory.
     */
    public function completeRepair(Repair $repair): Repair
    {
        return DB::transaction(function () use ($repair) {
            // Mark all reserved inventory items as sold
            foreach ($repair->items as $item) {
                if ($item->inventory_item_id) {
                    InventoryItem::where('id', $item->inventory_item_id)
                        ->update(['status' => 'sold']);
                }
            }

            $repair->updateStatus('completed', 'Repair completed');

            return $repair->fresh();
        });
    }

    /**
     * Deliver repair to customer.
     */
    public function deliverRepair(Repair $repair): Repair
    {
        if ($repair->due_amount > 0) {
            throw new \Exception('Cannot deliver repair with outstanding balance');
        }

        $repair->updateStatus('delivered', 'Device delivered to customer');

        return $repair->fresh();
    }

    /**
     * Cancel repair and restore inventory.
     */
    public function cancelRepair(Repair $repair, string $reason): void
    {
        if (in_array($repair->status, ['completed', 'delivered'])) {
            throw new \Exception('Cannot cancel a completed or delivered repair');
        }

        DB::transaction(function () use ($repair, $reason) {
            // Restore all inventory items
            foreach ($repair->items as $item) {
                if ($item->product_id) {
                    $product = $item->product;

                    if ($product->is_serialized && $item->inventory_item_id) {
                        InventoryItem::where('id', $item->inventory_item_id)
                            ->update(['status' => 'in_stock']);
                    } elseif (!$product->is_serialized) {
                        $this->stockService->recordMovement(
                            $product,
                            'return_in',
                            $item->quantity,
                            'repair_cancel',
                            $repair->id,
                            "Repair #{$repair->job_number} cancelled: {$reason}"
                        );
                    }
                }
            }

            $repair->updateStatus('cancelled', $reason);
        });
    }

    /**
     * Get repair statistics.
     */
    public function getStatistics(array $filters = []): array
    {
        $query = Repair::query();

        if (!empty($filters['date_from'])) {
            $query->whereDate('received_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('received_at', '<=', $filters['date_to']);
        }

        $repairs = $query->get();

        return [
            'total_repairs' => $repairs->count(),
            'by_status' => $repairs->groupBy('status')->map->count(),
            'by_priority' => $repairs->groupBy('priority')->map->count(),
            'total_revenue' => $repairs->where('status', 'delivered')->sum('final_cost'),
            'total_collected' => $repairs->sum('paid_amount'),
            'pending_collection' => $repairs->whereIn('status', ['completed', 'delivered'])->sum(fn($r) => $r->due_amount),
            'average_repair_time' => $this->calculateAverageRepairTime($repairs),
        ];
    }

    /**
     * Calculate average repair time in hours.
     */
    private function calculateAverageRepairTime($repairs): ?float
    {
        $completedRepairs = $repairs->filter(fn($r) => $r->completed_at && $r->received_at);

        if ($completedRepairs->isEmpty()) {
            return null;
        }

        $totalHours = $completedRepairs->sum(function ($repair) {
            return $repair->received_at->diffInHours($repair->completed_at);
        });

        return round($totalHours / $completedRepairs->count(), 1);
    }

    /**
     * Get job card data for printing.
     */
    public function getJobCard(Repair $repair): array
    {
        $repair->load([
            'customer',
            'technician',
            'receivedBy',
            'items.product',
            'payments.paymentMethod',
        ]);

        return [
            'repair' => $repair,
            'shop' => $repair->shop,
            'items_by_type' => $repair->items->groupBy('type'),
            'total_parts' => $repair->items->where('type', 'part')->sum('total_price'),
            'total_services' => $repair->items->where('type', 'service')->sum('total_price'),
            'total_other' => $repair->items->where('type', 'other')->sum('total_price'),
        ];
    }
}
