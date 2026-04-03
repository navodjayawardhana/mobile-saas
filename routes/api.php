<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\ProfileController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\Settings\ShopSettingsController;
use App\Http\Controllers\Api\V1\Settings\CurrencyController;
use App\Http\Controllers\Api\V1\Settings\PaymentMethodController;
use App\Http\Controllers\Api\V1\Settings\ExpenseCategoryController;
use App\Http\Controllers\Api\V1\Settings\PermissionController;
use App\Http\Controllers\Api\V1\Settings\RoleController;
use App\Http\Controllers\Api\V1\Settings\UserController;
use App\Http\Controllers\Api\V1\Settings\NotificationSettingsController;
use App\Http\Controllers\Api\V1\Inventory\CategoryController;
use App\Http\Controllers\Api\V1\Inventory\BrandController;
use App\Http\Controllers\Api\V1\Inventory\ProductController;
use App\Http\Controllers\Api\V1\Inventory\InventoryItemController;
use App\Http\Controllers\Api\V1\Inventory\StockController;
use App\Http\Controllers\Api\V1\Customer\CustomerController;
use App\Http\Controllers\Api\V1\Sales\SaleController;
use App\Http\Controllers\Api\V1\Sales\PosController;
use App\Http\Controllers\Api\V1\Sales\PaymentController;
use App\Http\Controllers\Api\V1\Sales\InstallmentController;
use App\Http\Controllers\Api\V1\Supplier\SupplierController;
use App\Http\Controllers\Api\V1\Supplier\SupplierPaymentController;
use App\Http\Controllers\Api\V1\Supplier\PurchaseOrderController;
use App\Http\Controllers\Api\V1\Repair\RepairController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\Dashboard\DashboardController;
use App\Http\Controllers\Api\V1\Report\SalesReportController;
use App\Http\Controllers\Api\V1\Report\InventoryReportController;
use App\Http\Controllers\Api\V1\Report\RepairReportController;
use App\Http\Controllers\Api\V1\Report\FinancialReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// API Version 1
Route::prefix('v1')->group(function () {

    // Public auth routes
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
        Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);
    });

    // Protected routes
    Route::middleware(['auth:sanctum', 'shop.context'])->group(function () {

        // Auth routes
        Route::prefix('auth')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);

            // Profile
            Route::put('/profile', [ProfileController::class, 'update']);
            Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
            Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
            Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar']);
        });

        // Settings routes
        Route::prefix('settings')->group(function () {
            // Shop settings
            Route::get('/shop', [ShopSettingsController::class, 'show']);
            Route::put('/shop', [ShopSettingsController::class, 'update'])->middleware('permission:manage_shop_settings');
            Route::post('/shop/logo', [ShopSettingsController::class, 'uploadLogo'])->middleware('permission:manage_shop_settings');
            Route::delete('/shop/logo', [ShopSettingsController::class, 'deleteLogo'])->middleware('permission:manage_shop_settings');

            // Currencies
            Route::get('/currencies', [CurrencyController::class, 'index']);
            Route::post('/currencies', [CurrencyController::class, 'store'])->middleware('permission:manage_currencies');
            Route::get('/currencies/{id}', [CurrencyController::class, 'show']);
            Route::put('/currencies/{id}', [CurrencyController::class, 'update'])->middleware('permission:manage_currencies');
            Route::delete('/currencies/{id}', [CurrencyController::class, 'destroy'])->middleware('permission:manage_currencies');
            Route::post('/currencies/{id}/default', [CurrencyController::class, 'setDefault'])->middleware('permission:manage_currencies');

            // Payment Methods
            Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
            Route::post('/payment-methods', [PaymentMethodController::class, 'store'])->middleware('permission:manage_payment_methods');
            Route::get('/payment-methods/{id}', [PaymentMethodController::class, 'show']);
            Route::put('/payment-methods/{id}', [PaymentMethodController::class, 'update'])->middleware('permission:manage_payment_methods');
            Route::delete('/payment-methods/{id}', [PaymentMethodController::class, 'destroy'])->middleware('permission:manage_payment_methods');
            Route::post('/payment-methods/{id}/toggle', [PaymentMethodController::class, 'toggleActive'])->middleware('permission:manage_payment_methods');

            // Expense Categories
            Route::get('/expense-categories', [ExpenseCategoryController::class, 'index']);
            Route::post('/expense-categories', [ExpenseCategoryController::class, 'store'])->middleware('permission:manage_expenses');
            Route::get('/expense-categories/{id}', [ExpenseCategoryController::class, 'show']);
            Route::put('/expense-categories/{id}', [ExpenseCategoryController::class, 'update'])->middleware('permission:manage_expenses');
            Route::delete('/expense-categories/{id}', [ExpenseCategoryController::class, 'destroy'])->middleware('permission:manage_expenses');

            // Permissions
            Route::get('/permissions', [PermissionController::class, 'index'])->middleware('permission:manage_roles');

            // Roles
            Route::get('/roles', [RoleController::class, 'index']);
            Route::post('/roles', [RoleController::class, 'store'])->middleware('permission:manage_roles');
            Route::get('/roles/{id}', [RoleController::class, 'show']);
            Route::put('/roles/{id}', [RoleController::class, 'update'])->middleware('permission:manage_roles');
            Route::delete('/roles/{id}', [RoleController::class, 'destroy'])->middleware('permission:manage_roles');
            Route::put('/roles/{id}/permissions', [RoleController::class, 'updatePermissions'])->middleware('permission:manage_roles');

            // Users
            Route::get('/users', [UserController::class, 'index'])->middleware('permission:manage_users');
            Route::post('/users', [UserController::class, 'store'])->middleware('permission:manage_users');
            Route::get('/users/{id}', [UserController::class, 'show'])->middleware('permission:manage_users');
            Route::put('/users/{id}', [UserController::class, 'update'])->middleware('permission:manage_users');
            Route::delete('/users/{id}', [UserController::class, 'destroy'])->middleware('permission:manage_users');
            Route::post('/users/{id}/toggle', [UserController::class, 'toggleActive'])->middleware('permission:manage_users');

            // Notification Settings
            Route::get('/notifications', [NotificationSettingsController::class, 'index'])->middleware('permission:manage_shop_settings');
            Route::put('/notifications', [NotificationSettingsController::class, 'update'])->middleware('permission:manage_shop_settings');
            Route::post('/notifications/test-whatsapp', [NotificationSettingsController::class, 'testWhatsApp'])->middleware('permission:manage_shop_settings');
        });

        // Inventory routes
        Route::prefix('inventory')->group(function () {
            // Categories
            Route::get('/categories', [CategoryController::class, 'index'])->middleware('permission:view_products');
            Route::get('/categories/tree', [CategoryController::class, 'tree'])->middleware('permission:view_products');
            Route::post('/categories', [CategoryController::class, 'store'])->middleware('permission:create_products');
            Route::get('/categories/{id}', [CategoryController::class, 'show'])->middleware('permission:view_products');
            Route::put('/categories/{id}', [CategoryController::class, 'update'])->middleware('permission:edit_products');
            Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->middleware('permission:delete_products');

            // Brands
            Route::get('/brands', [BrandController::class, 'index'])->middleware('permission:view_products');
            Route::get('/brands/all', [BrandController::class, 'all'])->middleware('permission:view_products');
            Route::post('/brands', [BrandController::class, 'store'])->middleware('permission:create_products');
            Route::get('/brands/{id}', [BrandController::class, 'show'])->middleware('permission:view_products');
            Route::put('/brands/{id}', [BrandController::class, 'update'])->middleware('permission:edit_products');
            Route::delete('/brands/{id}', [BrandController::class, 'destroy'])->middleware('permission:delete_products');
            Route::post('/brands/{id}/toggle', [BrandController::class, 'toggleActive'])->middleware('permission:edit_products');

            // Products
            Route::get('/products', [ProductController::class, 'index'])->middleware('permission:view_products');
            Route::get('/products/search', [ProductController::class, 'search'])->middleware('permission:view_products');
            Route::post('/products', [ProductController::class, 'store'])->middleware('permission:create_products');
            Route::get('/products/barcode/{barcode}', [ProductController::class, 'getByBarcode'])->middleware('permission:view_products');
            Route::get('/products/{id}', [ProductController::class, 'show'])->middleware('permission:view_products');
            Route::put('/products/{id}', [ProductController::class, 'update'])->middleware('permission:edit_products');
            Route::delete('/products/{id}', [ProductController::class, 'destroy'])->middleware('permission:delete_products');
            Route::post('/products/{id}/images', [ProductController::class, 'uploadImages'])->middleware('permission:edit_products');
            Route::delete('/products/{id}/images', [ProductController::class, 'deleteImage'])->middleware('permission:edit_products');
            Route::post('/products/{id}/toggle', [ProductController::class, 'toggleActive'])->middleware('permission:edit_products');

            // Inventory Items (serialized products - IMEI)
            Route::get('/inventory-items', [InventoryItemController::class, 'index'])->middleware('permission:view_products');
            Route::post('/inventory-items', [InventoryItemController::class, 'store'])->middleware('permission:manage_stock');
            Route::post('/inventory-items/bulk', [InventoryItemController::class, 'storeBulk'])->middleware('permission:manage_stock');
            Route::get('/inventory-items/serial/{serial}', [InventoryItemController::class, 'getBySerial'])->middleware('permission:view_products');
            Route::get('/inventory-items/available/{productId}', [InventoryItemController::class, 'getAvailable'])->middleware('permission:view_products');
            Route::get('/inventory-items/{id}', [InventoryItemController::class, 'show'])->middleware('permission:view_products');
            Route::put('/inventory-items/{id}', [InventoryItemController::class, 'update'])->middleware('permission:manage_stock');
            Route::delete('/inventory-items/{id}', [InventoryItemController::class, 'destroy'])->middleware('permission:manage_stock');
        });

        // Stock routes
        Route::prefix('stock')->group(function () {
            Route::get('/levels', [StockController::class, 'levels'])->middleware('permission:view_products');
            Route::get('/low-stock', [StockController::class, 'lowStock'])->middleware('permission:view_products');
            Route::get('/out-of-stock', [StockController::class, 'outOfStock'])->middleware('permission:view_products');
            Route::get('/movements', [StockController::class, 'movements'])->middleware('permission:manage_stock');
            Route::get('/movement-types', [StockController::class, 'movementTypes'])->middleware('permission:view_products');
            Route::post('/adjustment', [StockController::class, 'adjustment'])->middleware('permission:manage_stock');
            Route::post('/add', [StockController::class, 'addStock'])->middleware('permission:manage_stock');
            Route::post('/remove', [StockController::class, 'removeStock'])->middleware('permission:manage_stock');
            Route::get('/valuation', [StockController::class, 'valuation'])->middleware('permission:view_financial_reports');
        });

        // Customers
        Route::prefix('customers')->group(function () {
            Route::get('/', [CustomerController::class, 'index'])->middleware('permission:view_customers');
            Route::get('/search', [CustomerController::class, 'search'])->middleware('permission:view_customers');
            Route::get('/with-dues', [CustomerController::class, 'withDues'])->middleware('permission:view_customers');
            Route::post('/', [CustomerController::class, 'store'])->middleware('permission:manage_customers');
            Route::get('/{id}', [CustomerController::class, 'show'])->middleware('permission:view_customers');
            Route::put('/{id}', [CustomerController::class, 'update'])->middleware('permission:manage_customers');
            Route::delete('/{id}', [CustomerController::class, 'destroy'])->middleware('permission:manage_customers');
            Route::get('/{id}/purchases', [CustomerController::class, 'purchases'])->middleware('permission:view_customers');
            Route::get('/{id}/repairs', [CustomerController::class, 'repairs'])->middleware('permission:view_customers');
            Route::get('/{id}/dues', [CustomerController::class, 'dues'])->middleware('permission:view_customers');
        });

        // Sales
        Route::prefix('sales')->group(function () {
            Route::get('/', [SaleController::class, 'index'])->middleware('permission:view_sales');
            Route::get('/today', [SaleController::class, 'todaySummary'])->middleware('permission:view_sales');
            Route::post('/', [SaleController::class, 'store'])->middleware('permission:create_sales');
            Route::get('/{id}', [SaleController::class, 'show'])->middleware('permission:view_sales');
            Route::post('/{id}/void', [SaleController::class, 'void'])->middleware('permission:void_sales');
            Route::post('/{id}/payment', [SaleController::class, 'addPayment'])->middleware('permission:create_sales');
            Route::get('/{id}/invoice', [SaleController::class, 'invoice'])->middleware('permission:view_sales');
        });

        // POS
        Route::prefix('pos')->middleware('permission:use_pos')->group(function () {
            Route::get('/products', [PosController::class, 'searchProducts']);
            Route::get('/products/barcode/{barcode}', [PosController::class, 'getByBarcode']);
            Route::get('/products/{productId}/items', [PosController::class, 'getInventoryItems']);
            Route::get('/quick-products', [PosController::class, 'quickProducts']);
            Route::post('/sale', [PosController::class, 'sale']);
            Route::post('/hold', [PosController::class, 'hold']);
            Route::get('/held', [PosController::class, 'getHeld']);
            Route::get('/held/{id}', [PosController::class, 'resumeHeld']);
            Route::delete('/held/{id}', [PosController::class, 'deleteHeld']);
        });

        // Payments
        Route::prefix('payments')->group(function () {
            Route::get('/', [PaymentController::class, 'index'])->middleware('permission:view_sales');
            Route::get('/today', [PaymentController::class, 'today'])->middleware('permission:view_sales');
            Route::get('/summary', [PaymentController::class, 'summary'])->middleware('permission:view_financial_reports');
            Route::get('/{id}', [PaymentController::class, 'show'])->middleware('permission:view_sales');
        });

        // Installments
        Route::prefix('installments')->group(function () {
            Route::get('/', [InstallmentController::class, 'index'])->middleware('permission:manage_installments');
            Route::get('/overdue', [InstallmentController::class, 'overdue'])->middleware('permission:manage_installments');
            Route::get('/upcoming', [InstallmentController::class, 'upcoming'])->middleware('permission:manage_installments');
            Route::post('/', [InstallmentController::class, 'store'])->middleware('permission:manage_installments');
            Route::get('/{id}', [InstallmentController::class, 'show'])->middleware('permission:manage_installments');
            Route::post('/{id}/payment', [InstallmentController::class, 'recordPayment'])->middleware('permission:manage_installments');
        });

        // Suppliers
        Route::prefix('suppliers')->group(function () {
            Route::get('/', [SupplierController::class, 'index'])->middleware('permission:view_suppliers');
            Route::get('/all', [SupplierController::class, 'all'])->middleware('permission:view_suppliers');
            Route::get('/with-dues', [SupplierController::class, 'withDues'])->middleware('permission:view_suppliers');
            Route::post('/', [SupplierController::class, 'store'])->middleware('permission:manage_suppliers');
            Route::get('/{id}', [SupplierController::class, 'show'])->middleware('permission:view_suppliers');
            Route::put('/{id}', [SupplierController::class, 'update'])->middleware('permission:manage_suppliers');
            Route::delete('/{id}', [SupplierController::class, 'destroy'])->middleware('permission:manage_suppliers');
            Route::get('/{id}/purchases', [SupplierController::class, 'purchases'])->middleware('permission:view_suppliers');
            Route::get('/{id}/payments', [SupplierController::class, 'payments'])->middleware('permission:view_suppliers');
            Route::get('/{id}/dues', [SupplierController::class, 'dues'])->middleware('permission:view_suppliers');
            Route::post('/{id}/toggle', [SupplierController::class, 'toggleActive'])->middleware('permission:manage_suppliers');
        });

        // Supplier Payments
        Route::prefix('supplier-payments')->group(function () {
            Route::get('/', [SupplierPaymentController::class, 'index'])->middleware('permission:view_suppliers');
            Route::post('/{supplierId}', [SupplierPaymentController::class, 'store'])->middleware('permission:manage_suppliers');
            Route::get('/summary', [SupplierPaymentController::class, 'summary'])->middleware('permission:view_financial_reports');
            Route::get('/{id}', [SupplierPaymentController::class, 'show'])->middleware('permission:view_suppliers');
        });

        // Purchase Orders
        Route::prefix('purchase-orders')->group(function () {
            Route::get('/', [PurchaseOrderController::class, 'index'])->middleware('permission:view_suppliers');
            Route::get('/pending', [PurchaseOrderController::class, 'pending'])->middleware('permission:view_suppliers');
            Route::post('/', [PurchaseOrderController::class, 'store'])->middleware('permission:create_purchase_orders');
            Route::get('/{id}', [PurchaseOrderController::class, 'show'])->middleware('permission:view_suppliers');
            Route::put('/{id}', [PurchaseOrderController::class, 'update'])->middleware('permission:create_purchase_orders');
            Route::post('/{id}/receive', [PurchaseOrderController::class, 'receive'])->middleware('permission:create_purchase_orders');
            Route::post('/{id}/payment', [PurchaseOrderController::class, 'addPayment'])->middleware('permission:manage_suppliers');
            Route::post('/{id}/cancel', [PurchaseOrderController::class, 'cancel'])->middleware('permission:create_purchase_orders');
        });

        // Repairs
        Route::prefix('repairs')->group(function () {
            Route::get('/', [RepairController::class, 'index'])->middleware('permission:view_repairs');
            Route::get('/status-options', [RepairController::class, 'statusOptions'])->middleware('permission:view_repairs');
            Route::get('/technicians', [RepairController::class, 'technicians'])->middleware('permission:view_repairs');
            Route::get('/statistics', [RepairController::class, 'statistics'])->middleware('permission:view_repairs');
            Route::get('/overdue', [RepairController::class, 'overdue'])->middleware('permission:view_repairs');
            Route::get('/status/{status}', [RepairController::class, 'byStatus'])->middleware('permission:view_repairs');
            Route::post('/', [RepairController::class, 'store'])->middleware('permission:create_repairs');
            Route::get('/{id}', [RepairController::class, 'show'])->middleware('permission:view_repairs');
            Route::put('/{id}', [RepairController::class, 'update'])->middleware('permission:edit_repairs');
            Route::put('/{id}/status', [RepairController::class, 'updateStatus'])->middleware('permission:update_repair_status');
            Route::post('/{id}/items', [RepairController::class, 'addItem'])->middleware('permission:edit_repairs');
            Route::delete('/{id}/items/{itemId}', [RepairController::class, 'removeItem'])->middleware('permission:edit_repairs');
            Route::post('/{id}/payment', [RepairController::class, 'addPayment'])->middleware('permission:edit_repairs');
            Route::get('/{id}/job-card', [RepairController::class, 'jobCard'])->middleware('permission:view_repairs');
        });

        // Expenses
        Route::prefix('expenses')->group(function () {
            Route::get('/', [ExpenseController::class, 'index'])->middleware('permission:view_expenses');
            Route::get('/summary', [ExpenseController::class, 'summary'])->middleware('permission:view_expenses');
            Route::post('/', [ExpenseController::class, 'store'])->middleware('permission:manage_expenses');
            Route::get('/{id}', [ExpenseController::class, 'show'])->middleware('permission:view_expenses');
            Route::put('/{id}', [ExpenseController::class, 'update'])->middleware('permission:manage_expenses');
            Route::delete('/{id}', [ExpenseController::class, 'destroy'])->middleware('permission:manage_expenses');
            Route::post('/{id}/receipt', [ExpenseController::class, 'uploadReceipt'])->middleware('permission:manage_expenses');
            Route::delete('/{id}/receipt', [ExpenseController::class, 'deleteReceipt'])->middleware('permission:manage_expenses');
        });

        // Dashboard
        Route::prefix('dashboard')->group(function () {
            Route::get('/stats', [DashboardController::class, 'stats'])->middleware('permission:view_dashboard');
            Route::get('/sales-chart', [DashboardController::class, 'salesChart'])->middleware('permission:view_dashboard');
            Route::get('/recent-sales', [DashboardController::class, 'recentSales'])->middleware('permission:view_dashboard');
            Route::get('/recent-repairs', [DashboardController::class, 'recentRepairs'])->middleware('permission:view_dashboard');
            Route::get('/low-stock', [DashboardController::class, 'lowStock'])->middleware('permission:view_dashboard');
            Route::get('/overdue', [DashboardController::class, 'overdue'])->middleware('permission:view_dashboard');
            Route::get('/payment-methods', [DashboardController::class, 'paymentMethods'])->middleware('permission:view_dashboard');
            Route::get('/top-products', [DashboardController::class, 'topProducts'])->middleware('permission:view_dashboard');
            Route::get('/activity-feed', [DashboardController::class, 'activityFeed'])->middleware('permission:view_dashboard');
        });

        // Reports
        Route::prefix('reports')->group(function () {
            // Sales Reports
            Route::get('/sales', [SalesReportController::class, 'index'])->middleware('permission:view_reports');
            Route::get('/sales/export-pdf', [SalesReportController::class, 'exportPdf'])->middleware('permission:view_reports');
            Route::get('/sales/by-product', [SalesReportController::class, 'byProduct'])->middleware('permission:view_reports');
            Route::get('/sales/by-product/export-pdf', [SalesReportController::class, 'exportProductsPdf'])->middleware('permission:view_reports');
            Route::get('/sales/by-category', [SalesReportController::class, 'byCategory'])->middleware('permission:view_reports');
            Route::get('/sales/by-staff', [SalesReportController::class, 'byStaff'])->middleware('permission:view_reports');
            Route::get('/sales/by-staff/export-pdf', [SalesReportController::class, 'exportStaffPdf'])->middleware('permission:view_reports');
            Route::get('/sales/by-customer', [SalesReportController::class, 'byCustomer'])->middleware('permission:view_reports');
            Route::get('/sales/hourly', [SalesReportController::class, 'hourlyDistribution'])->middleware('permission:view_reports');

            // Inventory Reports
            Route::get('/inventory', [InventoryReportController::class, 'index'])->middleware('permission:view_reports');
            Route::get('/inventory/export-pdf', [InventoryReportController::class, 'exportPdf'])->middleware('permission:view_reports');
            Route::get('/inventory/valuation', [InventoryReportController::class, 'valuation'])->middleware('permission:view_financial_reports');
            Route::get('/inventory/valuation/export-pdf', [InventoryReportController::class, 'exportValuationPdf'])->middleware('permission:view_financial_reports');
            Route::get('/inventory/movements', [InventoryReportController::class, 'movements'])->middleware('permission:view_reports');
            Route::get('/inventory/low-stock', [InventoryReportController::class, 'lowStock'])->middleware('permission:view_reports');
            Route::get('/inventory/low-stock/export-pdf', [InventoryReportController::class, 'exportLowStockPdf'])->middleware('permission:view_reports');
            Route::get('/inventory/aging', [InventoryReportController::class, 'aging'])->middleware('permission:view_reports');

            // Repair Reports
            Route::get('/repairs', [RepairReportController::class, 'index'])->middleware('permission:view_reports');
            Route::get('/repairs/export-pdf', [RepairReportController::class, 'exportPdf'])->middleware('permission:view_reports');
            Route::get('/repairs/by-technician', [RepairReportController::class, 'byTechnician'])->middleware('permission:view_reports');
            Route::get('/repairs/by-technician/export-pdf', [RepairReportController::class, 'exportTechnicianPdf'])->middleware('permission:view_reports');
            Route::get('/repairs/turnaround', [RepairReportController::class, 'turnaround'])->middleware('permission:view_reports');
            Route::get('/repairs/turnaround/export-pdf', [RepairReportController::class, 'exportTurnaroundPdf'])->middleware('permission:view_reports');
            Route::get('/repairs/common-issues', [RepairReportController::class, 'commonIssues'])->middleware('permission:view_reports');

            // Financial Reports
            Route::get('/profit-loss', [FinancialReportController::class, 'profitLoss'])->middleware('permission:view_financial_reports');
            Route::get('/profit-loss/export-pdf', [FinancialReportController::class, 'exportProfitLossPdf'])->middleware('permission:view_financial_reports');
            Route::get('/cash-flow', [FinancialReportController::class, 'cashFlow'])->middleware('permission:view_financial_reports');
            Route::get('/cash-flow/export-pdf', [FinancialReportController::class, 'exportCashFlowPdf'])->middleware('permission:view_financial_reports');
            Route::get('/dues/customers', [FinancialReportController::class, 'customerDues'])->middleware('permission:view_financial_reports');
            Route::get('/dues/customers/export-pdf', [FinancialReportController::class, 'exportCustomerDuesPdf'])->middleware('permission:view_financial_reports');
            Route::get('/dues/suppliers', [FinancialReportController::class, 'supplierDues'])->middleware('permission:view_financial_reports');
            Route::get('/dues/suppliers/export-pdf', [FinancialReportController::class, 'exportSupplierDuesPdf'])->middleware('permission:view_financial_reports');
            Route::get('/collections', [FinancialReportController::class, 'collections'])->middleware('permission:view_financial_reports');
        });
    });

    // Public repair tracking (no auth required)
    Route::get('/repairs/track/{job_number}', [RepairController::class, 'track']);
});
