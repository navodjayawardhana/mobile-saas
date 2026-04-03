import { baseApi } from './baseApi';

export interface ExpenseCategory {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
}

export interface User {
    id: string;
    name: string;
}

export interface Expense {
    id: string;
    shop_id: string;
    user_id: string;
    expense_category_id: string;
    description: string;
    amount: number;
    expense_date: string;
    receipt_path: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
    category?: ExpenseCategory;
}

export interface ExpenseFilters {
    page?: number;
    per_page?: number;
    search?: string;
    category_id?: string;
    user_id?: string;
    date_from?: string;
    date_to?: string;
    amount_min?: number;
    amount_max?: number;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
}

export interface ExpenseSummary {
    total_expenses: number;
    expense_count: number;
    average_expense: number;
    by_category: {
        category_id: string;
        category_name: string;
        total: number;
        count: number;
    }[];
    monthly_breakdown: {
        year: number;
        month: number;
        total: number;
    }[];
    recent_expenses: Expense[];
}

export interface CreateExpenseData {
    expense_category_id: string;
    description: string;
    amount: number;
    expense_date: string;
    notes?: string;
}

export interface UpdateExpenseData {
    expense_category_id?: string;
    description?: string;
    amount?: number;
    expense_date?: string;
    notes?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export const expensesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get paginated expenses
        getExpenses: builder.query<PaginatedResponse<Expense>, ExpenseFilters | void>({
            query: (params) => ({
                url: '/expenses',
                params: params || {},
            }),
            providesTags: (result) =>
                result
                    ? [
                          ...result.data.map(({ id }) => ({ type: 'Expense' as const, id })),
                          { type: 'Expense', id: 'LIST' },
                      ]
                    : [{ type: 'Expense', id: 'LIST' }],
        }),

        // Get expense summary
        getExpenseSummary: builder.query<ExpenseSummary, { date_from?: string; date_to?: string } | void>({
            query: (params) => ({
                url: '/expenses/summary',
                params: params || {},
            }),
            providesTags: ['Expense'],
        }),

        // Get single expense
        getExpense: builder.query<Expense, string>({
            query: (id) => `/expenses/${id}`,
            providesTags: (result, error, id) => [{ type: 'Expense', id }],
        }),

        // Create expense
        createExpense: builder.mutation<{ message: string; expense: Expense }, CreateExpenseData>({
            query: (data) => ({
                url: '/expenses',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Expense', id: 'LIST' }],
        }),

        // Update expense
        updateExpense: builder.mutation<{ message: string; expense: Expense }, { id: string; data: UpdateExpenseData }>({
            query: ({ id, data }) => ({
                url: `/expenses/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Expense', id },
                { type: 'Expense', id: 'LIST' },
            ],
        }),

        // Delete expense
        deleteExpense: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/expenses/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Expense', id },
                { type: 'Expense', id: 'LIST' },
            ],
        }),

        // Upload receipt
        uploadReceipt: builder.mutation<{ message: string; receipt_url: string }, { id: string; file: File }>({
            query: ({ id, file }) => {
                const formData = new FormData();
                formData.append('receipt', file);
                return {
                    url: `/expenses/${id}/receipt`,
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: (result, error, { id }) => [{ type: 'Expense', id }],
        }),

        // Delete receipt
        deleteReceipt: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/expenses/${id}/receipt`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Expense', id }],
        }),
    }),
});

export const {
    useGetExpensesQuery,
    useGetExpenseSummaryQuery,
    useGetExpenseQuery,
    useCreateExpenseMutation,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
    useUploadReceiptMutation,
    useDeleteReceiptMutation,
} = expensesApi;
