<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query()
            ->withCount('products')
            ->with('parent:id,name');

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Parent filter (null for root categories)
        if ($request->has('parent_id')) {
            $query->where('parent_id', $request->parent_id ?: null);
        }

        // Sorting
        $sortField = $request->get('sort_by', 'sort_order');
        $sortDirection = $request->get('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $categories = $query->paginate($perPage);

        return response()->json([
            'categories' => $categories->items(),
            'meta' => [
                'current_page' => $categories->currentPage(),
                'last_page' => $categories->lastPage(),
                'per_page' => $categories->perPage(),
                'total' => $categories->total(),
            ],
        ]);
    }

    /**
     * Get all categories as tree structure.
     */
    public function tree(): JsonResponse
    {
        $categories = Category::whereNull('parent_id')
            ->with('children.children')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories')->where('shop_id', $request->user()->shop_id),
            ],
            'parent_id' => 'nullable|uuid|exists:categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = \Str::slug($validated['name']);
            // Ensure unique slug
            $count = 1;
            $originalSlug = $validated['slug'];
            while (Category::where('shop_id', $request->user()->shop_id)
                          ->where('slug', $validated['slug'])->exists()) {
                $validated['slug'] = $originalSlug . '-' . $count++;
            }
        }

        // Handle image upload
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('categories', 'public');
        }

        // Set default sort order
        if (!isset($validated['sort_order'])) {
            $validated['sort_order'] = Category::where('parent_id', $validated['parent_id'] ?? null)->max('sort_order') + 1;
        }

        $category = Category::create($validated);

        return response()->json([
            'message' => 'Category created successfully',
            'category' => $category->load('parent:id,name'),
        ], 201);
    }

    /**
     * Display the specified category.
     */
    public function show(string $id): JsonResponse
    {
        $category = Category::with(['parent:id,name', 'children:id,parent_id,name,slug'])
            ->withCount('products')
            ->findOrFail($id);

        return response()->json([
            'category' => $category,
        ]);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories')
                    ->where('shop_id', $request->user()->shop_id)
                    ->ignore($category->id),
            ],
            'parent_id' => [
                'nullable',
                'uuid',
                'exists:categories,id',
                // Prevent setting self or descendants as parent
                function ($attribute, $value, $fail) use ($category) {
                    if ($value === $category->id) {
                        $fail('A category cannot be its own parent.');
                    }
                    if ($value && $this->isDescendant($category, $value)) {
                        $fail('Cannot set a descendant as parent.');
                    }
                },
            ],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image
            if ($category->image) {
                \Storage::disk('public')->delete($category->image);
            }
            $validated['image'] = $request->file('image')->store('categories', 'public');
        }

        $category->update($validated);

        return response()->json([
            'message' => 'Category updated successfully',
            'category' => $category->fresh()->load('parent:id,name'),
        ]);
    }

    /**
     * Remove the specified category.
     */
    public function destroy(string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        // Check for products
        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category with existing products. Please move or delete products first.',
            ], 422);
        }

        // Check for children
        if ($category->children()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category with subcategories. Please delete subcategories first.',
            ], 422);
        }

        // Delete image
        if ($category->image) {
            \Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully',
        ]);
    }

    /**
     * Check if a category is a descendant of another.
     */
    private function isDescendant(Category $category, string $potentialParentId): bool
    {
        $descendants = collect();
        $this->getDescendants($category, $descendants);
        return $descendants->contains('id', $potentialParentId);
    }

    /**
     * Recursively get all descendants.
     */
    private function getDescendants(Category $category, &$descendants): void
    {
        foreach ($category->children as $child) {
            $descendants->push($child);
            $this->getDescendants($child, $descendants);
        }
    }
}
