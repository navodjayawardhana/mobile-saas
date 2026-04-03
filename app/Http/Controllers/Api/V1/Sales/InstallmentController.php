<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Controller;
use App\Models\InstallmentPlan;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class InstallmentController extends Controller
{
    /**
     * Display a listing of installment plans.
     */
    public function index(Request $request): JsonResponse
    {
        $query = InstallmentPlan::query()
            ->with(['customer:id,name,phone', 'sale:id,invoice_number']);

        // Customer filter
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Has overdue filter
        if ($request->boolean('has_overdue')) {
            $query->whereHas('installments', function ($q) {
                $q->where('status', '!=', 'paid')
                  ->where('due_date', '<', now());
            });
        }

        // Sorting
        $sortField = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $plans = $query->paginate($perPage);

        return response()->json([
            'installment_plans' => $plans->items(),
            'meta' => [
                'current_page' => $plans->currentPage(),
                'last_page' => $plans->lastPage(),
                'per_page' => $plans->perPage(),
                'total' => $plans->total(),
            ],
        ]);
    }

    /**
     * Create a new installment plan from a sale.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sale_id' => 'required|uuid|exists:sales,id',
            'customer_id' => 'required|uuid|exists:customers,id',
            'down_payment' => 'required|numeric|min:0',
            'number_of_installments' => 'required|integer|min:1|max:60',
            'interest_rate' => 'nullable|numeric|min:0|max:100',
            'first_due_date' => 'required|date|after:today',
            'payment_method_id' => 'nullable|uuid|exists:payment_methods,id',
        ]);

        return DB::transaction(function () use ($validated) {
            $sale = \App\Models\Sale::findOrFail($validated['sale_id']);

            // Calculate amounts
            $totalAmount = $sale->total_amount;
            $downPayment = $validated['down_payment'];
            $interestRate = $validated['interest_rate'] ?? 0;

            $principalRemaining = $totalAmount - $downPayment;
            $interestAmount = $principalRemaining * ($interestRate / 100);
            $totalWithInterest = $principalRemaining + $interestAmount;
            $installmentAmount = ceil($totalWithInterest / $validated['number_of_installments']);

            // Create installment plan
            $plan = InstallmentPlan::create([
                'shop_id' => auth()->user()->shop_id,
                'sale_id' => $sale->id,
                'customer_id' => $validated['customer_id'],
                'total_amount' => $totalWithInterest,
                'down_payment' => $downPayment,
                'remaining_amount' => $totalWithInterest,
                'number_of_installments' => $validated['number_of_installments'],
                'installment_amount' => $installmentAmount,
                'interest_rate' => $interestRate,
                'status' => 'active',
            ]);

            // Create individual installments
            $dueDate = \Carbon\Carbon::parse($validated['first_due_date']);

            for ($i = 1; $i <= $validated['number_of_installments']; $i++) {
                // Last installment might have different amount to account for rounding
                $amount = $i === $validated['number_of_installments']
                    ? $totalWithInterest - ($installmentAmount * ($validated['number_of_installments'] - 1))
                    : $installmentAmount;

                Installment::create([
                    'installment_plan_id' => $plan->id,
                    'installment_number' => $i,
                    'amount' => $amount,
                    'due_date' => $dueDate->copy(),
                    'status' => 'pending',
                ]);

                $dueDate->addMonth();
            }

            // Record down payment if any
            if ($downPayment > 0 && isset($validated['payment_method_id'])) {
                Payment::create([
                    'shop_id' => auth()->user()->shop_id,
                    'payable_type' => InstallmentPlan::class,
                    'payable_id' => $plan->id,
                    'user_id' => auth()->id(),
                    'amount' => $downPayment,
                    'payment_method_id' => $validated['payment_method_id'],
                    'payment_date' => now(),
                    'notes' => 'Down payment',
                ]);

                // Update sale
                $sale->paid_amount += $downPayment;
                $sale->due_amount -= $downPayment;
                $sale->payment_status = $sale->due_amount <= 0 ? 'paid' : 'partial';
                $sale->sale_type = 'installment';
                $sale->save();
            }

            return response()->json([
                'message' => 'Installment plan created successfully',
                'installment_plan' => $plan->load(['customer', 'sale', 'installments']),
            ], 201);
        });
    }

    /**
     * Display the specified installment plan.
     */
    public function show(string $id): JsonResponse
    {
        $plan = InstallmentPlan::with([
            'customer',
            'sale:id,invoice_number,total_amount',
            'installments' => function ($q) {
                $q->orderBy('installment_number');
            },
            'payments.paymentMethod',
        ])->findOrFail($id);

        return response()->json([
            'installment_plan' => $plan,
        ]);
    }

    /**
     * Record payment for an installment.
     */
    public function recordPayment(Request $request, string $id): JsonResponse
    {
        $plan = InstallmentPlan::findOrFail($id);

        if ($plan->status === 'completed') {
            return response()->json([
                'message' => 'Installment plan is already completed',
            ], 422);
        }

        $validated = $request->validate([
            'installment_id' => 'required|uuid|exists:installments,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method_id' => 'required|uuid|exists:payment_methods,id',
            'payment_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($plan, $validated) {
            $installment = Installment::where('installment_plan_id', $plan->id)
                ->where('id', $validated['installment_id'])
                ->firstOrFail();

            if ($installment->status === 'paid') {
                return response()->json([
                    'message' => 'Installment is already paid',
                ], 422);
            }

            $amount = min($validated['amount'], $installment->amount - ($installment->paid_amount ?? 0));

            // Create payment
            $payment = Payment::create([
                'shop_id' => auth()->user()->shop_id,
                'payable_type' => Installment::class,
                'payable_id' => $installment->id,
                'user_id' => auth()->id(),
                'amount' => $amount,
                'payment_method_id' => $validated['payment_method_id'],
                'payment_date' => $validated['payment_date'] ?? now(),
                'notes' => $validated['notes'] ?? null,
            ]);

            // Update installment
            $installment->paid_amount = ($installment->paid_amount ?? 0) + $amount;
            $installment->paid_date = now();
            $installment->status = $installment->paid_amount >= $installment->amount ? 'paid' : 'partial';
            $installment->save();

            // Update plan
            $plan->remaining_amount -= $amount;
            if ($plan->remaining_amount <= 0) {
                $plan->status = 'completed';
                $plan->remaining_amount = 0;
            }
            $plan->save();

            // Update customer dues
            if ($plan->customer_id) {
                $customer = Customer::find($plan->customer_id);
                if ($customer) {
                    $customer->decrement('total_due', $amount);
                }
            }

            // Update sale
            if ($plan->sale) {
                $plan->sale->paid_amount += $amount;
                $plan->sale->due_amount -= $amount;
                if ($plan->sale->due_amount <= 0) {
                    $plan->sale->payment_status = 'paid';
                    $plan->sale->due_amount = 0;
                }
                $plan->sale->save();
            }

            return response()->json([
                'message' => 'Payment recorded successfully',
                'payment' => $payment->load('paymentMethod'),
                'installment' => $installment,
                'installment_plan' => $plan->fresh(),
            ]);
        });
    }

    /**
     * Get overdue installments.
     */
    public function overdue(Request $request): JsonResponse
    {
        $query = Installment::with([
            'installmentPlan.customer:id,name,phone',
            'installmentPlan.sale:id,invoice_number',
        ])
        ->where('status', '!=', 'paid')
        ->where('due_date', '<', now())
        ->orderBy('due_date');

        $perPage = $request->get('per_page', 15);
        $installments = $query->paginate($perPage);

        // Calculate total overdue
        $totalOverdue = Installment::where('status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->sum(\DB::raw('amount - COALESCE(paid_amount, 0)'));

        return response()->json([
            'installments' => $installments->items(),
            'meta' => [
                'current_page' => $installments->currentPage(),
                'last_page' => $installments->lastPage(),
                'per_page' => $installments->perPage(),
                'total' => $installments->total(),
            ],
            'summary' => [
                'total_overdue_count' => Installment::where('status', '!=', 'paid')
                    ->where('due_date', '<', now())->count(),
                'total_overdue_amount' => $totalOverdue,
            ],
        ]);
    }

    /**
     * Get upcoming installments.
     */
    public function upcoming(Request $request): JsonResponse
    {
        $days = $request->get('days', 7);

        $installments = Installment::with([
            'installmentPlan.customer:id,name,phone',
            'installmentPlan.sale:id,invoice_number',
        ])
        ->where('status', '!=', 'paid')
        ->whereBetween('due_date', [now(), now()->addDays($days)])
        ->orderBy('due_date')
        ->get();

        return response()->json([
            'installments' => $installments,
            'total_amount' => $installments->sum('amount'),
        ]);
    }
}
