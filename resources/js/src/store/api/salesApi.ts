import { baseApi } from './baseApi';

export interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    customer_type: 'individual' | 'business';
    credit_limit: number;
    total_purchases: number;
    total_due: number;
}

export interface SaleItem {
    id: string;
    product_id: string;
    inventory_item_id: string | null;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_price: number;
    warranty_months: number | null;
    warranty_expires_at: string | null;
    product?: {
        id: string;
        name: string;
        sku: string;
        type: string;
    };
    inventory_item?: {
        id: string;
        serial_number: string;
    };
}

export interface Sale {
    id: string;
    invoice_number: string;
    customer_id: string | null;
    user_id: string;
    sale_date: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: 'unpaid' | 'partial' | 'paid' | 'voided';
    sale_type: 'direct' | 'credit' | 'installment';
    notes: string | null;
    customer?: Customer;
    user?: { id: string; name: string };
    items?: SaleItem[];
    payments?: Payment[];
}

export interface Payment {
    id: string;
    amount: number;
    payment_method_id: string;
    reference_number: string | null;
    payment_date: string;
    notes: string | null;
    payment_method?: { id: string; name: string };
}

export interface InstallmentPlan {
    id: string;
    sale_id: string;
    customer_id: string;
    total_amount: number;
    down_payment: number;
    remaining_amount: number;
    number_of_installments: number;
    installment_amount: number;
    interest_rate: number;
    status: 'active' | 'completed' | 'defaulted';
    customer?: Customer;
    sale?: { id: string; invoice_number: string };
    installments?: Installment[];
}

export interface Installment {
    id: string;
    installment_plan_id: string;
    installment_number: number;
    amount: number;
    due_date: string;
    paid_date: string | null;
    paid_amount: number | null;
    status: 'pending' | 'partial' | 'paid' | 'overdue';
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const salesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Customers
        getCustomers: builder.query<{ customers: Customer[]; meta: PaginationMeta }, {
            page?: number;
            search?: string;
            customer_type?: string;
            has_dues?: boolean;
        }>({
            query: (params) => ({
                url: '/customers',
                params,
            }),
            providesTags: ['Customer'],
        }),
        searchCustomers: builder.query<{ customers: Customer[] }, string>({
            query: (q) => ({
                url: '/customers/search',
                params: { q },
            }),
        }),
        getCustomersWithDues: builder.query<{ customers: Customer[]; meta: PaginationMeta; summary: { total_customers_with_dues: number; total_dues_amount: number } }, { page?: number }>({
            query: (params) => ({
                url: '/customers/with-dues',
                params,
            }),
            providesTags: ['Customer'],
        }),
        getCustomer: builder.query<{ customer: Customer }, string>({
            query: (id) => `/customers/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Customer', id }],
        }),
        createCustomer: builder.mutation<{ customer: Customer }, Partial<Customer>>({
            query: (data) => ({
                url: '/customers',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Customer'],
        }),
        updateCustomer: builder.mutation<{ customer: Customer }, { id: string; data: Partial<Customer> }>({
            query: ({ id, data }) => ({
                url: `/customers/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Customer'],
        }),
        deleteCustomer: builder.mutation<void, string>({
            query: (id) => ({
                url: `/customers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Customer'],
        }),
        getCustomerPurchases: builder.query<{ sales: Sale[]; meta: PaginationMeta }, { id: string; page?: number }>({
            query: ({ id, ...params }) => ({
                url: `/customers/${id}/purchases`,
                params,
            }),
        }),
        getCustomerDues: builder.query<{
            total_due: number;
            credit_limit: number;
            available_credit: number;
            unpaid_sales: Sale[];
            installment_plans: InstallmentPlan[];
        }, string>({
            query: (id) => `/customers/${id}/dues`,
        }),

        // Sales
        getSales: builder.query<{ sales: Sale[]; meta: PaginationMeta }, {
            page?: number;
            search?: string;
            customer_id?: string;
            date_from?: string;
            date_to?: string;
            payment_status?: string;
            sale_type?: string;
            user_id?: string;
        }>({
            query: (params) => ({
                url: '/sales',
                params,
            }),
            providesTags: ['Sale'],
        }),
        getTodaySales: builder.query<{
            total_sales: number;
            total_amount: number;
            total_paid: number;
            total_due: number;
            cash_sales: number;
            credit_sales: number;
        }, void>({
            query: () => '/sales/today',
            providesTags: ['Sale'],
        }),
        getSale: builder.query<{ sale: Sale }, string>({
            query: (id) => `/sales/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Sale', id }],
        }),
        createSale: builder.mutation<{ sale: Sale }, {
            customer_id?: string;
            items: {
                product_id: string;
                quantity: number;
                unit_price?: number;
                discount_amount?: number;
                inventory_item_id?: string;
            }[];
            discount_amount?: number;
            tax_amount?: number;
            paid_amount?: number;
            payment_method_id?: string;
            payment_reference?: string;
            sale_type?: string;
            notes?: string;
        }>({
            query: (data) => ({
                url: '/sales',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Sale', 'Product', 'Customer'],
        }),
        voidSale: builder.mutation<{ sale: Sale }, { id: string; reason: string }>({
            query: ({ id, reason }) => ({
                url: `/sales/${id}/void`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: ['Sale', 'Product', 'Customer'],
        }),
        addSalePayment: builder.mutation<{ payment: Payment; sale: Sale }, {
            id: string;
            amount: number;
            payment_method_id: string;
            reference_number?: string;
            payment_date?: string;
            notes?: string;
        }>({
            query: ({ id, ...data }) => ({
                url: `/sales/${id}/payment`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Sale', 'Customer'],
        }),
        getSaleInvoice: builder.query<any, string>({
            query: (id) => `/sales/${id}/invoice`,
        }),

        // POS
        posSearchProducts: builder.query<{ products: any[] }, string>({
            query: (q) => ({
                url: '/pos/products',
                params: { q },
            }),
        }),
        posGetByBarcode: builder.query<{ product: any }, string>({
            query: (barcode) => `/pos/products/barcode/${barcode}`,
        }),
        posGetInventoryItems: builder.query<{ inventory_items: any[] }, string>({
            query: (productId) => `/pos/products/${productId}/items`,
        }),
        posGetQuickProducts: builder.query<{ products: any[] }, void>({
            query: () => '/pos/quick-products',
        }),
        posCreateSale: builder.mutation<{ sale: Sale; invoice: any }, {
            customer_id?: string;
            items: {
                product_id: string;
                quantity: number;
                unit_price?: number;
                discount_amount?: number;
                inventory_item_id?: string;
            }[];
            discount_amount?: number;
            tax_amount?: number;
            paid_amount: number;
            payment_method_id: string;
            payment_reference?: string;
            notes?: string;
        }>({
            query: (data) => ({
                url: '/pos/sale',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Sale', 'Product', 'Customer'],
        }),
        posHoldSale: builder.mutation<{ held_sale: any }, {
            customer_id?: string;
            customer_name?: string;
            items: any[];
            discount_amount?: number;
            notes?: string;
        }>({
            query: (data) => ({
                url: '/pos/hold',
                method: 'POST',
                body: data,
            }),
        }),
        posGetHeld: builder.query<{ held_sales: any[] }, void>({
            query: () => '/pos/held',
        }),
        posResumeHeld: builder.query<{ held_sale: any }, string>({
            query: (id) => `/pos/held/${id}`,
        }),
        posDeleteHeld: builder.mutation<void, string>({
            query: (id) => ({
                url: `/pos/held/${id}`,
                method: 'DELETE',
            }),
        }),

        // Payments
        getPayments: builder.query<{ payments: Payment[]; meta: PaginationMeta }, {
            page?: number;
            payable_type?: string;
            payment_method_id?: string;
            date_from?: string;
            date_to?: string;
        }>({
            query: (params) => ({
                url: '/payments',
                params,
            }),
        }),
        getTodayPayments: builder.query<{ payments: Payment[]; total_count: number; total_amount: number }, void>({
            query: () => '/payments/today',
        }),
        getPaymentsSummary: builder.query<{
            date_from: string;
            date_to: string;
            total_payments: number;
            total_amount: number;
            by_method: Record<string, { count: number; total: number }>;
            by_type: { type: string; count: number; total: number }[];
        }, { date_from?: string; date_to?: string }>({
            query: (params) => ({
                url: '/payments/summary',
                params,
            }),
        }),

        // Installments
        getInstallmentPlans: builder.query<{ installment_plans: InstallmentPlan[]; meta: PaginationMeta }, {
            page?: number;
            customer_id?: string;
            status?: string;
            has_overdue?: boolean;
        }>({
            query: (params) => ({
                url: '/installments',
                params,
            }),
        }),
        getInstallmentPlan: builder.query<{ installment_plan: InstallmentPlan }, string>({
            query: (id) => `/installments/${id}`,
        }),
        createInstallmentPlan: builder.mutation<{ installment_plan: InstallmentPlan }, {
            sale_id: string;
            customer_id: string;
            down_payment: number;
            number_of_installments: number;
            interest_rate?: number;
            first_due_date: string;
            payment_method_id?: string;
        }>({
            query: (data) => ({
                url: '/installments',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Sale', 'Customer'],
        }),
        recordInstallmentPayment: builder.mutation<{ payment: Payment; installment: Installment; installment_plan: InstallmentPlan }, {
            id: string;
            installment_id: string;
            amount: number;
            payment_method_id: string;
            payment_date?: string;
            notes?: string;
        }>({
            query: ({ id, ...data }) => ({
                url: `/installments/${id}/payment`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Sale', 'Customer'],
        }),
        getOverdueInstallments: builder.query<{
            installments: Installment[];
            meta: PaginationMeta;
            summary: { total_overdue_count: number; total_overdue_amount: number };
        }, { page?: number }>({
            query: (params) => ({
                url: '/installments/overdue',
                params,
            }),
        }),
        getUpcomingInstallments: builder.query<{ installments: Installment[]; total_amount: number }, { days?: number }>({
            query: (params) => ({
                url: '/installments/upcoming',
                params,
            }),
        }),
    }),
});

export const {
    // Customers
    useGetCustomersQuery,
    useSearchCustomersQuery,
    useLazySearchCustomersQuery,
    useGetCustomersWithDuesQuery,
    useGetCustomerQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
    useGetCustomerPurchasesQuery,
    useGetCustomerDuesQuery,
    // Sales
    useGetSalesQuery,
    useGetTodaySalesQuery,
    useGetSaleQuery,
    useCreateSaleMutation,
    useVoidSaleMutation,
    useAddSalePaymentMutation,
    useGetSaleInvoiceQuery,
    useLazyGetSaleInvoiceQuery,
    // POS
    usePosSearchProductsQuery,
    useLazyPosSearchProductsQuery,
    usePosGetByBarcodeQuery,
    useLazyPosGetByBarcodeQuery,
    usePosGetInventoryItemsQuery,
    useLazyPosGetInventoryItemsQuery,
    usePosGetQuickProductsQuery,
    usePosCreateSaleMutation,
    usePosHoldSaleMutation,
    usePosGetHeldQuery,
    useLazyPosResumeHeldQuery,
    usePosDeleteHeldMutation,
    // Payments
    useGetPaymentsQuery,
    useGetTodayPaymentsQuery,
    useGetPaymentsSummaryQuery,
    // Installments
    useGetInstallmentPlansQuery,
    useGetInstallmentPlanQuery,
    useCreateInstallmentPlanMutation,
    useRecordInstallmentPaymentMutation,
    useGetOverdueInstallmentsQuery,
    useGetUpcomingInstallmentsQuery,
} = salesApi;
