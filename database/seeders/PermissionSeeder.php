<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Dashboard
            ['name' => 'View Dashboard', 'slug' => 'view_dashboard', 'group' => 'Dashboard', 'description' => 'Can view the dashboard'],

            // Inventory
            ['name' => 'View Products', 'slug' => 'view_products', 'group' => 'Inventory', 'description' => 'Can view products list'],
            ['name' => 'Create Products', 'slug' => 'create_products', 'group' => 'Inventory', 'description' => 'Can create new products'],
            ['name' => 'Edit Products', 'slug' => 'edit_products', 'group' => 'Inventory', 'description' => 'Can edit existing products'],
            ['name' => 'Delete Products', 'slug' => 'delete_products', 'group' => 'Inventory', 'description' => 'Can delete products'],
            ['name' => 'Manage Stock', 'slug' => 'manage_stock', 'group' => 'Inventory', 'description' => 'Can manage stock levels and adjustments'],

            // Sales
            ['name' => 'View Sales', 'slug' => 'view_sales', 'group' => 'Sales', 'description' => 'Can view sales list'],
            ['name' => 'Create Sales', 'slug' => 'create_sales', 'group' => 'Sales', 'description' => 'Can create new sales'],
            ['name' => 'Edit Sales', 'slug' => 'edit_sales', 'group' => 'Sales', 'description' => 'Can edit existing sales'],
            ['name' => 'Void Sales', 'slug' => 'void_sales', 'group' => 'Sales', 'description' => 'Can void sales'],
            ['name' => 'Apply Discounts', 'slug' => 'apply_discounts', 'group' => 'Sales', 'description' => 'Can apply discounts to sales'],
            ['name' => 'Manage Installments', 'slug' => 'manage_installments', 'group' => 'Sales', 'description' => 'Can manage installment plans'],

            // POS
            ['name' => 'Use POS', 'slug' => 'use_pos', 'group' => 'POS', 'description' => 'Can use the point of sale system'],

            // Repairs
            ['name' => 'View Repairs', 'slug' => 'view_repairs', 'group' => 'Repairs', 'description' => 'Can view repairs list'],
            ['name' => 'Create Repairs', 'slug' => 'create_repairs', 'group' => 'Repairs', 'description' => 'Can create new repair jobs'],
            ['name' => 'Edit Repairs', 'slug' => 'edit_repairs', 'group' => 'Repairs', 'description' => 'Can edit repair jobs'],
            ['name' => 'Update Repair Status', 'slug' => 'update_repair_status', 'group' => 'Repairs', 'description' => 'Can update repair status'],

            // Customers
            ['name' => 'View Customers', 'slug' => 'view_customers', 'group' => 'Customers', 'description' => 'Can view customers list'],
            ['name' => 'Manage Customers', 'slug' => 'manage_customers', 'group' => 'Customers', 'description' => 'Can create, edit, and delete customers'],

            // Suppliers
            ['name' => 'View Suppliers', 'slug' => 'view_suppliers', 'group' => 'Suppliers', 'description' => 'Can view suppliers list'],
            ['name' => 'Manage Suppliers', 'slug' => 'manage_suppliers', 'group' => 'Suppliers', 'description' => 'Can create, edit, and delete suppliers'],
            ['name' => 'Create Purchase Orders', 'slug' => 'create_purchase_orders', 'group' => 'Suppliers', 'description' => 'Can create purchase orders'],

            // Expenses
            ['name' => 'View Expenses', 'slug' => 'view_expenses', 'group' => 'Expenses', 'description' => 'Can view expenses list'],
            ['name' => 'Manage Expenses', 'slug' => 'manage_expenses', 'group' => 'Expenses', 'description' => 'Can create, edit, and delete expenses'],

            // Reports
            ['name' => 'View Reports', 'slug' => 'view_reports', 'group' => 'Reports', 'description' => 'Can view reports'],
            ['name' => 'View Financial Reports', 'slug' => 'view_financial_reports', 'group' => 'Reports', 'description' => 'Can view financial reports'],
            ['name' => 'Export Reports', 'slug' => 'export_reports', 'group' => 'Reports', 'description' => 'Can export reports'],

            // Settings
            ['name' => 'Manage Shop Settings', 'slug' => 'manage_shop_settings', 'group' => 'Settings', 'description' => 'Can manage shop settings'],
            ['name' => 'Manage Currencies', 'slug' => 'manage_currencies', 'group' => 'Settings', 'description' => 'Can manage currencies'],
            ['name' => 'Manage Payment Methods', 'slug' => 'manage_payment_methods', 'group' => 'Settings', 'description' => 'Can manage payment methods'],
            ['name' => 'Manage Roles', 'slug' => 'manage_roles', 'group' => 'Settings', 'description' => 'Can manage roles and permissions'],
            ['name' => 'Manage Users', 'slug' => 'manage_users', 'group' => 'Settings', 'description' => 'Can manage users'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }
    }
}
