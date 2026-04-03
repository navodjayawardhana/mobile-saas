<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    /**
     * List all permissions grouped by category.
     */
    public function index(): JsonResponse
    {
        $permissions = Permission::orderBy('group')->orderBy('name')->get();

        // Group permissions by category
        $grouped = $permissions->groupBy('group')->map(function ($items, $group) {
            return [
                'group' => $group,
                'permissions' => $items->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'slug' => $permission->slug,
                        'description' => $permission->description,
                    ];
                })->values(),
            ];
        })->values();

        return response()->json([
            'permission_groups' => $grouped,
            'permissions' => $permissions,
        ]);
    }
}
