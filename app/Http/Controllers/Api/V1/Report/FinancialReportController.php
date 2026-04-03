<?php

namespace App\Http\Controllers\Api\V1\Report;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Repair;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\PurchaseOrder;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class FinancialReportController extends Controller
{
    /**
     * Profit and Loss report
     */
    public function profitLoss(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        // Revenue
        $salesRevenue = Sale::where('status', '!=', 'voided')
            ->whereDate('sale_date', '>=', $dateFrom)
            ->whereDate('sale_date', '<=', $dateTo)
            ->sum('total_amount');

        $repairRevenue = Repair::whereIn('status', ['completed', 'delivered'])
            ->whereDate('completed_at', '>=', $dateFrom)
            ->whereDate('completed_at', '<=', $dateTo)
            ->sum('final_cost');

        $totalRevenue = $salesRevenue + $repairRevenue;

        // Cost of Goods Sold (simplified - using product cost prices from sale items)
        $cogs = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.status', '!=', 'voided')
            ->whereDate('sales.sale_date', '>=', $dateFrom)
            ->whereDate('sales.sale_date', '<=', $dateTo)
            ->sum(DB::raw('sale_items.quantity * products.cost_price'));

        // Expenses
        $expenses = Expense::whereDate('expense_date', '>=', $dateFrom)
            ->whereDate('expense_date', '<=', $dateTo)
            ->sum('amount');

        // Expenses by category
        $expensesByCategory = Expense::join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->whereDate('expenses.expense_date', '>=', $dateFrom)
            ->whereDate('expenses.expense_date', '<=', $dateTo)
            ->selectRaw('expense_categories.name, SUM(expenses.amount) as total')
            ->groupBy('expense_categories.name')
            ->orderByDesc('total')
            ->get();

        // Gross Profit
        $grossProfit = $totalRevenue - $cogs;

        // Net Profit
        $netProfit = $grossProfit - $expenses;

        // Monthly breakdown
        $monthlyBreakdown = [];
        $currentDate = Carbon::parse($dateFrom)->startOfMonth();
        $endDate = Carbon::parse($dateTo)->endOfMonth();

        while ($currentDate <= $endDate) {
            $monthStart = $currentDate->copy()->startOfMonth();
            $monthEnd = $currentDate->copy()->endOfMonth();

            $monthSales = Sale::where('status', '!=', 'voided')
                ->whereDate('sale_date', '>=', $monthStart)
                ->whereDate('sale_date', '<=', $monthEnd)
                ->sum('total_amount');

            $monthRepairs = Repair::whereIn('status', ['completed', 'delivered'])
                ->whereDate('completed_at', '>=', $monthStart)
                ->whereDate('completed_at', '<=', $monthEnd)
                ->sum('final_cost');

            $monthExpenses = Expense::whereDate('expense_date', '>=', $monthStart)
                ->whereDate('expense_date', '<=', $monthEnd)
                ->sum('amount');

            $monthlyBreakdown[] = [
                'month' => $currentDate->format('Y-m'),
                'label' => $currentDate->format('M Y'),
                'revenue' => $monthSales + $monthRepairs,
                'expenses' => $monthExpenses,
                'profit' => $monthSales + $monthRepairs - $monthExpenses,
            ];

            $currentDate->addMonth();
        }

        return response()->json([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'revenue' => [
                'sales' => $salesRevenue,
                'repairs' => $repairRevenue,
                'total' => $totalRevenue,
            ],
            'cost_of_goods_sold' => $cogs,
            'gross_profit' => $grossProfit,
            'gross_margin' => $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 2) : 0,
            'expenses' => [
                'total' => $expenses,
                'by_category' => $expensesByCategory,
            ],
            'net_profit' => $netProfit,
            'net_margin' => $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0,
            'monthly_breakdown' => $monthlyBreakdown,
        ]);
    }

    /**
     * Export Profit & Loss report as PDF
     */
    public function exportProfitLossPdf(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        // Revenue
        $salesRevenue = Sale::where('status', '!=', 'voided')
            ->whereDate('sale_date', '>=', $dateFrom)
            ->whereDate('sale_date', '<=', $dateTo)
            ->sum('total_amount');

        $repairRevenue = Repair::whereIn('status', ['completed', 'delivered'])
            ->whereDate('completed_at', '>=', $dateFrom)
            ->whereDate('completed_at', '<=', $dateTo)
            ->sum('final_cost');

        $totalRevenue = $salesRevenue + $repairRevenue;

        // Cost of Goods Sold
        $cogs = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.status', '!=', 'voided')
            ->whereDate('sales.sale_date', '>=', $dateFrom)
            ->whereDate('sales.sale_date', '<=', $dateTo)
            ->sum(DB::raw('sale_items.quantity * products.cost_price'));

        // Expenses
        $expenses = Expense::whereDate('expense_date', '>=', $dateFrom)
            ->whereDate('expense_date', '<=', $dateTo)
            ->sum('amount');

        // Expenses by category
        $expensesByCategory = Expense::join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->whereDate('expenses.expense_date', '>=', $dateFrom)
            ->whereDate('expenses.expense_date', '<=', $dateTo)
            ->selectRaw('expense_categories.name, SUM(expenses.amount) as total')
            ->groupBy('expense_categories.name')
            ->orderByDesc('total')
            ->get();

        // Gross Profit
        $grossProfit = $totalRevenue - $cogs;

        // Net Profit
        $netProfit = $grossProfit - $expenses;

        // Monthly breakdown
        $monthlyBreakdown = [];
        $currentDate = Carbon::parse($dateFrom)->startOfMonth();
        $endDate = Carbon::parse($dateTo)->endOfMonth();

        while ($currentDate <= $endDate) {
            $monthStart = $currentDate->copy()->startOfMonth();
            $monthEnd = $currentDate->copy()->endOfMonth();

            $monthSales = Sale::where('status', '!=', 'voided')
                ->whereDate('sale_date', '>=', $monthStart)
                ->whereDate('sale_date', '<=', $monthEnd)
                ->sum('total_amount');

            $monthRepairs = Repair::whereIn('status', ['completed', 'delivered'])
                ->whereDate('completed_at', '>=', $monthStart)
                ->whereDate('completed_at', '<=', $monthEnd)
                ->sum('final_cost');

            $monthExpenses = Expense::whereDate('expense_date', '>=', $monthStart)
                ->whereDate('expense_date', '<=', $monthEnd)
                ->sum('amount');

            $monthlyBreakdown[] = [
                'month' => $currentDate->format('Y-m'),
                'label' => $currentDate->format('M Y'),
                'revenue' => $monthSales + $monthRepairs,
                'expenses' => $monthExpenses,
                'profit' => $monthSales + $monthRepairs - $monthExpenses,
            ];

            $currentDate->addMonth();
        }

        // Get shop info from authenticated user
        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.profit-loss-report', [
            'shop' => $shop,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'revenue' => [
                'sales' => $salesRevenue,
                'repairs' => $repairRevenue,
                'total' => $totalRevenue,
            ],
            'cost_of_goods_sold' => $cogs,
            'gross_profit' => $grossProfit,
            'gross_margin' => $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 2) : 0,
            'expenses' => [
                'total' => $expenses,
                'by_category' => $expensesByCategory,
            ],
            'net_profit' => $netProfit,
            'net_margin' => $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0,
            'monthly_breakdown' => $monthlyBreakdown,
        ]);

        $filename = "profit_loss_report_{$dateFrom}_to_{$dateTo}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Cash flow report
     */
    public function cashFlow(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        // Cash inflows (payments received)
        $inflows = Payment::whereDate('payment_date', '>=', $dateFrom)
            ->whereDate('payment_date', '<=', $dateTo)
            ->sum('amount');

        // Cash inflows by payment method
        $inflowsByMethod = Payment::join('payment_methods', 'payments.payment_method_id', '=', 'payment_methods.id')
            ->whereDate('payments.payment_date', '>=', $dateFrom)
            ->whereDate('payments.payment_date', '<=', $dateTo)
            ->selectRaw('payment_methods.name, SUM(payments.amount) as total, COUNT(*) as count')
            ->groupBy('payment_methods.name')
            ->orderByDesc('total')
            ->get();

        // Cash outflows
        $expenseOutflows = Expense::whereDate('expense_date', '>=', $dateFrom)
            ->whereDate('expense_date', '<=', $dateTo)
            ->sum('amount');

        $supplierPayments = DB::table('supplier_payments')
            ->whereDate('payment_date', '>=', $dateFrom)
            ->whereDate('payment_date', '<=', $dateTo)
            ->sum('amount');

        $totalOutflows = $expenseOutflows + $supplierPayments;

        // Net cash flow
        $netCashFlow = $inflows - $totalOutflows;

        // Daily cash flow
        $dailyCashFlow = Payment::selectRaw('DATE(payment_date) as date, SUM(amount) as inflow')
            ->whereDate('payment_date', '>=', $dateFrom)
            ->whereDate('payment_date', '<=', $dateTo)
            ->groupByRaw('DATE(payment_date)')
            ->orderByRaw('DATE(payment_date)')
            ->get()
            ->keyBy('date');

        $dailyExpenses = Expense::selectRaw('DATE(expense_date) as date, SUM(amount) as outflow')
            ->whereDate('expense_date', '>=', $dateFrom)
            ->whereDate('expense_date', '<=', $dateTo)
            ->groupByRaw('DATE(expense_date)')
            ->get()
            ->keyBy('date');

        // Merge daily data
        $allDates = collect($dailyCashFlow->keys())->merge($dailyExpenses->keys())->unique()->sort();
        $dailyFlow = $allDates->map(function ($date) use ($dailyCashFlow, $dailyExpenses) {
            return [
                'date' => $date,
                'inflow' => $dailyCashFlow->get($date)?->inflow ?? 0,
                'outflow' => $dailyExpenses->get($date)?->outflow ?? 0,
                'net' => ($dailyCashFlow->get($date)?->inflow ?? 0) - ($dailyExpenses->get($date)?->outflow ?? 0),
            ];
        })->values();

        return response()->json([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'inflows' => [
                'total' => $inflows,
                'by_method' => $inflowsByMethod,
            ],
            'outflows' => [
                'expenses' => $expenseOutflows,
                'supplier_payments' => $supplierPayments,
                'total' => $totalOutflows,
            ],
            'net_cash_flow' => $netCashFlow,
            'daily_flow' => $dailyFlow,
        ]);
    }

    /**
     * Customer dues report
     */
    public function customerDues(Request $request)
    {
        $customers = Customer::where('total_due', '>', 0)
            ->orderByDesc('total_due')
            ->paginate($request->input('per_page', 20));

        $customers->getCollection()->transform(function ($customer) {
            // Get unpaid sales
            $unpaidSales = Sale::where('customer_id', $customer->id)
                ->where('due_amount', '>', 0)
                ->orderBy('sale_date', 'desc')
                ->get(['id', 'invoice_number', 'sale_date', 'total_amount', 'paid_amount', 'due_amount']);

            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'total_due' => $customer->total_due,
                'total_purchases' => $customer->total_purchases,
                'unpaid_invoices' => $unpaidSales,
            ];
        });

        $totalDue = Customer::sum('total_due');
        $customersWithDue = Customer::where('total_due', '>', 0)->count();

        return response()->json([
            'summary' => [
                'total_due' => $totalDue,
                'customers_with_due' => $customersWithDue,
            ],
            'customers' => $customers,
        ]);
    }

    /**
     * Supplier dues report
     */
    public function supplierDues(Request $request)
    {
        $suppliers = Supplier::where('total_due', '>', 0)
            ->orderByDesc('total_due')
            ->paginate($request->input('per_page', 20));

        $suppliers->getCollection()->transform(function ($supplier) {
            // Get unpaid purchase orders
            $unpaidPOs = PurchaseOrder::where('supplier_id', $supplier->id)
                ->where('due_amount', '>', 0)
                ->orderBy('order_date', 'desc')
                ->get(['id', 'po_number', 'order_date', 'total_amount', 'paid_amount', 'due_amount']);

            return [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'contact_person' => $supplier->contact_person,
                'phone' => $supplier->phone,
                'total_due' => $supplier->total_due,
                'total_purchases' => $supplier->total_purchases,
                'unpaid_orders' => $unpaidPOs,
            ];
        });

        $totalDue = Supplier::sum('total_due');
        $suppliersWithDue = Supplier::where('total_due', '>', 0)->count();

        return response()->json([
            'summary' => [
                'total_due' => $totalDue,
                'suppliers_with_due' => $suppliersWithDue,
            ],
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Payment collection report
     */
    public function collections(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        // By user (collector)
        $byUser = Payment::join('users', 'payments.user_id', '=', 'users.id')
            ->whereDate('payments.payment_date', '>=', $dateFrom)
            ->whereDate('payments.payment_date', '<=', $dateTo)
            ->selectRaw('users.id, users.name, SUM(payments.amount) as total, COUNT(*) as count')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total')
            ->get();

        // By source (sale, repair)
        $bySource = Payment::whereDate('payment_date', '>=', $dateFrom)
            ->whereDate('payment_date', '<=', $dateTo)
            ->selectRaw('payable_type, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('payable_type')
            ->get()
            ->map(function ($item) {
                $typeLabel = match ($item->payable_type) {
                    'App\Models\Sale' => 'Sales',
                    'App\Models\Repair' => 'Repairs',
                    default => 'Other',
                };
                return [
                    'source' => $typeLabel,
                    'total' => $item->total,
                    'count' => $item->count,
                ];
            });

        // Daily collections
        $daily = Payment::selectRaw('DATE(payment_date) as date, SUM(amount) as total, COUNT(*) as count')
            ->whereDate('payment_date', '>=', $dateFrom)
            ->whereDate('payment_date', '<=', $dateTo)
            ->groupByRaw('DATE(payment_date)')
            ->orderByRaw('DATE(payment_date)')
            ->get();

        return response()->json([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'total_collected' => $daily->sum('total'),
            'total_transactions' => $daily->sum('count'),
            'by_user' => $byUser,
            'by_source' => $bySource,
            'daily' => $daily,
        ]);
    }

    /**
     * Export cash flow report as PDF
     */
    public function exportCashFlowPdf(Request $request)
    {
        $data = json_decode($this->cashFlow($request)->content(), true);
        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.cash-flow-report', [
            'shop' => $shop,
            'data' => $data,
        ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="cash_flow_report.pdf"',
        ]);
    }

    /**
     * Export customer dues report as PDF
     */
    public function exportCustomerDuesPdf(Request $request)
    {
        $customers = Customer::where('total_due', '>', 0)
            ->orderByDesc('total_due')
            ->get()
            ->map(function ($customer) {
                return [
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'total_due' => $customer->total_due,
                ];
            });

        $totalDue = Customer::sum('total_due');
        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.customer-dues', [
            'shop' => $shop,
            'customers' => $customers,
            'total_due' => $totalDue,
        ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="customer_dues.pdf"',
        ]);
    }

    /**
     * Export supplier dues report as PDF
     */
    public function exportSupplierDuesPdf(Request $request)
    {
        $suppliers = Supplier::where('total_due', '>', 0)
            ->orderByDesc('total_due')
            ->get()
            ->map(function ($supplier) {
                return [
                    'name' => $supplier->name,
                    'contact_person' => $supplier->contact_person,
                    'phone' => $supplier->phone,
                    'total_due' => $supplier->total_due,
                ];
            });

        $totalDue = Supplier::sum('total_due');
        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.supplier-dues', [
            'shop' => $shop,
            'suppliers' => $suppliers,
            'total_due' => $totalDue,
        ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="supplier_dues.pdf"',
        ]);
    }
}
