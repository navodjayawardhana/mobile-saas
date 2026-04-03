<?php

namespace App\Http\Controllers\Api\V1\Repair;

use App\Http\Controllers\Controller;
use App\Models\Repair;
use App\Models\User;
use App\Services\RepairService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RepairController extends Controller
{
    protected RepairService $repairService;

    public function __construct(RepairService $repairService)
    {
        $this->repairService = $repairService;
    }

    /**
     * Display a listing of repairs.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Repair::query()
            ->with(['customer:id,name,phone', 'technician:id,name', 'receivedBy:id,name']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('job_number', 'like', "%{$search}%")
                  ->orWhere('device_brand', 'like', "%{$search}%")
                  ->orWhere('device_model', 'like', "%{$search}%")
                  ->orWhere('serial_imei', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Priority filter
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Technician filter
        if ($request->filled('technician_id')) {
            $query->where('technician_id', $request->technician_id);
        }

        // Customer filter
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('received_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('received_at', '<=', $request->date_to);
        }

        // Sorting
        $sortField = $request->get('sort_by', 'received_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $repairs = $query->paginate($perPage);

        return response()->json([
            'repairs' => $repairs->items(),
            'meta' => [
                'current_page' => $repairs->currentPage(),
                'last_page' => $repairs->lastPage(),
                'per_page' => $repairs->perPage(),
                'total' => $repairs->total(),
            ],
        ]);
    }

    /**
     * Store a newly created repair.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'technician_id' => 'nullable|uuid|exists:users,id',
            'device_type' => 'required|string|max:100',
            'device_brand' => 'nullable|string|max:100',
            'device_model' => 'nullable|string|max:100',
            'serial_imei' => 'nullable|string|max:100',
            'device_condition' => 'nullable|string|max:500',
            'reported_issues' => 'required|string|max:1000',
            'diagnosis' => 'nullable|string|max:1000',
            'accessories_received' => 'nullable|array',
            'accessories_received.*' => 'string|max:100',
            'estimated_cost' => 'nullable|numeric|min:0',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'estimated_completion' => 'nullable|date|after_or_equal:today',
            'warranty_days' => 'nullable|integer|min:0',
            'notes' => 'nullable|string|max:1000',
            'internal_notes' => 'nullable|string|max:1000',
        ]);

        try {
            $repair = $this->repairService->createRepair($validated);

            return response()->json([
                'message' => 'Repair job created successfully',
                'repair' => $repair,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Display the specified repair.
     */
    public function show(string $id): JsonResponse
    {
        $repair = Repair::with([
            'customer',
            'technician:id,name,email,phone',
            'receivedBy:id,name',
            'items.product:id,name,sku',
            'items.inventoryItem:id,serial_number',
            'statusHistory.user:id,name',
            'payments.paymentMethod:id,name',
        ])->findOrFail($id);

        return response()->json([
            'repair' => $repair,
        ]);
    }

    /**
     * Update the specified repair.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $repair = Repair::findOrFail($id);

        if (in_array($repair->status, ['delivered', 'cancelled'])) {
            return response()->json([
                'message' => 'Cannot update a delivered or cancelled repair',
            ], 422);
        }

        $validated = $request->validate([
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'technician_id' => 'nullable|uuid|exists:users,id',
            'device_type' => 'sometimes|required|string|max:100',
            'device_brand' => 'nullable|string|max:100',
            'device_model' => 'nullable|string|max:100',
            'serial_imei' => 'nullable|string|max:100',
            'device_condition' => 'nullable|string|max:500',
            'reported_issues' => 'sometimes|required|string|max:1000',
            'diagnosis' => 'nullable|string|max:1000',
            'accessories_received' => 'nullable|array',
            'estimated_cost' => 'nullable|numeric|min:0',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'estimated_completion' => 'nullable|date',
            'warranty_days' => 'nullable|integer|min:0',
            'notes' => 'nullable|string|max:1000',
            'internal_notes' => 'nullable|string|max:1000',
        ]);

        $repair->update($validated);

        return response()->json([
            'message' => 'Repair updated successfully',
            'repair' => $repair->fresh()->load(['customer', 'technician', 'items']),
        ]);
    }

    /**
     * Update repair status.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $repair = Repair::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:received,diagnosing,waiting_parts,in_progress,on_hold,completed,delivered,cancelled',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            // Handle special status transitions
            if ($validated['status'] === 'completed') {
                $repair = $this->repairService->completeRepair($repair);
            } elseif ($validated['status'] === 'delivered') {
                $repair = $this->repairService->deliverRepair($repair);
            } elseif ($validated['status'] === 'cancelled') {
                $this->repairService->cancelRepair($repair, $validated['notes'] ?? 'No reason provided');
                $repair = $repair->fresh();
            } else {
                $repair = $this->repairService->updateStatus($repair, $validated['status'], $validated['notes'] ?? null);
            }

            return response()->json([
                'message' => 'Status updated successfully',
                'repair' => $repair->load(['customer', 'technician', 'statusHistory.user']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Add item to repair.
     */
    public function addItem(Request $request, string $id): JsonResponse
    {
        $repair = Repair::findOrFail($id);

        if (in_array($repair->status, ['delivered', 'cancelled'])) {
            return response()->json([
                'message' => 'Cannot add items to a delivered or cancelled repair',
            ], 422);
        }

        $validated = $request->validate([
            'product_id' => 'nullable|uuid|exists:products,id',
            'inventory_item_id' => 'nullable|uuid|exists:inventory_items,id',
            'description' => 'required|string|max:255',
            'type' => 'required|in:part,service,other',
            'quantity' => 'nullable|integer|min:1',
            'unit_cost' => 'nullable|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
        ]);

        try {
            $item = $this->repairService->addItem($repair, $validated);

            return response()->json([
                'message' => 'Item added successfully',
                'item' => $item,
                'repair' => $repair->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove item from repair.
     */
    public function removeItem(string $id, string $itemId): JsonResponse
    {
        $repair = Repair::findOrFail($id);

        if (in_array($repair->status, ['completed', 'delivered', 'cancelled'])) {
            return response()->json([
                'message' => 'Cannot remove items from a completed, delivered, or cancelled repair',
            ], 422);
        }

        try {
            $this->repairService->removeItem($repair, $itemId);

            return response()->json([
                'message' => 'Item removed successfully',
                'repair' => $repair->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Add payment to repair.
     */
    public function addPayment(Request $request, string $id): JsonResponse
    {
        $repair = Repair::findOrFail($id);

        if ($repair->status === 'cancelled') {
            return response()->json([
                'message' => 'Cannot add payment to a cancelled repair',
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
            $payment = $this->repairService->addPayment($repair, $validated);

            return response()->json([
                'message' => 'Payment added successfully',
                'payment' => $payment->load('paymentMethod'),
                'repair' => $repair->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get job card for printing.
     */
    public function jobCard(string $id): JsonResponse
    {
        $repair = Repair::findOrFail($id);
        $jobCard = $this->repairService->getJobCard($repair);

        return response()->json($jobCard);
    }

    /**
     * Get repair by job number (public tracking).
     */
    public function track(string $jobNumber): JsonResponse
    {
        $repair = Repair::where('job_number', $jobNumber)
            ->first();

        if (!$repair) {
            return response()->json([
                'message' => 'Repair not found',
            ], 404);
        }

        // Return limited info for public tracking
        return response()->json([
            'job_number' => $repair->job_number,
            'device_type' => $repair->device_type,
            'device_brand' => $repair->device_brand,
            'device_model' => $repair->device_model,
            'status' => $repair->status,
            'priority' => $repair->priority,
            'received_at' => $repair->received_at,
            'estimated_completion' => $repair->estimated_completion,
            'completed_at' => $repair->completed_at,
            'status_history' => $repair->statusHistory()
                ->select('to_status', 'created_at')
                ->orderBy('created_at', 'asc')
                ->get(),
        ]);
    }

    /**
     * Get available technicians.
     */
    public function technicians(): JsonResponse
    {
        // Get users who have repair-related permissions
        $technicians = User::where('shop_id', auth()->user()->shop_id)
            ->where('is_active', true)
            ->whereHas('role.permissions', function ($q) {
                $q->where('slug', 'update_repair_status');
            })
            ->get(['id', 'name', 'email', 'phone']);

        return response()->json([
            'technicians' => $technicians,
        ]);
    }

    /**
     * Get repair statistics.
     */
    public function statistics(Request $request): JsonResponse
    {
        $filters = [
            'date_from' => $request->get('date_from'),
            'date_to' => $request->get('date_to'),
        ];

        $statistics = $this->repairService->getStatistics($filters);

        return response()->json($statistics);
    }

    /**
     * Get repairs by status.
     */
    public function byStatus(string $status): JsonResponse
    {
        $validStatuses = ['received', 'diagnosing', 'waiting_parts', 'in_progress', 'on_hold', 'completed'];

        if (!in_array($status, $validStatuses)) {
            return response()->json([
                'message' => 'Invalid status',
            ], 422);
        }

        $repairs = Repair::with(['customer:id,name,phone', 'technician:id,name'])
            ->where('status', $status)
            ->orderBy('priority', 'desc')
            ->orderBy('received_at', 'asc')
            ->get();

        return response()->json([
            'repairs' => $repairs,
            'count' => $repairs->count(),
        ]);
    }

    /**
     * Get overdue repairs.
     */
    public function overdue(): JsonResponse
    {
        $repairs = Repair::with(['customer:id,name,phone', 'technician:id,name'])
            ->whereNotIn('status', ['completed', 'delivered', 'cancelled'])
            ->whereNotNull('estimated_completion')
            ->where('estimated_completion', '<', now())
            ->orderBy('estimated_completion', 'asc')
            ->get();

        return response()->json([
            'repairs' => $repairs,
            'count' => $repairs->count(),
        ]);
    }

    /**
     * Get repair status options.
     */
    public function statusOptions(): JsonResponse
    {
        return response()->json([
            'statuses' => [
                ['value' => 'received', 'label' => 'Received', 'color' => 'info'],
                ['value' => 'diagnosing', 'label' => 'Diagnosing', 'color' => 'warning'],
                ['value' => 'waiting_parts', 'label' => 'Waiting for Parts', 'color' => 'secondary'],
                ['value' => 'in_progress', 'label' => 'In Progress', 'color' => 'primary'],
                ['value' => 'on_hold', 'label' => 'On Hold', 'color' => 'dark'],
                ['value' => 'completed', 'label' => 'Completed', 'color' => 'success'],
                ['value' => 'delivered', 'label' => 'Delivered', 'color' => 'success'],
                ['value' => 'cancelled', 'label' => 'Cancelled', 'color' => 'danger'],
            ],
            'priorities' => [
                ['value' => 'low', 'label' => 'Low', 'color' => 'secondary'],
                ['value' => 'normal', 'label' => 'Normal', 'color' => 'info'],
                ['value' => 'high', 'label' => 'High', 'color' => 'warning'],
                ['value' => 'urgent', 'label' => 'Urgent', 'color' => 'danger'],
            ],
        ]);
    }
}
