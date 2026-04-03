<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ExpenseController extends Controller
{
    /**
     * Get paginated list of expenses with filters
     */
    public function index(Request $request)
    {
        $query = Expense::with(['user:id,name', 'category:id,name']);

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('expense_category_id', $request->category_id);
        }

        // Filter by user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('expense_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('expense_date', '<=', $request->date_to);
        }

        // Filter by amount range
        if ($request->filled('amount_min')) {
            $query->where('amount', '>=', $request->amount_min);
        }
        if ($request->filled('amount_max')) {
            $query->where('amount', '<=', $request->amount_max);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'expense_date');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $perPage = $request->input('per_page', 15);
        $expenses = $query->paginate($perPage);

        return response()->json($expenses);
    }

    /**
     * Store a new expense
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'expense_category_id' => 'required|exists:expense_categories,id',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'expense_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verify category belongs to shop
        $category = ExpenseCategory::find($request->expense_category_id);
        if (!$category) {
            return response()->json(['message' => 'Invalid expense category'], 422);
        }

        $expense = Expense::create([
            'shop_id' => auth()->user()->shop_id,
            'user_id' => auth()->id(),
            'expense_category_id' => $request->expense_category_id,
            'description' => $request->description,
            'amount' => $request->amount,
            'expense_date' => $request->expense_date,
            'notes' => $request->notes,
        ]);

        $expense->load(['user:id,name', 'category:id,name']);

        return response()->json([
            'message' => 'Expense created successfully',
            'expense' => $expense,
        ], 201);
    }

    /**
     * Get a single expense
     */
    public function show(string $id)
    {
        $expense = Expense::with(['user:id,name', 'category:id,name'])
            ->find($id);

        if (!$expense) {
            return response()->json(['message' => 'Expense not found'], 404);
        }

        return response()->json($expense);
    }

    /**
     * Update an expense
     */
    public function update(Request $request, string $id)
    {
        $expense = Expense::find($id);

        if (!$expense) {
            return response()->json(['message' => 'Expense not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'expense_category_id' => 'sometimes|required|exists:expense_categories,id',
            'description' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'expense_date' => 'sometimes|required|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // If changing category, verify it belongs to shop
        if ($request->filled('expense_category_id')) {
            $category = ExpenseCategory::find($request->expense_category_id);
            if (!$category) {
                return response()->json(['message' => 'Invalid expense category'], 422);
            }
        }

        $expense->update($request->only([
            'expense_category_id',
            'description',
            'amount',
            'expense_date',
            'notes',
        ]));

        $expense->load(['user:id,name', 'category:id,name']);

        return response()->json([
            'message' => 'Expense updated successfully',
            'expense' => $expense,
        ]);
    }

    /**
     * Delete an expense
     */
    public function destroy(string $id)
    {
        $expense = Expense::find($id);

        if (!$expense) {
            return response()->json(['message' => 'Expense not found'], 404);
        }

        // Delete receipt if exists
        if ($expense->receipt_path) {
            Storage::disk('public')->delete($expense->receipt_path);
        }

        $expense->delete();

        return response()->json(['message' => 'Expense deleted successfully']);
    }

    /**
     * Upload receipt for an expense
     */
    public function uploadReceipt(Request $request, string $id)
    {
        $expense = Expense::find($id);

        if (!$expense) {
            return response()->json(['message' => 'Expense not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'receipt' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Delete old receipt if exists
        if ($expense->receipt_path) {
            Storage::disk('public')->delete($expense->receipt_path);
        }

        // Store new receipt
        $path = $request->file('receipt')->store('expenses/receipts', 'public');
        $expense->update(['receipt_path' => $path]);

        return response()->json([
            'message' => 'Receipt uploaded successfully',
            'receipt_url' => Storage::url($path),
        ]);
    }

    /**
     * Delete receipt from an expense
     */
    public function deleteReceipt(string $id)
    {
        $expense = Expense::find($id);

        if (!$expense) {
            return response()->json(['message' => 'Expense not found'], 404);
        }

        if (!$expense->receipt_path) {
            return response()->json(['message' => 'No receipt to delete'], 422);
        }

        Storage::disk('public')->delete($expense->receipt_path);
        $expense->update(['receipt_path' => null]);

        return response()->json(['message' => 'Receipt deleted successfully']);
    }

    /**
     * Get expense summary/statistics
     */
    public function summary(Request $request)
    {
        $query = Expense::query();

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('expense_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('expense_date', '<=', $request->date_to);
        }

        $totalExpenses = $query->sum('amount');
        $expenseCount = $query->count();

        // Expenses by category
        $byCategory = Expense::selectRaw('expense_category_id, SUM(amount) as total, COUNT(*) as count')
            ->when($request->filled('date_from'), function ($q) use ($request) {
                $q->whereDate('expense_date', '>=', $request->date_from);
            })
            ->when($request->filled('date_to'), function ($q) use ($request) {
                $q->whereDate('expense_date', '<=', $request->date_to);
            })
            ->groupBy('expense_category_id')
            ->with('category:id,name')
            ->get()
            ->map(function ($item) {
                return [
                    'category_id' => $item->expense_category_id,
                    'category_name' => $item->category?->name ?? 'Unknown',
                    'total' => $item->total,
                    'count' => $item->count,
                ];
            });

        // Monthly breakdown (last 12 months)
        $monthlyExpenses = Expense::selectRaw('YEAR(expense_date) as year, MONTH(expense_date) as month, SUM(amount) as total')
            ->where('expense_date', '>=', now()->subMonths(12))
            ->groupByRaw('YEAR(expense_date), MONTH(expense_date)')
            ->orderByRaw('YEAR(expense_date), MONTH(expense_date)')
            ->get();

        // Recent expenses
        $recentExpenses = Expense::with(['user:id,name', 'category:id,name'])
            ->orderBy('expense_date', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'total_expenses' => $totalExpenses,
            'expense_count' => $expenseCount,
            'average_expense' => $expenseCount > 0 ? round($totalExpenses / $expenseCount, 2) : 0,
            'by_category' => $byCategory,
            'monthly_breakdown' => $monthlyExpenses,
            'recent_expenses' => $recentExpenses,
        ]);
    }
}
