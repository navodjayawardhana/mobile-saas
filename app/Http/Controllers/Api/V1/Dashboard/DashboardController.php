<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Repair;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Installment;
use App\Models\PurchaseOrder;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get overview statistics
     */
    public function stats()
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $startOfYear = Carbon::now()->startOfYear();

        // Today's stats
        $todaySales = Sale::whereDate('sale_date', $today)
            ->where('status', '!=', 'voided')
            ->sum('total_amount');

        $todaySalesCount = Sale::whereDate('sale_date', $today)
            ->where('status', '!=', 'voided')
            ->count();

        // Monthly stats
        $monthlySales = Sale::whereDate('sale_date', '>=', $startOfMonth)
            ->where('status', '!=', 'voided')
            ->sum('total_amount');

        $monthlyExpenses = Expense::whereDate('expense_date', '>=', $startOfMonth)
            ->sum('amount');

        // Repairs
        $activeRepairs = Repair::whereNotIn('status', ['completed', 'delivered', 'cancelled'])
            ->count();

        $overdueRepairs = Repair::whereNotIn('status', ['completed', 'delivered', 'cancelled'])
            ->whereNotNull('estimated_completion')
            ->where('estimated_completion', '<', $today)
            ->count();

        // Low stock
        $lowStockCount = Product::whereColumn('quantity', '<=', 'min_stock_alert')
            ->where('is_active', true)
            ->count();

        // Outstanding dues
        $customerDues = Customer::sum('total_due');
        $supplierDues = DB::table('suppliers')->sum('total_due');

        // Overdue installments
        $overdueInstallments = Installment::where('status', 'pending')
            ->where('due_date', '<', $today)
            ->count();

        // Pending purchase orders
        $pendingPOs = PurchaseOrder::where('status', 'pending')
            ->count();

        return response()->json([
            'today' => [
                'sales_amount' => $todaySales,
                'sales_count' => $todaySalesCount,
            ],
            'month' => [
                'sales_amount' => $monthlySales,
                'expenses_amount' => $monthlyExpenses,
                'profit' => $monthlySales - $monthlyExpenses,
            ],
            'repairs' => [
                'active' => $activeRepairs,
                'overdue' => $overdueRepairs,
            ],
            'inventory' => [
                'low_stock' => $lowStockCount,
            ],
            'dues' => [
                'customer_dues' => $customerDues,
                'supplier_dues' => $supplierDues,
            ],
            'installments' => [
                'overdue' => $overdueInstallments,
            ],
            'purchase_orders' => [
                'pending' => $pendingPOs,
            ],
        ]);
    }

    /**
     * Get sales chart data
     */
    public function salesChart(Request $request)
    {
        $period = $request->input('period', '7days'); // 7days, 30days, 12months

        switch ($period) {
            case '30days':
                $startDate = Carbon::now()->subDays(30);
                $groupBy = 'DATE(sale_date)';
                $format = 'Y-m-d';
                break;
            case '12months':
                $startDate = Carbon::now()->subMonths(12)->startOfMonth();
                $groupBy = "DATE_FORMAT(sale_date, '%Y-%m')";
                $format = 'Y-m';
                break;
            default: // 7days
                $startDate = Carbon::now()->subDays(7);
                $groupBy = 'DATE(sale_date)';
                $format = 'Y-m-d';
        }

        $sales = Sale::selectRaw("$groupBy as date, SUM(total_amount) as total, COUNT(*) as count")
            ->where('sale_date', '>=', $startDate)
            ->where('status', '!=', 'voided')
            ->groupByRaw($groupBy)
            ->orderByRaw($groupBy)
            ->get();

        $expenses = Expense::selectRaw("$groupBy as date, SUM(amount) as total")
            ->where('expense_date', '>=', $startDate)
            ->groupByRaw(str_replace('sale_date', 'expense_date', $groupBy))
            ->orderByRaw(str_replace('sale_date', 'expense_date', $groupBy))
            ->get()
            ->keyBy('date');

        $chartData = $sales->map(function ($sale) use ($expenses) {
            $expenseAmount = $expenses->get($sale->date)?->total ?? 0;
            return [
                'date' => $sale->date,
                'sales' => $sale->total,
                'sales_count' => $sale->count,
                'expenses' => $expenseAmount,
                'profit' => $sale->total - $expenseAmount,
            ];
        });

        return response()->json($chartData);
    }

    /**
     * Get recent sales
     */
    public function recentSales()
    {
        $sales = Sale::with(['customer:id,name', 'user:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'invoice_number' => $sale->invoice_number,
                    'customer_name' => $sale->customer?->name ?? 'Walk-in',
                    'total_amount' => $sale->total_amount,
                    'payment_status' => $sale->payment_status,
                    'sale_date' => $sale->sale_date,
                    'user_name' => $sale->user?->name,
                ];
            });

        return response()->json($sales);
    }

    /**
     * Get recent repairs
     */
    public function recentRepairs()
    {
        $repairs = Repair::with(['customer:id,name', 'technician:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($repair) {
                return [
                    'id' => $repair->id,
                    'job_number' => $repair->job_number,
                    'customer_name' => $repair->customer?->name ?? 'Walk-in',
                    'device' => "{$repair->device_type} {$repair->device_brand} {$repair->device_model}",
                    'status' => $repair->status,
                    'priority' => $repair->priority,
                    'technician_name' => $repair->technician?->name ?? 'Unassigned',
                    'received_at' => $repair->received_at,
                ];
            });

        return response()->json($repairs);
    }

    /**
     * Get low stock alerts
     */
    public function lowStock()
    {
        $products = Product::with(['category:id,name', 'brand:id,name'])
            ->whereColumn('quantity', '<=', 'min_stock_alert')
            ->where('is_active', true)
            ->orderBy('quantity')
            ->limit(10)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'category' => $product->category?->name,
                    'brand' => $product->brand?->name,
                    'current_stock' => $product->quantity,
                    'min_stock_alert' => $product->min_stock_alert,
                ];
            });

        return response()->json($products);
    }

    /**
     * Get overdue items (repairs, installments)
     */
    public function overdue()
    {
        $today = Carbon::today();

        // Overdue repairs
        $overdueRepairs = Repair::with(['customer:id,name,phone'])
            ->whereNotIn('status', ['completed', 'delivered', 'cancelled'])
            ->whereNotNull('estimated_completion')
            ->where('estimated_completion', '<', $today)
            ->orderBy('estimated_completion')
            ->limit(5)
            ->get()
            ->map(function ($repair) use ($today) {
                return [
                    'type' => 'repair',
                    'id' => $repair->id,
                    'reference' => $repair->job_number,
                    'customer_name' => $repair->customer?->name ?? 'Walk-in',
                    'customer_phone' => $repair->customer?->phone,
                    'due_date' => $repair->estimated_completion,
                    'days_overdue' => $today->diffInDays($repair->estimated_completion),
                ];
            });

        // Overdue installments
        $overdueInstallments = Installment::with(['installmentPlan.customer:id,name,phone'])
            ->where('status', 'pending')
            ->where('due_date', '<', $today)
            ->orderBy('due_date')
            ->limit(5)
            ->get()
            ->map(function ($installment) use ($today) {
                return [
                    'type' => 'installment',
                    'id' => $installment->id,
                    'reference' => "Installment #{$installment->installment_number}",
                    'customer_name' => $installment->installmentPlan->customer?->name ?? 'Unknown',
                    'customer_phone' => $installment->installmentPlan->customer?->phone,
                    'amount' => $installment->amount,
                    'due_date' => $installment->due_date,
                    'days_overdue' => $today->diffInDays($installment->due_date),
                ];
            });

        return response()->json([
            'repairs' => $overdueRepairs,
            'installments' => $overdueInstallments,
        ]);
    }

    /**
     * Get payment methods breakdown for today
     */
    public function paymentMethods()
    {
        $today = Carbon::today();

        $payments = Payment::selectRaw('payment_method_id, SUM(amount) as total, COUNT(*) as count')
            ->whereDate('payment_date', $today)
            ->groupBy('payment_method_id')
            ->with('paymentMethod:id,name')
            ->get()
            ->map(function ($payment) {
                return [
                    'method' => $payment->paymentMethod?->name ?? 'Unknown',
                    'total' => $payment->total,
                    'count' => $payment->count,
                ];
            });

        return response()->json($payments);
    }

    /**
     * Get top selling products
     */
    public function topProducts(Request $request)
    {
        $days = $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days);

        $products = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.sale_date', '>=', $startDate)
            ->where('sales.status', '!=', 'voided')
            ->selectRaw('products.id, products.name, products.sku, SUM(sale_items.quantity) as total_qty, SUM(sale_items.total_price) as total_revenue')
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get();

        return response()->json($products);
    }

    /**
     * Get activity feed
     */
    public function activityFeed()
    {
        $activities = [];

        // Recent sales
        $recentSales = Sale::with(['user:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($sale) {
                return [
                    'type' => 'sale',
                    'message' => "New sale #{$sale->invoice_number}",
                    'amount' => $sale->total_amount,
                    'user' => $sale->user?->name,
                    'time' => $sale->created_at,
                ];
            });

        // Recent repairs
        $recentRepairs = Repair::with(['user:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($repair) {
                return [
                    'type' => 'repair',
                    'message' => "New repair job #{$repair->job_number}",
                    'user' => $repair->received_by?->name,
                    'time' => $repair->created_at,
                ];
            });

        // Recent expenses
        $recentExpenses = Expense::with(['user:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($expense) {
                return [
                    'type' => 'expense',
                    'message' => "Expense: {$expense->description}",
                    'amount' => $expense->amount,
                    'user' => $expense->user?->name,
                    'time' => $expense->created_at,
                ];
            });

        // Merge and sort by time
        $activities = collect()
            ->merge($recentSales)
            ->merge($recentRepairs)
            ->merge($recentExpenses)
            ->sortByDesc('time')
            ->take(15)
            ->values();

        return response()->json($activities);
    }
}
