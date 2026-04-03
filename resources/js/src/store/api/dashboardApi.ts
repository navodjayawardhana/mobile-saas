import { baseApi } from './baseApi';

export interface DashboardStats {
    today: {
        sales_amount: number;
        sales_count: number;
    };
    month: {
        sales_amount: number;
        expenses_amount: number;
        profit: number;
    };
    repairs: {
        active: number;
        overdue: number;
    };
    inventory: {
        low_stock: number;
    };
    dues: {
        customer_dues: number;
        supplier_dues: number;
    };
    installments: {
        overdue: number;
    };
    purchase_orders: {
        pending: number;
    };
}

export interface SalesChartData {
    date: string;
    sales: number;
    sales_count: number;
    expenses: number;
    profit: number;
}

export interface RecentSale {
    id: string;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
    payment_status: string;
    sale_date: string;
    user_name: string;
}

export interface RecentRepair {
    id: string;
    job_number: string;
    customer_name: string;
    device: string;
    status: string;
    priority: string;
    technician_name: string;
    received_at: string;
}

export interface LowStockItem {
    id: string;
    name: string;
    sku: string;
    category: string;
    brand: string;
    current_stock: number;
    min_stock_alert: number;
}

export interface OverdueItem {
    type: string;
    id: string;
    reference: string;
    customer_name: string;
    customer_phone: string;
    amount?: number;
    due_date: string;
    days_overdue: number;
}

export interface PaymentMethodBreakdown {
    method: string;
    total: number;
    count: number;
}

export interface TopProduct {
    id: string;
    name: string;
    sku: string;
    total_qty: number;
    total_revenue: number;
}

export interface ActivityItem {
    type: string;
    message: string;
    amount?: number;
    user: string;
    time: string;
}

export const dashboardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get dashboard stats
        getDashboardStats: builder.query<DashboardStats, void>({
            query: () => '/dashboard/stats',
            providesTags: ['Dashboard'],
        }),

        // Get sales chart data
        getSalesChart: builder.query<SalesChartData[], { period?: '7days' | '30days' | '12months' }>({
            query: (params) => ({
                url: '/dashboard/sales-chart',
                params,
            }),
            providesTags: ['Dashboard'],
        }),

        // Get recent sales
        getRecentSales: builder.query<RecentSale[], void>({
            query: () => '/dashboard/recent-sales',
            providesTags: ['Dashboard', 'Sale'],
        }),

        // Get recent repairs
        getRecentRepairs: builder.query<RecentRepair[], void>({
            query: () => '/dashboard/recent-repairs',
            providesTags: ['Dashboard', 'Repair'],
        }),

        // Get low stock items
        getDashboardLowStock: builder.query<LowStockItem[], void>({
            query: () => '/dashboard/low-stock',
            providesTags: ['Dashboard', 'Product'],
        }),

        // Get overdue items
        getOverdueItems: builder.query<{ repairs: OverdueItem[]; installments: OverdueItem[] }, void>({
            query: () => '/dashboard/overdue',
            providesTags: ['Dashboard'],
        }),

        // Get payment methods breakdown
        getPaymentMethodsBreakdown: builder.query<PaymentMethodBreakdown[], void>({
            query: () => '/dashboard/payment-methods',
            providesTags: ['Dashboard'],
        }),

        // Get top products
        getTopProducts: builder.query<TopProduct[], { days?: number }>({
            query: (params) => ({
                url: '/dashboard/top-products',
                params,
            }),
            providesTags: ['Dashboard'],
        }),

        // Get activity feed
        getActivityFeed: builder.query<ActivityItem[], void>({
            query: () => '/dashboard/activity-feed',
            providesTags: ['Dashboard'],
        }),
    }),
});

export const {
    useGetDashboardStatsQuery,
    useGetSalesChartQuery,
    useGetRecentSalesQuery,
    useGetRecentRepairsQuery,
    useGetDashboardLowStockQuery,
    useGetOverdueItemsQuery,
    useGetPaymentMethodsBreakdownQuery,
    useGetTopProductsQuery,
    useGetActivityFeedQuery,
} = dashboardApi;
