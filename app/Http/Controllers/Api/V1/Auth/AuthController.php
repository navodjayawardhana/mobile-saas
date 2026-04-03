<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Models\PaymentMethod;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Register a new shop and owner.
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'shop_name' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::min(8)],
            'phone' => 'nullable|string|max:20',
        ]);

        try {
            DB::beginTransaction();

            // Create shop
            $shop = Shop::create([
                'name' => $request->shop_name,
                'slug' => Str::slug($request->shop_name) . '-' . Str::random(6),
                'email' => $request->email,
                'phone' => $request->phone,
                'timezone' => 'UTC',
                'subscription_plan' => 'free',
            ]);

            // Create default currency
            $currency = Currency::create([
                'shop_id' => $shop->id,
                'code' => 'USD',
                'name' => 'US Dollar',
                'symbol' => '$',
                'exchange_rate' => 1.000000,
                'is_default' => true,
            ]);

            $shop->update(['default_currency_id' => $currency->id]);

            // Create default payment methods
            $paymentMethods = ['Cash', 'Card', 'Bank Transfer', 'Mobile Payment'];
            foreach ($paymentMethods as $method) {
                PaymentMethod::create([
                    'shop_id' => $shop->id,
                    'name' => $method,
                    'is_active' => true,
                ]);
            }

            // Create Owner role with all permissions
            $ownerRole = Role::create([
                'shop_id' => $shop->id,
                'name' => 'Owner',
                'description' => 'Full access to all features',
                'is_system' => true,
            ]);

            // Attach all permissions to owner role
            $permissions = Permission::all();
            $ownerRole->permissions()->attach($permissions->pluck('id'));

            // Create other default roles
            $this->createDefaultRoles($shop->id);

            // Create user
            $user = User::create([
                'shop_id' => $shop->id,
                'role_id' => $ownerRole->id,
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'is_active' => true,
            ]);

            DB::commit();

            // Generate token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Registration successful',
                'user' => $this->getUserData($user),
                'token' => $token,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login user.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $this->getUserData($user),
            'token' => $token,
        ]);
    }

    /**
     * Logout user.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get current user.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->getUserData($request->user()),
        ]);
    }

    /**
     * Get user data with shop and permissions.
     */
    private function getUserData(User $user): array
    {
        $user->load(['shop', 'role.permissions']);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'is_active' => $user->is_active,
            'shop' => $user->shop ? [
                'id' => $user->shop->id,
                'name' => $user->shop->name,
                'slug' => $user->shop->slug,
                'logo' => $user->shop->logo,
                'email' => $user->shop->email,
                'phone' => $user->shop->phone,
                'address' => $user->shop->address,
                'timezone' => $user->shop->timezone,
            ] : null,
            'role' => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
            ] : null,
            'permissions' => $user->getPermissions(),
        ];
    }

    /**
     * Create default roles for a shop.
     */
    private function createDefaultRoles(string $shopId): void
    {
        // Manager role
        $managerRole = Role::create([
            'shop_id' => $shopId,
            'name' => 'Manager',
            'description' => 'Can manage most shop operations',
            'is_system' => true,
        ]);

        $managerPermissions = Permission::whereIn('slug', [
            'view_dashboard',
            'view_products', 'create_products', 'edit_products',
            'manage_stock',
            'view_sales', 'create_sales', 'edit_sales', 'apply_discounts',
            'use_pos',
            'view_repairs', 'create_repairs', 'edit_repairs', 'update_repair_status',
            'view_customers', 'manage_customers',
            'view_suppliers', 'manage_suppliers', 'create_purchase_orders',
            'view_expenses', 'manage_expenses',
            'view_reports',
        ])->pluck('id');
        $managerRole->permissions()->attach($managerPermissions);

        // Sales Staff role
        $salesRole = Role::create([
            'shop_id' => $shopId,
            'name' => 'Sales Staff',
            'description' => 'Can handle sales and POS',
            'is_system' => true,
        ]);

        $salesPermissions = Permission::whereIn('slug', [
            'view_dashboard',
            'view_products',
            'view_sales', 'create_sales',
            'use_pos',
            'view_customers', 'manage_customers',
        ])->pluck('id');
        $salesRole->permissions()->attach($salesPermissions);

        // Technician role
        $techRole = Role::create([
            'shop_id' => $shopId,
            'name' => 'Technician',
            'description' => 'Can manage repairs',
            'is_system' => true,
        ]);

        $techPermissions = Permission::whereIn('slug', [
            'view_dashboard',
            'view_products',
            'view_repairs', 'edit_repairs', 'update_repair_status',
            'view_customers',
        ])->pluck('id');
        $techRole->permissions()->attach($techPermissions);
    }
}
