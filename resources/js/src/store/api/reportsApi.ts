import { baseApi } from './baseApi';

export interface DateRangeParams {
    date_from?: string;
    date_to?: string;
}

// Sales Report Types
export interface SalesReportSummary {
    total_sales: number;
    total_cost: number;
    total_discounts: number;
    total_tax: number;
    total_transactions: number;
    paid_amount: number;
    due_amount: number;
    average_sale: number;
}

export interface SalesReport {
    date_from: string;
    date_to: string;
    summary: SalesReportSummary;
    daily_breakdown: { date: string; total: number; count: number }[];
    payment_breakdown: { payment_status: string; count: number; total: number }[];
    type_breakdown: { sale_type: string; count: number; total: number }[];
}

export interface ProductSalesItem {
    id: string;
    name: string;
    sku: string;
    category_name: string;
    brand_name: string;
    total_qty: number;
    total_revenue: number;
    avg_price: number;
}

export interface CategorySalesReport {
    date_from: string;
    date_to: string;
    total_revenue: number;
    categories: {
        id: string;
        name: string;
        total_qty: number;
        total_revenue: number;
        transaction_count: number;
        percentage: number;
    }[];
}

export interface StaffSalesReport {
    date_from: string;
    date_to: string;
    staff: {
        id: string;
        name: string;
        transaction_count: number;
        total_sales: number;
        total_collected: number;
        avg_sale: number;
    }[];
}

// Inventory Report Types
export interface InventoryReport {
    summary: {
        total_products: number;
        active_products: number;
        low_stock: number;
        out_of_stock: number;
        total_stock_value: number;
        total_retail_value: number;
        potential_profit: number;
    };
    by_category: {
        id: string;
        name: string;
        product_count: number;
        total_stock: number;
        stock_value: number;
    }[];
    by_brand: {
        id: string;
        name: string;
        product_count: number;
        total_stock: number;
        stock_value: number;
    }[];
}

export interface ValuationItem {
    id: string;
    name: string;
    sku: string;
    category: string;
    brand: string;
    current_stock: number;
    cost_price: number;
    selling_price: number;
    stock_value: number;
    retail_value: number;
    potential_profit: number;
}

// Repair Report Types
export interface RepairReport {
    date_from: string;
    date_to: string;
    summary: {
        total_repairs: number;
        completed_repairs: number;
        completion_rate: number;
        total_revenue: number;
        total_paid: number;
        total_due: number;
        avg_completion_days: number;
    };
    by_status: { status: string; count: number }[];
    by_priority: { priority: string; count: number }[];
    by_device_type: { device_type: string; count: number; revenue: number }[];
}

export interface TechnicianReport {
    date_from: string;
    date_to: string;
    technicians: {
        id: string;
        name: string;
        total_repairs: number;
        completed: number;
        total_revenue: number;
        avg_days: number;
    }[];
}

// Financial Report Types
export interface ProfitLossReport {
    date_from: string;
    date_to: string;
    revenue: {
        sales: number;
        repairs: number;
        total: number;
    };
    cost_of_goods_sold: number;
    gross_profit: number;
    gross_margin: number;
    expenses: {
        total: number;
        by_category: { name: string; total: number }[];
    };
    net_profit: number;
    net_margin: number;
    monthly_breakdown: {
        month: string;
        label: string;
        revenue: number;
        expenses: number;
        profit: number;
    }[];
}

export interface CashFlowReport {
    date_from: string;
    date_to: string;
    inflows: {
        total: number;
        by_method: { name: string; total: number; count: number }[];
    };
    outflows: {
        expenses: number;
        supplier_payments: number;
        total: number;
    };
    net_cash_flow: number;
    daily_flow: {
        date: string;
        inflow: number;
        outflow: number;
        net: number;
    }[];
}

export interface DuesReport {
    summary: {
        total_due: number;
        customers_with_due?: number;
        suppliers_with_due?: number;
    };
    customers?: any;
    suppliers?: any;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const reportsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Sales Reports
        getSalesReport: builder.query<SalesReport, DateRangeParams>({
            query: (params) => ({
                url: '/reports/sales',
                params,
            }),
            providesTags: ['Report'],
        }),

        getSalesByProduct: builder.query<PaginatedResponse<ProductSalesItem>, DateRangeParams & { category_id?: string; brand_id?: string; page?: number; per_page?: number }>({
            query: (params) => ({
                url: '/reports/sales/by-product',
                params,
            }),
            providesTags: ['Report'],
        }),

        getSalesByCategory: builder.query<CategorySalesReport, DateRangeParams>({
            query: (params) => ({
                url: '/reports/sales/by-category',
                params,
            }),
            providesTags: ['Report'],
        }),

        getSalesByStaff: builder.query<StaffSalesReport, DateRangeParams>({
            query: (params) => ({
                url: '/reports/sales/by-staff',
                params,
            }),
            providesTags: ['Report'],
        }),

        getSalesByCustomer: builder.query<PaginatedResponse<any>, DateRangeParams & { page?: number; per_page?: number }>({
            query: (params) => ({
                url: '/reports/sales/by-customer',
                params,
            }),
            providesTags: ['Report'],
        }),

        getHourlySales: builder.query<{ hour: number; label: string; count: number; total: number }[], DateRangeParams>({
            query: (params) => ({
                url: '/reports/sales/hourly',
                params,
            }),
            providesTags: ['Report'],
        }),

        // Inventory Reports
        getInventoryReport: builder.query<InventoryReport, { category_id?: string; brand_id?: string }>({
            query: (params) => ({
                url: '/reports/inventory',
                params,
            }),
            providesTags: ['Report'],
        }),

        getInventoryValuation: builder.query<{ products: PaginatedResponse<ValuationItem>; totals: { stock_value: number; retail_value: number; potential_profit: number } }, { category_id?: string; brand_id?: string; page?: number; per_page?: number }>({
            query: (params) => ({
                url: '/reports/inventory/valuation',
                params,
            }),
            providesTags: ['Report'],
        }),

        getStockMovements: builder.query<{ movements: PaginatedResponse<any>; summary: any }, DateRangeParams & { product_id?: string; type?: string; page?: number; per_page?: number }>({
            query: (params) => ({
                url: '/reports/inventory/movements',
                params,
            }),
            providesTags: ['Report'],
        }),

        getLowStockReport: builder.query<PaginatedResponse<any>, { page?: number; per_page?: number }>({
            query: (params) => ({
                url: '/reports/inventory/low-stock',
                params,
            }),
            providesTags: ['Report'],
        }),

        getInventoryAging: builder.query<{ aging_summary: any[]; old_inventory: any[] }, void>({
            query: () => '/reports/inventory/aging',
            providesTags: ['Report'],
        }),

        // Repair Reports
        getRepairReport: builder.query<RepairReport, DateRangeParams & { status?: string; technician_id?: string }>({
            query: (params) => ({
                url: '/reports/repairs',
                params,
            }),
            providesTags: ['Report'],
        }),

        getRepairsByTechnician: builder.query<TechnicianReport, DateRangeParams>({
            query: (params) => ({
                url: '/reports/repairs/by-technician',
                params,
            }),
            providesTags: ['Report'],
        }),

        getRepairTurnaround: builder.query<{ distribution: any[]; on_time_analysis: { on_time: number; late: number; on_time_rate: number } }, DateRangeParams>({
            query: (params) => ({
                url: '/reports/repairs/turnaround',
                params,
            }),
            providesTags: ['Report'],
        }),

        getCommonRepairIssues: builder.query<{ common_issues: { keyword: string; count: number; percentage: number }[] }, DateRangeParams & { device_type?: string }>({
            query: (params) => ({
                url: '/reports/repairs/common-issues',
                params,
            }),
            providesTags: ['Report'],
        }),

        // Financial Reports
        getProfitLossReport: builder.query<ProfitLossReport, DateRangeParams>({
            query: (params) => ({
                url: '/reports/profit-loss',
                params,
            }),
            providesTags: ['Report'],
        }),

        getCashFlowReport: builder.query<CashFlowReport, DateRangeParams>({
            query: (params) => ({
                url: '/reports/cash-flow',
                params,
            }),
            providesTags: ['Report'],
        }),

        getCustomerDuesReport: builder.query<DuesReport, { page?: number; per_page?: number }>({
            query: (params) => ({
                url: '/reports/dues/customers',
                params,
            }),
            providesTags: ['Report'],
        }),

        getSupplierDuesReport: builder.query<DuesReport, { page?: number; per_page?: number }>({
            query: (params) => ({
                url: '/reports/dues/suppliers',
                params,
            }),
            providesTags: ['Report'],
        }),

        getCollectionsReport: builder.query<any, DateRangeParams>({
            query: (params) => ({
                url: '/reports/collections',
                params,
            }),
            providesTags: ['Report'],
        }),
    }),
});

export const {
    useGetSalesReportQuery,
    useGetSalesByProductQuery,
    useGetSalesByCategoryQuery,
    useGetSalesByStaffQuery,
    useGetSalesByCustomerQuery,
    useGetHourlySalesQuery,
    useGetInventoryReportQuery,
    useGetInventoryValuationQuery,
    useGetStockMovementsQuery,
    useGetLowStockReportQuery,
    useGetInventoryAgingQuery,
    useGetRepairReportQuery,
    useGetRepairsByTechnicianQuery,
    useGetRepairTurnaroundQuery,
    useGetCommonRepairIssuesQuery,
    useGetProfitLossReportQuery,
    useGetCashFlowReportQuery,
    useGetCustomerDuesReportQuery,
    useGetSupplierDuesReportQuery,
    useGetCollectionsReportQuery,
} = reportsApi;
