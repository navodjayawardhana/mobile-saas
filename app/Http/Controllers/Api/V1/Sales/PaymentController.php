<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::query()
            ->with(['paymentMethod:id,name', 'user:id,name']);

        // Payable type filter (sale, repair, installment)
        if ($request->filled('payable_type')) {
            $type = match ($request->payable_type) {
                'sale' => 'App\\Models\\Sale',
                'repair' => 'App\\Models\\Repair',
                'installment' => 'App\\Models\\Installment',
                default => $request->payable_type,
            };
            $query->where('payable_type', $type);
        }

        // Payment method filter
        if ($request->filled('payment_method_id')) {
            $query->where('payment_method_id', $request->payment_method_id);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('payment_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('payment_date', '<=', $request->date_to);
        }

        // Sorting
        $sortField = $request->get('sort_by', 'payment_date');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $payments = $query->paginate($perPage);

        // Add payable details
        $items = collect($payments->items())->map(function ($payment) {
            $payable = $payment->payable;
            $payment->payable_info = match ($payment->payable_type) {
                'App\\Models\\Sale' => [
                    'type' => 'Sale',
                    'reference' => $payable?->invoice_number,
                    'customer' => $payable?->customer?->name,
                ],
                'App\\Models\\Repair' => [
                    'type' => 'Repair',
                    'reference' => $payable?->job_number,
                    'customer' => $payable?->customer?->name,
                ],
                'App\\Models\\Installment' => [
                    'type' => 'Installment',
                    'reference' => "Installment #{$payable?->installment_number}",
                    'customer' => $payable?->installmentPlan?->customer?->name,
                ],
                default => null,
            };
            return $payment;
        });

        return response()->json([
            'payments' => $items,
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    /**
     * Display the specified payment.
     */
    public function show(string $id): JsonResponse
    {
        $payment = Payment::with(['paymentMethod', 'user:id,name'])
            ->findOrFail($id);

        // Load payable relationship
        $payable = $payment->payable;

        return response()->json([
            'payment' => $payment,
            'payable' => $payable,
        ]);
    }

    /**
     * Get payment summary for a date range.
     */
    public function summary(Request $request): JsonResponse
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());

        $payments = Payment::whereBetween('payment_date', [$dateFrom, $dateTo])
            ->get();

        // Group by payment method
        $byMethod = $payments->groupBy('payment_method_id')
            ->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'total' => $group->sum('amount'),
                ];
            });

        // Group by payable type
        $byType = $payments->groupBy('payable_type')
            ->map(function ($group, $type) {
                $label = match ($type) {
                    'App\\Models\\Sale' => 'Sales',
                    'App\\Models\\Repair' => 'Repairs',
                    'App\\Models\\Installment' => 'Installments',
                    default => 'Other',
                };
                return [
                    'type' => $label,
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
            'by_type' => array_values($byType->toArray()),
        ]);
    }

    /**
     * Get today's payments.
     */
    public function today(): JsonResponse
    {
        $today = now()->toDateString();

        $payments = Payment::with(['paymentMethod:id,name'])
            ->whereDate('payment_date', $today)
            ->orderByDesc('payment_date')
            ->get();

        return response()->json([
            'payments' => $payments,
            'total_count' => $payments->count(),
            'total_amount' => $payments->sum('amount'),
        ]);
    }
}
