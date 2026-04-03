import { baseApi } from './baseApi';
import type {
    Currency,
    PaymentMethod,
    ExpenseCategory,
    Permission,
    PermissionGroup,
    Role,
    ShopSettings,
    UserListItem,
    PaginationMeta,
} from '../../types/settings';

export const settingsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Shop Settings
        getShopSettings: builder.query<{ shop: ShopSettings }, void>({
            query: () => '/settings/shop',
            providesTags: ['Shop'],
        }),
        updateShopSettings: builder.mutation<{ message: string; shop: ShopSettings }, Partial<ShopSettings>>({
            query: (data) => ({
                url: '/settings/shop',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Shop'],
        }),
        uploadShopLogo: builder.mutation<{ message: string; logo: string }, FormData>({
            query: (formData) => ({
                url: '/settings/shop/logo',
                method: 'POST',
                body: formData,
                formData: true,
            }),
            invalidatesTags: ['Shop'],
        }),
        deleteShopLogo: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/settings/shop/logo',
                method: 'DELETE',
            }),
            invalidatesTags: ['Shop'],
        }),

        // Currencies
        getCurrencies: builder.query<{ currencies: Currency[] }, void>({
            query: () => '/settings/currencies',
            providesTags: ['Currency'],
        }),
        createCurrency: builder.mutation<{ message: string; currency: Currency }, Partial<Currency>>({
            query: (data) => ({
                url: '/settings/currencies',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Currency'],
        }),
        updateCurrency: builder.mutation<{ message: string; currency: Currency }, { id: string; data: Partial<Currency> }>({
            query: ({ id, data }) => ({
                url: `/settings/currencies/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Currency'],
        }),
        deleteCurrency: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/settings/currencies/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Currency'],
        }),
        setDefaultCurrency: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/settings/currencies/${id}/default`,
                method: 'POST',
            }),
            invalidatesTags: ['Currency'],
        }),

        // Payment Methods
        getPaymentMethods: builder.query<{ payment_methods: PaymentMethod[] }, { is_active?: boolean } | void>({
            query: (params) => ({
                url: '/settings/payment-methods',
                params: params || {},
            }),
            providesTags: ['PaymentMethod'],
        }),
        createPaymentMethod: builder.mutation<{ message: string; payment_method: PaymentMethod }, Partial<PaymentMethod>>({
            query: (data) => ({
                url: '/settings/payment-methods',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['PaymentMethod'],
        }),
        updatePaymentMethod: builder.mutation<{ message: string; payment_method: PaymentMethod }, { id: string; data: Partial<PaymentMethod> }>({
            query: ({ id, data }) => ({
                url: `/settings/payment-methods/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['PaymentMethod'],
        }),
        deletePaymentMethod: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/settings/payment-methods/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['PaymentMethod'],
        }),
        togglePaymentMethod: builder.mutation<{ message: string; payment_method: PaymentMethod }, string>({
            query: (id) => ({
                url: `/settings/payment-methods/${id}/toggle`,
                method: 'POST',
            }),
            invalidatesTags: ['PaymentMethod'],
        }),

        // Expense Categories
        getExpenseCategories: builder.query<{ expense_categories: ExpenseCategory[] }, { is_active?: boolean } | void>({
            query: (params) => ({
                url: '/settings/expense-categories',
                params: params || {},
            }),
            providesTags: ['ExpenseCategory'],
        }),
        createExpenseCategory: builder.mutation<{ message: string; expense_category: ExpenseCategory }, Partial<ExpenseCategory>>({
            query: (data) => ({
                url: '/settings/expense-categories',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['ExpenseCategory'],
        }),
        updateExpenseCategory: builder.mutation<{ message: string; expense_category: ExpenseCategory }, { id: string; data: Partial<ExpenseCategory> }>({
            query: ({ id, data }) => ({
                url: `/settings/expense-categories/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['ExpenseCategory'],
        }),
        deleteExpenseCategory: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/settings/expense-categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ExpenseCategory'],
        }),

        // Permissions
        getPermissions: builder.query<{ permission_groups: PermissionGroup[]; permissions: Permission[] }, void>({
            query: () => '/settings/permissions',
            providesTags: ['Permission'],
        }),

        // Roles
        getRoles: builder.query<{ roles: Role[] }, void>({
            query: () => '/settings/roles',
            providesTags: ['Role'],
        }),
        getRole: builder.query<{ role: Role }, string>({
            query: (id) => `/settings/roles/${id}`,
            providesTags: (result, error, id) => [{ type: 'Role', id }],
        }),
        createRole: builder.mutation<{ message: string; role: Role }, { name: string; description?: string; permissions?: string[] }>({
            query: (data) => ({
                url: '/settings/roles',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Role'],
        }),
        updateRole: builder.mutation<{ message: string; role: Role }, { id: string; data: { name: string; description?: string } }>({
            query: ({ id, data }) => ({
                url: `/settings/roles/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Role'],
        }),
        deleteRole: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/settings/roles/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Role'],
        }),
        updateRolePermissions: builder.mutation<{ message: string; role: Role }, { id: string; permissions: string[] }>({
            query: ({ id, permissions }) => ({
                url: `/settings/roles/${id}/permissions`,
                method: 'PUT',
                body: { permissions },
            }),
            invalidatesTags: ['Role'],
        }),

        // Users
        getUsers: builder.query<{ users: UserListItem[]; meta: PaginationMeta }, { page?: number; per_page?: number; search?: string; role_id?: string; is_active?: boolean }>({
            query: (params) => ({
                url: '/settings/users',
                params,
            }),
            providesTags: ['User'],
        }),
        getUser: builder.query<{ user: UserListItem }, string>({
            query: (id) => `/settings/users/${id}`,
            providesTags: (result, error, id) => [{ type: 'User', id }],
        }),
        createUser: builder.mutation<{ message: string; user: UserListItem }, { name: string; email: string; phone?: string; password: string; role_id: string; is_active?: boolean }>({
            query: (data) => ({
                url: '/settings/users',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),
        updateUser: builder.mutation<{ message: string; user: UserListItem }, { id: string; data: { name: string; email: string; phone?: string; password?: string; role_id: string; is_active?: boolean } }>({
            query: ({ id, data }) => ({
                url: `/settings/users/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),
        deleteUser: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/settings/users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['User'],
        }),
        toggleUserStatus: builder.mutation<{ message: string; user: UserListItem }, string>({
            query: (id) => ({
                url: `/settings/users/${id}/toggle`,
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),
    }),
});

export const {
    // Shop
    useGetShopSettingsQuery,
    useUpdateShopSettingsMutation,
    useUploadShopLogoMutation,
    useDeleteShopLogoMutation,
    // Currencies
    useGetCurrenciesQuery,
    useCreateCurrencyMutation,
    useUpdateCurrencyMutation,
    useDeleteCurrencyMutation,
    useSetDefaultCurrencyMutation,
    // Payment Methods
    useGetPaymentMethodsQuery,
    useCreatePaymentMethodMutation,
    useUpdatePaymentMethodMutation,
    useDeletePaymentMethodMutation,
    useTogglePaymentMethodMutation,
    // Expense Categories
    useGetExpenseCategoriesQuery,
    useCreateExpenseCategoryMutation,
    useUpdateExpenseCategoryMutation,
    useDeleteExpenseCategoryMutation,
    // Permissions
    useGetPermissionsQuery,
    // Roles
    useGetRolesQuery,
    useGetRoleQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    useUpdateRolePermissionsMutation,
    // Users
    useGetUsersQuery,
    useGetUserQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useToggleUserStatusMutation,
} = settingsApi;
