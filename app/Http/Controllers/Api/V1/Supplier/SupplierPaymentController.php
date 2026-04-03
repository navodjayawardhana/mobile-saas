<?php

namespace App\Http\Controllers\Api\V1\Supplier;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SupplierPaymentController extends Controller
{
    /**
     * Display a listing of supplier payments.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SupplierPayment::query()
            ->with(['supplier:id,name', 'paymentMethod:id,name', 'user:id,name']);

        // Supplier filter
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('payment_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('payment_date', '<=', $request->date_to);
        }

        // Payment method filter
        if ($request->filled('payment_method_id')) {
            $query->where('payment_method_id', $request->payment_method_id);
        }

        // Sorting
        $sortField = $request->get('sort_by', 'payment_date');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $payments = $query->paginate($perPage);

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
     * Record a payment to a supplier.
     */
    public function store(Request $request, string $supplierId): JsonResponse
    {
        $supplier = Supplier::findOrFail($supplierId);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method_id' => 'required|uuid|exists:payment_methods,id',
            'payment_date' => 'nullable|date',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($supplier, $validated) {
            // Create payment
            $payment = SupplierPayment::create([
                'shop_id' => auth()->user()->shop_id,
                'supplier_id' => $supplier->id,
                'user_id' => auth()->id(),
                'amount' => $validated['amount'],
                'payment_method_id' => $validated['payment_method_id'],
                'payment_date' => $validated['payment_date'] ?? now(),
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Update supplier total due
            $supplier->decrement('total_due', $validated['amount']);

            // Apply payment to unpaid purchase orders (FIFO)
            $remainingAmount = $validated['amount'];
            $unpaidOrders = $supplier->purchaseOrders()
                ->where('payment_status', '!=', 'paid')
                ->orderBy('order_date')
                ->get();

            foreach ($unpaidOrders as $order) {
                if ($remainingAmount <= 0) break;

                $paymentForOrder = min($remainingAmount, $order->due_amount);
                $order->paid_amount += $paymentForOrder;
                $order->due_amount -= $paymentForOrder;

                if ($order->due_amount <= 0) {
                    $order->payment_status = 'paid';
                    $order->due_amount = 0;
                } else {
                    $order->payment_status = 'partial';
                }

                $order->save();
                $remainingAmount -= $paymentForOrder;
            }

            return response()->json([
                'message' => 'Payment recorded successfully',
                'payment' => $payment->load(['supplier:id,name', 'paymentMethod:id,name']),
                'supplier' => $supplier->fresh(),
            ], 201);
        });
    }

    /**
     * Display the specified payment.
     */
    public function show(string $id): JsonResponse
    {
        $payment = SupplierPayment::with([
            'supplier:id,name,phone',
            'paymentMethod:id,name',
            'user:id,name',
        ])->findOrFail($id);

        return response()->json([
            'payment' => $payment,
        ]);
    }

    /**
     * Get payment summary.
     */
    public function summary(Request $request): JsonResponse
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());

        $payments = SupplierPayment::whereBetween('payment_date', [$dateFrom, $dateTo])
            ->get();

        // Group by payment method
        $byMethod = $payments->groupBy('payment_method_id')
            ->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'total' => $group->sum('amount'),
                ];
            });

        return response()->json([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'total_payments' => $payments->count(),
            'total_amount' => $payments->sum('amount'),
            'by_method' => $byMethod,
        ]);
    }
}
