<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    /**
     * List all roles.
     */
    public function index(): JsonResponse
    {
        $roles = Role::withCount('users')
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json([
            'roles' => $roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'is_system' => $role->is_system,
                    'users_count' => $role->users_count,
                ];
            }),
        ]);
    }

    /**
     * Create a new role.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'permissions' => 'array',
            'permissions.*' => 'uuid|exists:permissions,id',
        ]);

        // Check for duplicate name
        $exists = Role::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json([
                'message' => 'Role with this name already exists',
            ], 422);
        }

        $role = Role::create([
            'name' => $request->name,
            'description' => $request->description,
            'is_system' => false,
        ]);

        // Attach permissions
        if ($request->has('permissions')) {
            $role->permissions()->attach($request->permissions);
        }

        return response()->json([
            'message' => 'Role created successfully',
            'role' => $role->load('permissions'),
        ], 201);
    }

    /**
     * Get a specific role with permissions.
     */
    public function show(string $id): JsonResponse
    {
        $role = Role::with('permissions')->findOrFail($id);

        return response()->json([
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
                'is_system' => $role->is_system,
                'permissions' => $role->permissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'slug' => $permission->slug,
                        'group' => $permission->group,
                    ];
                }),
                'permission_ids' => $role->permissions->pluck('id'),
            ],
        ]);
    }

    /**
     * Update a role.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        // Check for duplicate name (excluding current)
        $exists = Role::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json([
                'message' => 'Role with this name already exists',
            ], 422);
        }

        // Cannot rename system roles
        if ($role->is_system && $role->name !== $request->name) {
            return response()->json([
                'message' => 'Cannot rename system roles',
            ], 422);
        }

        $role->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Role updated successfully',
            'role' => $role->fresh()->load('permissions'),
        ]);
    }

    /**
     * Delete a role.
     */
    public function destroy(string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // Cannot delete system roles
        if ($role->is_system) {
            return response()->json([
                'message' => 'Cannot delete system roles',
            ], 422);
        }

        // Check if can be deleted
        $canDelete = $role->canDelete();
        if (!$canDelete['can_delete']) {
            return response()->json([
                'message' => $canDelete['reason'],
            ], 422);
        }

        $role->delete();

        return response()->json([
            'message' => 'Role deleted successfully',
        ]);
    }

    /**
     * Update role permissions.
     */
    public function updatePermissions(Request $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $request->validate([
            'permissions' => 'array',
            'permissions.*' => 'uuid|exists:permissions,id',
        ]);

        // Sync permissions
        $role->permissions()->sync($request->permissions ?? []);

        return response()->json([
            'message' => 'Role permissions updated successfully',
            'role' => $role->fresh()->load('permissions'),
        ]);
    }
}
