import { baseApi } from './baseApi';

export interface Supplier {
    id: string;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    payment_terms: string | null;
    total_purchases: number;
    total_due: number;
    is_active: boolean;
    created_at: string;
}

export interface SupplierPayment {
    id: string;
    supplier_id: string;
    user_id: string;
    amount: number;
    payment_method_id: string;
    reference_number: string | null;
    payment_date: string;
    notes: string | null;
    supplier?: { id: string; name: string };
    payment_method?: { id: string; name: string };
    user?: { id: string; name: string };
}

export interface PurchaseOrderItem {
    id: string;
    purchase_order_id: string;
    product_id: string;
    quantity_ordered: number;
    quantity_received: number;
    unit_cost: number;
    total_cost: number;
    product?: {
        id: string;
        name: string;
        sku: string;
        type: string;
        is_serialized: boolean;
    };
}

export interface PurchaseOrder {
    id: string;
    supplier_id: string;
    user_id: string;
    po_number: string;
    order_date: string;
    expected_date: string | null;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    status: 'pending' | 'partial' | 'received' | 'cancelled';
    payment_status: 'unpaid' | 'partial' | 'paid';
    notes: string | null;
    supplier?: Supplier;
    user?: { id: string; name: string };
    items?: PurchaseOrderItem[];
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const suppliersApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Suppliers
        getSuppliers: builder.query<{ suppliers: Supplier[]; meta: PaginationMeta }, {
            page?: number;
            search?: string;
            is_active?: boolean;
            has_dues?: boolean;
            sort_by?: string;
            sort_direction?: 'asc' | 'desc';
        }>({
            query: (params) => ({
                url: '/suppliers',
                params,
            }),
            providesTags: ['Supplier'],
        }),
        getAllSuppliers: builder.query<{ suppliers: Supplier[] }, void>({
            query: () => '/suppliers/all',
            providesTags: ['Supplier'],
        }),
        getSuppliersWithDues: builder.query<{
            suppliers: Supplier[];
            meta: PaginationMeta;
            summary: {
                total_suppliers_with_dues: number;
                total_dues_amount: number;
            };
        }, { page?: number }>({
            query: (params) => ({
                url: '/suppliers/with-dues',
                params,
            }),
            providesTags: ['Supplier'],
        }),
        getSupplier: builder.query<{ supplier: Supplier }, string>({
            query: (id) => `/suppliers/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Supplier', id }],
        }),
        createSupplier: builder.mutation<{ supplier: Supplier; message: string }, Partial<Supplier>>({
            query: (data) => ({
                url: '/suppliers',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Supplier'],
        }),
        updateSupplier: builder.mutation<{ supplier: Supplier; message: string }, { id: string; data: Partial<Supplier> }>({
            query: ({ id, data }) => ({
                url: `/suppliers/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Supplier'],
        }),
        deleteSupplier: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/suppliers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Supplier'],
        }),
        toggleSupplierActive: builder.mutation<{ supplier: Supplier; message: string }, string>({
            query: (id) => ({
                url: `/suppliers/${id}/toggle`,
                method: 'POST',
            }),
            invalidatesTags: ['Supplier'],
        }),
        getSupplierPurchases: builder.query<{ purchase_orders: PurchaseOrder[]; meta: PaginationMeta }, { id: string; page?: number }>({
            query: ({ id, ...params }) => ({
                url: `/suppliers/${id}/purchases`,
                params,
            }),
        }),
        getSupplierPayments: builder.query<{ payments: SupplierPayment[]; meta: PaginationMeta }, { id: string; page?: number }>({
            query: ({ id, ...params }) => ({
                url: `/suppliers/${id}/payments`,
                params,
            }),
        }),
        getSupplierDues: builder.query<{
            total_due: number;
            total_purchases: number;
            unpaid_orders: PurchaseOrder[];
        }, string>({
            query: (id) => `/suppliers/${id}/dues`,
        }),

        // Supplier Payments
        getSupplierPaymentsList: builder.query<{ payments: SupplierPayment[]; meta: PaginationMeta }, {
            page?: number;
            supplier_id?: string;
            date_from?: string;
            date_to?: string;
            payment_method_id?: string;
            sort_by?: string;
            sort_direction?: 'asc' | 'desc';
        }>({
            query: (params) => ({
                url: '/supplier-payments',
                params,
            }),
            providesTags: ['SupplierPayment'],
        }),
        getSupplierPayment: builder.query<{ payment: SupplierPayment }, string>({
            query: (id) => `/supplier-payments/${id}`,
        }),
        createSupplierPayment: builder.mutation<{
            payment: SupplierPayment;
            supplier: Supplier;
            message: string;
        }, {
            supplier_id: string;
            amount: number;
            payment_method_id: string;
            payment_date?: string;
            reference_number?: string;
            notes?: string;
        }>({
            query: ({ supplier_id, ...data }) => ({
                url: `/supplier-payments/${supplier_id}`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Supplier', 'SupplierPayment', 'PurchaseOrder'],
        }),
        getSupplierPaymentsSummary: builder.query<{
            date_from: string;
            date_to: string;
            total_payments: number;
            total_amount: number;
            by_method: Record<string, { count: number; total: number }>;
        }, { date_from?: string; date_to?: string }>({
            query: (params) => ({
                url: '/supplier-payments/summary',
                params,
            }),
        }),

        // Purchase Orders
        getPurchaseOrders: builder.query<{ purchase_orders: PurchaseOrder[]; meta: PaginationMeta }, {
            page?: number;
            search?: string;
            supplier_id?: string;
            status?: string;
            payment_status?: string;
            date_from?: string;
            date_to?: string;
            sort_by?: string;
            sort_direction?: 'asc' | 'desc';
        }>({
            query: (params) => ({
                url: '/purchase-orders',
                params,
            }),
            providesTags: ['PurchaseOrder'],
        }),
        getPendingPurchaseOrders: builder.query<{ purchase_orders: PurchaseOrder[]; count: number }, void>({
            query: () => '/purchase-orders/pending',
            providesTags: ['PurchaseOrder'],
        }),
        getPurchaseOrder: builder.query<{ purchase_order: PurchaseOrder }, string>({
            query: (id) => `/purchase-orders/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'PurchaseOrder', id }],
        }),
        createPurchaseOrder: builder.mutation<{ purchase_order: PurchaseOrder; message: string }, {
            supplier_id: string;
            items: {
                product_id: string;
                quantity_ordered: number;
                unit_cost: number;
            }[];
            order_date?: string;
            expected_date?: string;
            tax_amount?: number;
            notes?: string;
        }>({
            query: (data) => ({
                url: '/purchase-orders',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['PurchaseOrder', 'Supplier'],
        }),
        updatePurchaseOrder: builder.mutation<{ purchase_order: PurchaseOrder; message: string }, {
            id: string;
            expected_date?: string;
            tax_amount?: number;
            notes?: string;
        }>({
            query: ({ id, ...data }) => ({
                url: `/purchase-orders/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['PurchaseOrder'],
        }),
        receivePurchaseOrderItems: builder.mutation<{ purchase_order: PurchaseOrder; message: string }, {
            id: string;
            items: {
                item_id: string;
                quantity_received: number;
                serial_numbers?: {
                    serial_number: string;
                    cost_price?: number;
                    condition?: 'new' | 'used' | 'refurbished';
                }[];
            }[];
        }>({
            query: ({ id, ...data }) => ({
                url: `/purchase-orders/${id}/receive`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['PurchaseOrder', 'Product', 'InventoryItem'],
        }),
        addPurchaseOrderPayment: builder.mutation<{
            payment: SupplierPayment;
            purchase_order: PurchaseOrder;
            message: string;
        }, {
            id: string;
            amount: number;
            payment_method_id: string;
            reference_number?: string;
            payment_date?: string;
            notes?: string;
        }>({
            query: ({ id, ...data }) => ({
                url: `/purchase-orders/${id}/payment`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['PurchaseOrder', 'Supplier', 'SupplierPayment'],
        }),
        cancelPurchaseOrder: builder.mutation<{ purchase_order: PurchaseOrder; message: string }, {
            id: string;
            reason: string;
        }>({
            query: ({ id, reason }) => ({
                url: `/purchase-orders/${id}/cancel`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: ['PurchaseOrder', 'Supplier', 'Product'],
        }),
    }),
});

export const {
    // Suppliers
    useGetSuppliersQuery,
    useGetAllSuppliersQuery,
    useGetSuppliersWithDuesQuery,
    useGetSupplierQuery,
    useCreateSupplierMutation,
    useUpdateSupplierMutation,
    useDeleteSupplierMutation,
    useToggleSupplierActiveMutation,
    useGetSupplierPurchasesQuery,
    useGetSupplierPaymentsQuery,
    useGetSupplierDuesQuery,
    // Supplier Payments
    useGetSupplierPaymentsListQuery,
    useGetSupplierPaymentQuery,
    useCreateSupplierPaymentMutation,
    useGetSupplierPaymentsSummaryQuery,
    // Purchase Orders
    useGetPurchaseOrdersQuery,
    useGetPendingPurchaseOrdersQuery,
    useGetPurchaseOrderQuery,
    useCreatePurchaseOrderMutation,
    useUpdatePurchaseOrderMutation,
    useReceivePurchaseOrderItemsMutation,
    useAddPurchaseOrderPaymentMutation,
    useCancelPurchaseOrderMutation,
} = suppliersApi;
