<?php

namespace App\Http\Controllers\Api\V1\Supplier;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Services\PurchaseService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PurchaseOrderController extends Controller
{
    protected PurchaseService $purchaseService;

    public function __construct(PurchaseService $purchaseService)
    {
        $this->purchaseService = $purchaseService;
    }

    /**
     * Display a listing of purchase orders.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PurchaseOrder::query()
            ->with(['supplier:id,name', 'user:id,name']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Supplier filter
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Payment status filter
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('order_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('order_date', '<=', $request->date_to);
        }

        // Sorting
        $sortField = $request->get('sort_by', 'order_date');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $orders = $query->paginate($perPage);

        return response()->json([
            'purchase_orders' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * Store a newly created purchase order.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|uuid|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.quantity_ordered' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'order_date' => 'nullable|date',
            'expected_date' => 'nullable|date|after_or_equal:order_date',
            'tax_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $purchaseOrder = $this->purchaseService->createPurchaseOrder($validated);

            return response()->json([
                'message' => 'Purchase order created successfully',
                'purchase_order' => $purchaseOrder,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Display the specified purchase order.
     */
    public function show(string $id): JsonResponse
    {
        $purchaseOrder = PurchaseOrder::with([
            'items.product:id,name,sku,type,is_serialized',
            'supplier',
            'user:id,name',
        ])->findOrFail($id);

        return response()->json([
            'purchase_order' => $purchaseOrder,
        ]);
    }

    /**
     * Update the specified purchase order.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $purchaseOrder = PurchaseOrder::findOrFail($id);

        if ($purchaseOrder->status !== 'pending') {
            return response()->json([
                'message' => 'Cannot update a purchase order that has been processed',
            ], 422);
        }

        $validated = $request->validate([
            'expected_date' => 'nullable|date',
            'tax_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        // Recalculate total if tax changed
        if (isset($validated['tax_amount'])) {
            $validated['total_amount'] = $purchaseOrder->subtotal + $validated['tax_amount'];
            $validated['due_amount'] = $validated['total_amount'] - $purchaseOrder->paid_amount;
        }

        $purchaseOrder->update($validated);

        return response()->json([
            'message' => 'Purchase order updated successfully',
            'purchase_order' => $purchaseOrder->fresh()->load(['items.product', 'supplier']),
        ]);
    }

    /**
     * Receive items for a purchase order.
     */
    public function receive(Request $request, string $id): JsonResponse
    {
        $purchaseOrder = PurchaseOrder::findOrFail($id);

        if ($purchaseOrder->status === 'cancelled') {
            return response()->json([
                'message' => 'Cannot receive items for a cancelled purchase order',
            ], 422);
        }

        if ($purchaseOrder->status === 'received') {
            return response()->json([
                'message' => 'All items have already been received',
            ], 422);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|uuid|exists:purchase_order_items,id',
            'items.*.quantity_received' => 'required|integer|min:1',
            'items.*.serial_numbers' => 'nullable|array',
            'items.*.serial_numbers.*.serial_number' => 'required_with:items.*.serial_numbers|string|max:100',
            'items.*.serial_numbers.*.cost_price' => 'nullable|numeric|min:0',
            'items.*.serial_numbers.*.condition' => 'nullable|in:new,used,refurbished',
        ]);

        try {
            $purchaseOrder = $this->purchaseService->receiveItems($purchaseOrder, $validated['items']);

            return response()->json([
                'message' => 'Items received successfully',
                'purchase_order' => $purchaseOrder,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Add payment to a purchase order.
     */
    public function addPayment(Request $request, string $id): JsonResponse
    {
        $purchaseOrder = PurchaseOrder::findOrFail($id);

        if ($purchaseOrder->payment_status === 'paid') {
            return response()->json([
                'message' => 'Purchase order is already fully paid',
            ], 422);
        }

        if ($purchaseOrder->status === 'cancelled') {
            return response()->json([
                'message' => 'Cannot add payment to a cancelled purchase order',
            ], 422);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method_id' => 'required|uuid|exists:payment_methods,id',
            'reference_number' => 'nullable|string|max:100',
            'payment_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $payment = $this->purchaseService->addPayment($purchaseOrder, $validated);

            return response()->json([
                'message' => 'Payment added successfully',
                'payment' => $payment->load('paymentMethod'),
                'purchase_order' => $purchaseOrder->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Cancel a purchase order.
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $purchaseOrder = PurchaseOrder::findOrFail($id);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $this->purchaseService->cancelPurchaseOrder($purchaseOrder, $validated['reason']);

            return response()->json([
                'message' => 'Purchase order cancelled successfully',
                'purchase_order' => $purchaseOrder->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get pending purchase orders.
     */
    public function pending(): JsonResponse
    {
        $orders = PurchaseOrder::with(['supplier:id,name'])
            ->whereIn('status', ['pending', 'partial'])
            ->orderBy('expected_date')
            ->get();

        return response()->json([
            'purchase_orders' => $orders,
            'count' => $orders->count(),
        ]);
    }
}
