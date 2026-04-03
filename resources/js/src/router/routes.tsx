import { lazy } from 'react';
import ProtectedRoute from './ProtectedRoute';

// Lazy load pages
const Index = lazy(() => import('../pages/Index'));
const Login = lazy(() => import('../pages/Auth/Login'));
const Register = lazy(() => import('../pages/Auth/Register'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/Auth/ResetPassword'));

// Settings Pages
const ShopSettings = lazy(() => import('../pages/Settings/Shop'));
const Currencies = lazy(() => import('../pages/Settings/Currencies'));
const PaymentMethods = lazy(() => import('../pages/Settings/PaymentMethods'));
const ExpenseCategories = lazy(() => import('../pages/Settings/ExpenseCategories'));
const RolesIndex = lazy(() => import('../pages/Settings/Roles/Index'));
const RolesCreate = lazy(() => import('../pages/Settings/Roles/Create'));
const RolesEdit = lazy(() => import('../pages/Settings/Roles/Edit'));
const UsersIndex = lazy(() => import('../pages/Settings/Users/Index'));
const UsersCreate = lazy(() => import('../pages/Settings/Users/Create'));
const NotificationSettings = lazy(() => import('../pages/Settings/Notifications'));

// Inventory Pages
const CategoriesIndex = lazy(() => import('../pages/Inventory/Categories/Index'));
const BrandsIndex = lazy(() => import('../pages/Inventory/Brands/Index'));
const ProductsIndex = lazy(() => import('../pages/Inventory/Products/Index'));
const ProductsCreate = lazy(() => import('../pages/Inventory/Products/Create'));
const ProductsEdit = lazy(() => import('../pages/Inventory/Products/Edit'));
const ProductsView = lazy(() => import('../pages/Inventory/Products/View'));
const StockIndex = lazy(() => import('../pages/Inventory/Stock/Index'));
const LowStock = lazy(() => import('../pages/Inventory/Stock/LowStock'));

// Customer Pages
const CustomersIndex = lazy(() => import('../pages/Customers/Index'));
const CustomerView = lazy(() => import('../pages/Customers/View'));

// Sales Pages
const SalesIndex = lazy(() => import('../pages/Sales/Sales/Index'));
const SalesView = lazy(() => import('../pages/Sales/Sales/View'));
const PosIndex = lazy(() => import('../pages/Sales/POS/Index'));

// Supplier Pages
const SuppliersIndex = lazy(() => import('../pages/Suppliers/Index'));
const SupplierView = lazy(() => import('../pages/Suppliers/View'));
const SupplierDues = lazy(() => import('../pages/Suppliers/Dues'));

// Purchase Order Pages
const PurchaseOrdersIndex = lazy(() => import('../pages/PurchaseOrders/Index'));
const PurchaseOrderCreate = lazy(() => import('../pages/PurchaseOrders/Create'));
const PurchaseOrderView = lazy(() => import('../pages/PurchaseOrders/View'));
const PurchaseOrderPending = lazy(() => import('../pages/PurchaseOrders/Pending'));

// Repair Pages
const RepairsIndex = lazy(() => import('../pages/Repairs/Index'));
const RepairCreate = lazy(() => import('../pages/Repairs/Create'));
const RepairView = lazy(() => import('../pages/Repairs/View'));
const RepairOverdue = lazy(() => import('../pages/Repairs/Overdue'));

// Expense Pages
const ExpensesIndex = lazy(() => import('../pages/Expenses/Index'));
const ExpenseSummary = lazy(() => import('../pages/Expenses/Summary'));

// Dashboard Pages
const Dashboard = lazy(() => import('../pages/Dashboard/Index'));

// Report Pages
const ReportsIndex = lazy(() => import('../pages/Reports/Index'));
const SalesReport = lazy(() => import('../pages/Reports/Sales'));
const SalesByProduct = lazy(() => import('../pages/Reports/SalesByProduct'));
const SalesByStaff = lazy(() => import('../pages/Reports/SalesByStaff'));
const ProfitLossReport = lazy(() => import('../pages/Reports/ProfitLoss'));
const InventoryReport = lazy(() => import('../pages/Reports/Inventory'));
const InventoryValuation = lazy(() => import('../pages/Reports/InventoryValuation'));
const InventoryLowStock = lazy(() => import('../pages/Reports/InventoryLowStock'));
const RepairsReport = lazy(() => import('../pages/Reports/Repairs'));
const RepairsTechnicians = lazy(() => import('../pages/Reports/RepairsTechnicians'));
const RepairsTurnaround = lazy(() => import('../pages/Reports/RepairsTurnaround'));
const CashFlowReport = lazy(() => import('../pages/Reports/CashFlow'));
const CustomerDuesReport = lazy(() => import('../pages/Reports/CustomerDues'));
const SupplierDuesReport = lazy(() => import('../pages/Reports/SupplierDues'));

// Public Pages
const TrackRepair = lazy(() => import('../pages/Public/TrackRepair'));

const routes = [
    // Public routes
    {
        path: '/login',
        element: <Login />,
        layout: 'blank',
    },
    {
        path: '/register',
        element: <Register />,
        layout: 'blank',
    },
    {
        path: '/forgot-password',
        element: <ForgotPassword />,
        layout: 'blank',
    },
    {
        path: '/reset-password',
        element: <ResetPassword />,
        layout: 'blank',
    },

    // Protected routes - Dashboard
    {
        path: '/',
        element: (
            <ProtectedRoute permissions={['view_dashboard']}>
                <Dashboard />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Settings - Shop Profile
    {
        path: '/settings/shop',
        element: (
            <ProtectedRoute permissions={['manage_shop_settings']}>
                <ShopSettings />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Settings - Currencies
    {
        path: '/settings/currencies',
        element: (
            <ProtectedRoute permissions={['manage_currencies']}>
                <Currencies />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Settings - Payment Methods
    {
        path: '/settings/payment-methods',
        element: (
            <ProtectedRoute permissions={['manage_payment_methods']}>
                <PaymentMethods />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Settings - Expense Categories
    {
        path: '/settings/expense-categories',
        element: (
            <ProtectedRoute permissions={['manage_expenses']}>
                <ExpenseCategories />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Settings - Roles
    {
        path: '/settings/roles',
        element: (
            <ProtectedRoute permissions={['manage_roles']}>
                <RolesIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/settings/roles/create',
        element: (
            <ProtectedRoute permissions={['manage_roles']}>
                <RolesCreate />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/settings/roles/:id/edit',
        element: (
            <ProtectedRoute permissions={['manage_roles']}>
                <RolesEdit />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Settings - Users
    {
        path: '/settings/users',
        element: (
            <ProtectedRoute permissions={['manage_users']}>
                <UsersIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/settings/users/create',
        element: (
            <ProtectedRoute permissions={['manage_users']}>
                <UsersCreate />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Settings - Notifications
    {
        path: '/settings/notifications',
        element: (
            <ProtectedRoute permissions={['manage_shop_settings']}>
                <NotificationSettings />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Inventory - Categories
    {
        path: '/inventory/categories',
        element: (
            <ProtectedRoute permissions={['view_products']}>
                <CategoriesIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Inventory - Brands
    {
        path: '/inventory/brands',
        element: (
            <ProtectedRoute permissions={['view_products']}>
                <BrandsIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Inventory - Products
    {
        path: '/inventory/products',
        element: (
            <ProtectedRoute permissions={['view_products']}>
                <ProductsIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/inventory/products/create',
        element: (
            <ProtectedRoute permissions={['create_products']}>
                <ProductsCreate />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/inventory/products/:id',
        element: (
            <ProtectedRoute permissions={['view_products']}>
                <ProductsView />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/inventory/products/:id/edit',
        element: (
            <ProtectedRoute permissions={['edit_products']}>
                <ProductsEdit />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Inventory - Stock
    {
        path: '/inventory/stock',
        element: (
            <ProtectedRoute permissions={['manage_stock']}>
                <StockIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/inventory/stock/low-stock',
        element: (
            <ProtectedRoute permissions={['view_products']}>
                <LowStock />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Customers
    {
        path: '/customers',
        element: (
            <ProtectedRoute permissions={['view_customers']}>
                <CustomersIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/customers/:id',
        element: (
            <ProtectedRoute permissions={['view_customers']}>
                <CustomerView />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Sales
    {
        path: '/sales',
        element: (
            <ProtectedRoute permissions={['view_sales']}>
                <SalesIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // POS - must be before /sales/:id to avoid matching "pos" as an ID
    {
        path: '/sales/pos',
        element: (
            <ProtectedRoute permissions={['use_pos']}>
                <PosIndex />
            </ProtectedRoute>
        ),
        layout: 'pos',
    },

    // Sale Detail
    {
        path: '/sales/:id',
        element: (
            <ProtectedRoute permissions={['view_sales']}>
                <SalesView />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Suppliers
    {
        path: '/suppliers',
        element: (
            <ProtectedRoute permissions={['view_suppliers']}>
                <SuppliersIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/suppliers/dues',
        element: (
            <ProtectedRoute permissions={['view_suppliers']}>
                <SupplierDues />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/suppliers/:id',
        element: (
            <ProtectedRoute permissions={['view_suppliers']}>
                <SupplierView />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Purchase Orders
    {
        path: '/purchase-orders',
        element: (
            <ProtectedRoute permissions={['view_suppliers']}>
                <PurchaseOrdersIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/purchase-orders/create',
        element: (
            <ProtectedRoute permissions={['create_purchase_orders']}>
                <PurchaseOrderCreate />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/purchase-orders/pending',
        element: (
            <ProtectedRoute permissions={['view_suppliers']}>
                <PurchaseOrderPending />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/purchase-orders/:id',
        element: (
            <ProtectedRoute permissions={['view_suppliers']}>
                <PurchaseOrderView />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Repairs
    {
        path: '/repairs',
        element: (
            <ProtectedRoute permissions={['view_repairs']}>
                <RepairsIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/repairs/create',
        element: (
            <ProtectedRoute permissions={['create_repairs']}>
                <RepairCreate />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/repairs/overdue',
        element: (
            <ProtectedRoute permissions={['view_repairs']}>
                <RepairOverdue />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/repairs/:id',
        element: (
            <ProtectedRoute permissions={['view_repairs']}>
                <RepairView />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Expenses
    {
        path: '/expenses',
        element: (
            <ProtectedRoute permissions={['view_expenses']}>
                <ExpensesIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/expenses/summary',
        element: (
            <ProtectedRoute permissions={['view_expenses']}>
                <ExpenseSummary />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Reports
    {
        path: '/reports',
        element: (
            <ProtectedRoute permissions={['view_reports']}>
                <ReportsIndex />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/sales',
        element: (
            <ProtectedRoute permissions={['view_reports']}>
                <SalesReport />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/sales/products',
        element: (
            <ProtectedRoute permissions={['view_reports']}>
                <SalesByProduct />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/sales/staff',
        element: (
            <ProtectedRoute permissions={['view_reports']}>
                <SalesByStaff />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/profit-loss',
        element: (
            <ProtectedRoute permissions={['view_financial_reports']}>
                <ProfitLossReport />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/inventory',
        element: (
            <ProtectedRoute permissions={['view_reports']}>
                <InventoryReport />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/inventory/valuation',
        element: (
            <ProtectedRoute permissions={['view_financial_reports']}>
                <InventoryValuation />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/inventory/low-stock',
        element: (
            <ProtectedRoute permissions={['view_reports']}>
                <InventoryLowStock />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/repairs',
        element: (
            <ProtectedRoute permissions={['view_reports']}>
                <RepairsReport />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/repairs/technicians',
        element: (
            <ProtectedRoute permissions={['view_reports']}>
                <RepairsTechnicians />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/repairs/turnaround',
        element: (
            <ProtectedRoute permissions={['view_reports']}>
                <RepairsTurnaround />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/cash-flow',
        element: (
            <ProtectedRoute permissions={['view_financial_reports']}>
                <CashFlowReport />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/dues/customers',
        element: (
            <ProtectedRoute permissions={['view_financial_reports']}>
                <CustomerDuesReport />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/reports/dues/suppliers',
        element: (
            <ProtectedRoute permissions={['view_financial_reports']}>
                <SupplierDuesReport />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // Public Routes
    {
        path: '/track-repair',
        element: <TrackRepair />,
        layout: 'blank',
    },
];

export { routes };
