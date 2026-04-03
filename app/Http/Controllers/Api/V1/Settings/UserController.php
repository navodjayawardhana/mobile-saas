<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * List all users.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('role')
            ->where('shop_id', $request->user()->shop_id);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = $request->input('per_page', 15);
        $users = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'users' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Create a new user.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => ['required', Password::min(8)],
            'role_id' => 'required|uuid|exists:roles,id',
            'is_active' => 'boolean',
        ]);

        $user = User::create([
            'shop_id' => $request->user()->shop_id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->load('role'),
        ], 201);
    }

    /**
     * Get a specific user.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = User::with('role')
            ->where('shop_id', $request->user()->shop_id)
            ->findOrFail($id);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'is_active' => $user->is_active,
                'role' => $user->role ? [
                    'id' => $user->role->id,
                    'name' => $user->role->name,
                ] : null,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    /**
     * Update a user.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::where('shop_id', $request->user()->shop_id)
            ->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'password' => ['nullable', Password::min(8)],
            'role_id' => 'required|uuid|exists:roles,id',
            'is_active' => 'boolean',
        ]);

        // Prevent deactivating yourself
        if ($user->id === $request->user()->id && $request->has('is_active') && !$request->is_active) {
            return response()->json([
                'message' => 'You cannot deactivate your own account',
            ], 422);
        }

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'role_id' => $request->role_id,
            'is_active' => $request->is_active ?? $user->is_active,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->fresh()->load('role'),
        ]);
    }

    /**
     * Delete a user.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = User::where('shop_id', $request->user()->shop_id)
            ->findOrFail($id);

        // Prevent deleting yourself
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot delete your own account',
            ], 422);
        }

        // Check if user has related data
        if ($user->sales()->exists()) {
            return response()->json([
                'message' => 'Cannot delete user with sales records. Consider deactivating instead.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Toggle user active status.
     */
    public function toggleActive(Request $request, string $id): JsonResponse
    {
        $user = User::where('shop_id', $request->user()->shop_id)
            ->findOrFail($id);

        // Prevent deactivating yourself
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot deactivate your own account',
            ], 422);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'message' => 'User status updated successfully',
            'user' => $user->fresh()->load('role'),
        ]);
    }
}
