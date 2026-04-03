import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const baseQuery = fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token;
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        headers.set('Accept', 'application/json');
        return headers;
    },
});

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery,
    tagTypes: [
        'Auth',
        'User',
        'Shop',
        'Currency',
        'PaymentMethod',
        'ExpenseCategory',
        'Role',
        'Permission',
        'Category',
        'Brand',
        'Product',
        'InventoryItem',
        'Customer',
        'Supplier',
        'SupplierPayment',
        'PurchaseOrder',
        'Sale',
        'Repair',
        'Expense',
        'StockMovement',
        'Dashboard',
        'Report',
    ],
    endpoints: () => ({}),
});
