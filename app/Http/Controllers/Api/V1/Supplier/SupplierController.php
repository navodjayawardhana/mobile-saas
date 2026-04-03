<?php

namespace App\Http\Controllers\Api\V1\Supplier;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query();

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Active filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Has dues filter
        if ($request->boolean('has_dues')) {
            $query->where('total_due', '>', 0);
        }

        // Sorting
        $sortField = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $suppliers = $query->paginate($perPage);

        return response()->json([
            'suppliers' => $suppliers->items(),
            'meta' => [
                'current_page' => $suppliers->currentPage(),
                'last_page' => $suppliers->lastPage(),
                'per_page' => $suppliers->perPage(),
                'total' => $suppliers->total(),
            ],
        ]);
    }

    /**
     * Get all active suppliers for dropdown.
     */
    public function all(): JsonResponse
    {
        $suppliers = Supplier::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'contact_person', 'phone']);

        return response()->json([
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Store a newly created supplier.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('suppliers')->where('shop_id', $request->user()->shop_id),
            ],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'payment_terms' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['total_purchases'] = 0;
        $validated['total_due'] = 0;

        $supplier = Supplier::create($validated);

        return response()->json([
            'message' => 'Supplier created successfully',
            'supplier' => $supplier,
        ], 201);
    }

    /**
     * Display the specified supplier.
     */
    public function show(string $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        return response()->json([
            'supplier' => $supplier,
        ]);
    }

    /**
     * Update the specified supplier.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('suppliers')
                    ->where('shop_id', $request->user()->shop_id)
                    ->ignore($supplier->id),
            ],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'payment_terms' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $supplier->update($validated);

        return response()->json([
            'message' => 'Supplier updated successfully',
            'supplier' => $supplier->fresh(),
        ]);
    }

    /**
     * Remove the specified supplier.
     */
    public function destroy(string $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        // Check for purchase orders
        if ($supplier->purchaseOrders()->exists()) {
            return response()->json([
                'message' => 'Cannot delete supplier with existing purchase orders.',
            ], 422);
        }

        $supplier->delete();

        return response()->json([
            'message' => 'Supplier deleted successfully',
        ]);
    }

    /**
     * Get supplier purchase history.
     */
    public function purchases(Request $request, string $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        $purchases = $supplier->purchaseOrders()
            ->with(['user:id,name'])
            ->orderByDesc('order_date')
            ->paginate($request->get('per_page', 10));

        return response()->json([
            'purchase_orders' => $purchases->items(),
            'meta' => [
                'current_page' => $purchases->currentPage(),
                'last_page' => $purchases->lastPage(),
                'per_page' => $purchases->perPage(),
                'total' => $purchases->total(),
            ],
        ]);
    }

    /**
     * Get supplier payment history.
     */
    public function payments(Request $request, string $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        $payments = $supplier->payments()
            ->with(['paymentMethod:id,name', 'user:id,name'])
            ->orderByDesc('payment_date')
            ->paginate($request->get('per_page', 10));

        return response()->json([
            'payments' => $payments->items(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    /**
     * Get supplier dues summary.
     */
    public function dues(string $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        // Get unpaid purchase orders
        $unpaidOrders = $supplier->purchaseOrders()
            ->where('payment_status', '!=', 'paid')
            ->get(['id', 'po_number', 'total_amount', 'paid_amount', 'due_amount', 'order_date']);

        return response()->json([
            'total_due' => $supplier->total_due,
            'total_purchases' => $supplier->total_purchases,
            'unpaid_orders' => $unpaidOrders,
        ]);
    }

    /**
     * Get suppliers with dues.
     */
    public function withDues(Request $request): JsonResponse
    {
        $suppliers = Supplier::where('total_due', '>', 0)
            ->orderByDesc('total_due')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'suppliers' => $suppliers->items(),
            'meta' => [
                'current_page' => $suppliers->currentPage(),
                'last_page' => $suppliers->lastPage(),
                'per_page' => $suppliers->perPage(),
                'total' => $suppliers->total(),
            ],
            'summary' => [
                'total_suppliers_with_dues' => Supplier::where('total_due', '>', 0)->count(),
                'total_dues_amount' => Supplier::sum('total_due'),
            ],
        ]);
    }

    /**
     * Toggle supplier active status.
     */
    public function toggleActive(string $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->is_active = !$supplier->is_active;
        $supplier->save();

        return response()->json([
            'message' => 'Supplier status updated successfully',
            'supplier' => $supplier,
        ]);
    }
}
