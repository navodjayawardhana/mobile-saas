<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SaleController extends Controller
{
    protected SaleService $saleService;

    public function __construct(SaleService $saleService)
    {
        $this->saleService = $saleService;
    }

    /**
     * Display a listing of sales.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Sale::query()
            ->with(['customer:id,name,phone', 'user:id,name']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        // Customer filter
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        // Payment status filter
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Sale type filter
        if ($request->filled('sale_type')) {
            $query->where('sale_type', $request->sale_type);
        }

        // User/cashier filter
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Sorting
        $sortField = $request->get('sort_by', 'sale_date');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $sales = $query->paginate($perPage);

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
     * Store a newly created sale.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.inventory_item_id' => 'nullable|uuid|exists:inventory_items,id',
            'items.*.warranty_months' => 'nullable|integer|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'payment_method_id' => 'nullable|uuid|exists:payment_methods,id',
            'payment_reference' => 'nullable|string|max:100',
            'sale_type' => 'nullable|in:direct,credit,installment',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $sale = $this->saleService->createSale($validated);

            return response()->json([
                'message' => 'Sale created successfully',
                'sale' => $sale,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Display the specified sale.
     */
    public function show(string $id): JsonResponse
    {
        $sale = Sale::with([
            'items.product:id,name,sku,type',
            'items.inventoryItem:id,serial_number',
            'customer',
            'user:id,name',
            'payments.paymentMethod',
        ])->findOrFail($id);

        return response()->json([
            'sale' => $sale,
        ]);
    }

    /**
     * Void a sale.
     */
    public function void(Request $request, string $id): JsonResponse
    {
        $sale = Sale::findOrFail($id);

        if ($sale->payment_status === 'voided') {
            return response()->json([
                'message' => 'Sale is already voided',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $this->saleService->voidSale($sale, $validated['reason']);

            return response()->json([
                'message' => 'Sale voided successfully',
                'sale' => $sale->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Add payment to a sale.
     */
    public function addPayment(Request $request, string $id): JsonResponse
    {
        $sale = Sale::findOrFail($id);

        if ($sale->payment_status === 'paid') {
            return response()->json([
                'message' => 'Sale is already fully paid',
            ], 422);
        }

        if ($sale->payment_status === 'voided') {
            return response()->json([
                'message' => 'Cannot add payment to voided sale',
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
            $payment = $this->saleService->addPayment($sale, $validated);

            return response()->json([
                'message' => 'Payment added successfully',
                'payment' => $payment->load('paymentMethod'),
                'sale' => $sale->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get invoice data for printing.
     */
    public function invoice(string $id): JsonResponse
    {
        $sale = Sale::findOrFail($id);
        $invoiceData = $this->saleService->getInvoiceData($sale);

        return response()->json($invoiceData);
    }

    /**
     * Get today's sales summary.
     */
    public function todaySummary(): JsonResponse
    {
        $today = now()->toDateString();

        $sales = Sale::whereDate('sale_date', $today)
            ->where('payment_status', '!=', 'voided')
            ->get();

        return response()->json([
            'total_sales' => $sales->count(),
            'total_amount' => $sales->sum('total_amount'),
            'total_paid' => $sales->sum('paid_amount'),
            'total_due' => $sales->sum('due_amount'),
            'cash_sales' => $sales->where('sale_type', 'direct')->count(),
            'credit_sales' => $sales->where('sale_type', 'credit')->count(),
        ]);
    }
}
