<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query();

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Customer type filter
        if ($request->filled('customer_type')) {
            $query->where('customer_type', $request->customer_type);
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
        $customers = $query->paginate($perPage);

        return response()->json([
            'customers' => $customers->items(),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
        ]);
    }

    /**
     * Quick search for POS.
     */
    public function search(Request $request): JsonResponse
    {
        $search = $request->get('q', '');

        $customers = Customer::where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('phone', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        })
        ->limit(10)
        ->get(['id', 'name', 'phone', 'email', 'customer_type', 'credit_limit', 'total_due']);

        return response()->json([
            'customers' => $customers,
        ]);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('customers')->where('shop_id', $request->user()->shop_id),
            ],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('customers')->where('shop_id', $request->user()->shop_id),
            ],
            'address' => 'nullable|string|max:500',
            'customer_type' => 'nullable|in:regular,wholesale,vip,business,individual',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $validated['customer_type'] = $validated['customer_type'] ?? 'regular';
        $validated['credit_limit'] = $validated['credit_limit'] ?? 0;
        $validated['total_purchases'] = 0;
        $validated['total_due'] = 0;

        $customer = Customer::create($validated);

        return response()->json([
            'message' => 'Customer created successfully',
            'customer' => $customer,
        ], 201);
    }

    /**
     * Display the specified customer.
     */
    public function show(string $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        return response()->json([
            'customer' => $customer,
        ]);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('customers')
                    ->where('shop_id', $request->user()->shop_id)
                    ->ignore($customer->id),
            ],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('customers')
                    ->where('shop_id', $request->user()->shop_id)
                    ->ignore($customer->id),
            ],
            'address' => 'nullable|string|max:500',
            'customer_type' => 'nullable|in:regular,wholesale,vip,business,individual',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $customer->update($validated);

        return response()->json([
            'message' => 'Customer updated successfully',
            'customer' => $customer->fresh(),
        ]);
    }

    /**
     * Remove the specified customer.
     */
    public function destroy(string $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        // Check for sales
        if ($customer->sales()->exists()) {
            return response()->json([
                'message' => 'Cannot delete customer with existing sales.',
            ], 422);
        }

        // Check for repairs
        if ($customer->repairs()->exists()) {
            return response()->json([
                'message' => 'Cannot delete customer with existing repairs.',
            ], 422);
        }

        // Check for installment plans
        if ($customer->installmentPlans()->exists()) {
            return response()->json([
                'message' => 'Cannot delete customer with existing installment plans.',
            ], 422);
        }

        $customer->delete();

        return response()->json([
            'message' => 'Customer deleted successfully',
        ]);
    }

    /**
     * Get customer purchase history.
     */
    public function purchases(Request $request, string $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $sales = $customer->sales()
            ->with(['user:id,name'])
            ->orderByDesc('sale_date')
            ->paginate($request->get('per_page', 10));

        return response()->json([
            'sales' => $sales->items(),
            'meta' => [
                'current_page' => $sales->currentPage(),
                'last_page' => $sales->lastPage(),
                'per_page' => $sales->perPage(),
                'total' => $sales->total(),
            ],
        ]);
    }

    /**
     * Get customer repair history.
     */
    public function repairs(Request $request, string $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $repairs = $customer->repairs()
            ->with(['technician:id,name'])
            ->orderByDesc('received_at')
            ->paginate($request->get('per_page', 10));

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
     * Get customer dues summary.
     */
    public function dues(string $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        // Get unpaid sales
        $unpaidSales = $customer->sales()
            ->where('payment_status', '!=', 'paid')
            ->get(['id', 'invoice_number', 'total_amount', 'paid_amount', 'due_amount', 'sale_date']);

        // Get active installment plans
        $installmentPlans = $customer->installmentPlans()
            ->where('status', '!=', 'completed')
            ->with(['installments' => function ($q) {
                $q->where('status', '!=', 'paid')->orderBy('due_date');
            }])
            ->get();

        return response()->json([
            'total_due' => $customer->total_due,
            'credit_limit' => $customer->credit_limit,
            'available_credit' => max(0, $customer->credit_limit - $customer->total_due),
            'unpaid_sales' => $unpaidSales,
            'installment_plans' => $installmentPlans,
        ]);
    }

    /**
     * Get customers with dues.
     */
    public function withDues(Request $request): JsonResponse
    {
        $customers = Customer::where('total_due', '>', 0)
            ->orderByDesc('total_due')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'customers' => $customers->items(),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
            'summary' => [
                'total_customers_with_dues' => Customer::where('total_due', '>', 0)->count(),
                'total_dues_amount' => Customer::sum('total_due'),
            ],
        ]);
    }
}
