<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    /**
     * List all expense categories.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ExpenseCategory::orderBy('name');

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $categories = $query->get();

        return response()->json([
            'expense_categories' => $categories,
        ]);
    }

    /**
     * Create a new expense category.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        $category = ExpenseCategory::create([
            'name' => $request->name,
            'description' => $request->description,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'message' => 'Expense category created successfully',
            'expense_category' => $category,
        ], 201);
    }

    /**
     * Get a specific expense category.
     */
    public function show(string $id): JsonResponse
    {
        $category = ExpenseCategory::findOrFail($id);

        return response()->json([
            'expense_category' => $category,
        ]);
    }

    /**
     * Update an expense category.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $category = ExpenseCategory::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        $category->update([
            'name' => $request->name,
            'description' => $request->description,
            'is_active' => $request->is_active ?? $category->is_active,
        ]);

        return response()->json([
            'message' => 'Expense category updated successfully',
            'expense_category' => $category->fresh(),
        ]);
    }

    /**
     * Delete an expense category.
     */
    public function destroy(string $id): JsonResponse
    {
        $category = ExpenseCategory::findOrFail($id);

        // Check if can be deleted
        $canDelete = $category->canDelete();
        if (!$canDelete['can_delete']) {
            return response()->json([
                'message' => $canDelete['reason'],
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Expense category deleted successfully',
        ]);
    }
}
