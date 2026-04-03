import { baseApi } from './baseApi';

export interface RepairStatusHistory {
    id: string;
    from_status: string | null;
    to_status: string;
    notes: string | null;
    created_at: string;
    user?: { id: string; name: string };
}

export interface RepairItem {
    id: string;
    repair_id: string;
    product_id: string | null;
    inventory_item_id: string | null;
    description: string;
    type: 'part' | 'service' | 'other';
    quantity: number;
    unit_cost: number;
    unit_price: number;
    total_price: number;
    product?: {
        id: string;
        name: string;
        sku: string;
    };
    inventory_item?: {
        id: string;
        serial_number: string;
    };
}

export interface RepairPayment {
    id: string;
    amount: number;
    payment_method_id: string;
    reference_number: string | null;
    payment_date: string;
    notes: string | null;
    payment_method?: { id: string; name: string };
}

export interface Repair {
    id: string;
    job_number: string;
    customer_id: string | null;
    technician_id: string | null;
    received_by_id: string;
    device_type: string;
    device_brand: string | null;
    device_model: string | null;
    serial_imei: string | null;
    device_condition: string | null;
    reported_issues: string;
    diagnosis: string | null;
    accessories_received: string[];
    estimated_cost: number;
    final_cost: number;
    paid_amount: number;
    due_amount: number;
    status: 'received' | 'diagnosing' | 'waiting_parts' | 'in_progress' | 'on_hold' | 'completed' | 'delivered' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    received_at: string;
    estimated_completion: string | null;
    completed_at: string | null;
    delivered_at: string | null;
    warranty_days: number;
    notes: string | null;
    internal_notes: string | null;
    customer?: {
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
    };
    technician?: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
    };
    received_by?: { id: string; name: string };
    items?: RepairItem[];
    status_history?: RepairStatusHistory[];
    payments?: RepairPayment[];
}

export interface Technician {
    id: string;
    name: string;
    email: string;
    phone: string | null;
}

export interface StatusOption {
    value: string;
    label: string;
    color: string;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const repairsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get repairs list
        getRepairs: builder.query<{ repairs: Repair[]; meta: PaginationMeta }, {
            page?: number;
            search?: string;
            status?: string;
            priority?: string;
            technician_id?: string;
            customer_id?: string;
            date_from?: string;
            date_to?: string;
            sort_by?: string;
            sort_direction?: 'asc' | 'desc';
        }>({
            query: (params) => ({
                url: '/repairs',
                params,
            }),
            providesTags: ['Repair'],
        }),

        // Get single repair
        getRepair: builder.query<{ repair: Repair }, string>({
            query: (id) => `/repairs/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Repair', id }],
        }),

        // Create repair
        createRepair: builder.mutation<{ repair: Repair; message: string }, {
            customer_id?: string;
            technician_id?: string;
            device_type: string;
            device_brand?: string;
            device_model?: string;
            serial_imei?: string;
            device_condition?: string;
            reported_issues: string;
            diagnosis?: string;
            accessories_received?: string[];
            estimated_cost?: number;
            priority?: string;
            estimated_completion?: string;
            warranty_days?: number;
            notes?: string;
            internal_notes?: string;
        }>({
            query: (data) => ({
                url: '/repairs',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Repair'],
        }),

        // Update repair
        updateRepair: builder.mutation<{ repair: Repair; message: string }, {
            id: string;
            data: Partial<Repair>;
        }>({
            query: ({ id, data }) => ({
                url: `/repairs/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Repair'],
        }),

        // Update repair status
        updateRepairStatus: builder.mutation<{ repair: Repair; message: string }, {
            id: string;
            status: string;
            notes?: string;
        }>({
            query: ({ id, status, notes }) => ({
                url: `/repairs/${id}/status`,
                method: 'PUT',
                body: { status, notes },
            }),
            invalidatesTags: ['Repair'],
        }),

        // Add item to repair
        addRepairItem: builder.mutation<{ item: RepairItem; repair: Repair; message: string }, {
            id: string;
            product_id?: string;
            inventory_item_id?: string;
            description: string;
            type: 'part' | 'service' | 'other';
            quantity?: number;
            unit_cost?: number;
            unit_price: number;
        }>({
            query: ({ id, ...data }) => ({
                url: `/repairs/${id}/items`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Repair', 'Product'],
        }),

        // Remove item from repair
        removeRepairItem: builder.mutation<{ repair: Repair; message: string }, {
            repairId: string;
            itemId: string;
        }>({
            query: ({ repairId, itemId }) => ({
                url: `/repairs/${repairId}/items/${itemId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Repair', 'Product'],
        }),

        // Add payment to repair
        addRepairPayment: builder.mutation<{ payment: RepairPayment; repair: Repair; message: string }, {
            id: string;
            amount: number;
            payment_method_id: string;
            reference_number?: string;
            payment_date?: string;
            notes?: string;
        }>({
            query: ({ id, ...data }) => ({
                url: `/repairs/${id}/payment`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Repair'],
        }),

        // Get job card
        getJobCard: builder.query<{
            repair: Repair;
            shop: any;
            items_by_type: Record<string, RepairItem[]>;
            total_parts: number;
            total_services: number;
            total_other: number;
        }, string>({
            query: (id) => `/repairs/${id}/job-card`,
        }),

        // Get status options
        getRepairStatusOptions: builder.query<{
            statuses: StatusOption[];
            priorities: StatusOption[];
        }, void>({
            query: () => '/repairs/status-options',
        }),

        // Get technicians
        getTechnicians: builder.query<{ technicians: Technician[] }, void>({
            query: () => '/repairs/technicians',
        }),

        // Get repair statistics
        getRepairStatistics: builder.query<{
            total_repairs: number;
            by_status: Record<string, number>;
            by_priority: Record<string, number>;
            total_revenue: number;
            total_collected: number;
            pending_collection: number;
            average_repair_time: number | null;
        }, { date_from?: string; date_to?: string }>({
            query: (params) => ({
                url: '/repairs/statistics',
                params,
            }),
        }),

        // Get repairs by status
        getRepairsByStatus: builder.query<{ repairs: Repair[]; count: number }, string>({
            query: (status) => `/repairs/status/${status}`,
            providesTags: ['Repair'],
        }),

        // Get overdue repairs
        getOverdueRepairs: builder.query<{ repairs: Repair[]; count: number }, void>({
            query: () => '/repairs/overdue',
            providesTags: ['Repair'],
        }),

        // Public tracking
        trackRepair: builder.query<{
            job_number: string;
            device_type: string;
            device_brand: string | null;
            device_model: string | null;
            status: string;
            priority: string;
            received_at: string;
            estimated_completion: string | null;
            completed_at: string | null;
            status_history: { to_status: string; created_at: string }[];
        }, string>({
            query: (jobNumber) => `/repairs/track/${jobNumber}`,
        }),
    }),
});

export const {
    useGetRepairsQuery,
    useGetRepairQuery,
    useCreateRepairMutation,
    useUpdateRepairMutation,
    useUpdateRepairStatusMutation,
    useAddRepairItemMutation,
    useRemoveRepairItemMutation,
    useAddRepairPaymentMutation,
    useGetJobCardQuery,
    useLazyGetJobCardQuery,
    useGetRepairStatusOptionsQuery,
    useGetTechniciansQuery,
    useGetRepairStatisticsQuery,
    useGetRepairsByStatusQuery,
    useGetOverdueRepairsQuery,
    useTrackRepairQuery,
    useLazyTrackRepairQuery,
} = repairsApi;
