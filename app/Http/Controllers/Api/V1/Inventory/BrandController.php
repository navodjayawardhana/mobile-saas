<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class BrandController extends Controller
{
    /**
     * Display a listing of brands.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Brand::query()->withCount('products');

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Active filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Sorting
        $sortField = $request->get('sort_by', 'name');
        $sortDirection = $request->get('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $brands = $query->paginate($perPage);

        return response()->json([
            'brands' => $brands->items(),
            'meta' => [
                'current_page' => $brands->currentPage(),
                'last_page' => $brands->lastPage(),
                'per_page' => $brands->perPage(),
                'total' => $brands->total(),
            ],
        ]);
    }

    /**
     * Get all active brands (for dropdowns).
     */
    public function all(): JsonResponse
    {
        $brands = Brand::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'logo']);

        return response()->json([
            'brands' => $brands,
        ]);
    }

    /**
     * Store a newly created brand.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('brands')->where('shop_id', $request->user()->shop_id),
            ],
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'is_active' => 'boolean',
        ]);

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = \Str::slug($validated['name']);
            // Ensure unique slug
            $count = 1;
            $originalSlug = $validated['slug'];
            while (Brand::where('shop_id', $request->user()->shop_id)
                        ->where('slug', $validated['slug'])->exists()) {
                $validated['slug'] = $originalSlug . '-' . $count++;
            }
        }

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $validated['logo'] = $request->file('logo')->store('brands', 'public');
        }

        $validated['is_active'] = $validated['is_active'] ?? true;

        $brand = Brand::create($validated);

        return response()->json([
            'message' => 'Brand created successfully',
            'brand' => $brand,
        ], 201);
    }

    /**
     * Display the specified brand.
     */
    public function show(string $id): JsonResponse
    {
        $brand = Brand::withCount('products')->findOrFail($id);

        return response()->json([
            'brand' => $brand,
        ]);
    }

    /**
     * Update the specified brand.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('brands')
                    ->where('shop_id', $request->user()->shop_id)
                    ->ignore($brand->id),
            ],
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'is_active' => 'boolean',
        ]);

        // Handle logo upload
        if ($request->hasFile('logo')) {
            // Delete old logo
            if ($brand->logo) {
                \Storage::disk('public')->delete($brand->logo);
            }
            $validated['logo'] = $request->file('logo')->store('brands', 'public');
        }

        $brand->update($validated);

        return response()->json([
            'message' => 'Brand updated successfully',
            'brand' => $brand->fresh(),
        ]);
    }

    /**
     * Remove the specified brand.
     */
    public function destroy(string $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);

        // Check for products
        if ($brand->products()->exists()) {
            return response()->json([
                'message' => 'Cannot delete brand with existing products. Please move or delete products first.',
            ], 422);
        }

        // Delete logo
        if ($brand->logo) {
            \Storage::disk('public')->delete($brand->logo);
        }

        $brand->delete();

        return response()->json([
            'message' => 'Brand deleted successfully',
        ]);
    }

    /**
     * Toggle brand active status.
     */
    public function toggleActive(string $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);
        $brand->is_active = !$brand->is_active;
        $brand->save();

        return response()->json([
            'message' => 'Brand status updated successfully',
            'brand' => $brand,
        ]);
    }
}
