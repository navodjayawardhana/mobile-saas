import { baseApi } from './baseApi';

export interface Category {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    image: string | null;
    sort_order: number;
    products_count?: number;
    parent?: { id: string; name: string } | null;
    children?: Category[];
}

export interface Brand {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    is_active: boolean;
    products_count?: number;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    category_id: string | null;
    brand_id: string | null;
    type: 'phone' | 'accessory' | 'spare_part';
    condition: 'new' | 'used' | 'refurbished';
    cost_price: number;
    selling_price: number;
    quantity: number;
    min_stock_alert: number;
    is_serialized: boolean;
    warranty_months: number | null;
    description: string | null;
    specifications: Record<string, any> | null;
    images: string[] | null;
    is_active: boolean;
    category?: { id: string; name: string } | null;
    brand?: { id: string; name: string } | null;
}

export interface InventoryItem {
    id: string;
    product_id: string;
    serial_number: string;
    cost_price: number;
    condition: 'new' | 'used' | 'refurbished';
    status: 'in_stock' | 'reserved' | 'sold' | 'returned' | 'damaged';
    warranty_expires_at: string | null;
    product?: Product;
}

export interface StockMovement {
    id: string;
    product_id: string;
    user_id: string;
    type: string;
    quantity: number;
    reference_type: string | null;
    reference_id: string | null;
    notes: string | null;
    created_at: string;
    product?: { id: string; name: string; sku: string };
    user?: { id: string; name: string };
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const inventoryApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Categories
        getCategories: builder.query<{ categories: Category[]; meta: PaginationMeta }, { page?: number; search?: string; parent_id?: string | null }>({
            query: (params) => ({
                url: '/inventory/categories',
                params,
            }),
            providesTags: ['Category'],
        }),
        getCategoryTree: builder.query<{ categories: Category[] }, void>({
            query: () => '/inventory/categories/tree',
            providesTags: ['Category'],
        }),
        getCategory: builder.query<{ category: Category }, string>({
            query: (id) => `/inventory/categories/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Category', id }],
        }),
        createCategory: builder.mutation<{ category: Category }, FormData>({
            query: (data) => ({
                url: '/inventory/categories',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Category'],
        }),
        updateCategory: builder.mutation<{ category: Category }, { id: string; data: FormData }>({
            query: ({ id, data }) => ({
                url: `/inventory/categories/${id}`,
                method: 'POST',
                body: data,
                headers: {
                    'X-HTTP-Method-Override': 'PUT',
                },
            }),
            invalidatesTags: ['Category'],
        }),
        deleteCategory: builder.mutation<void, string>({
            query: (id) => ({
                url: `/inventory/categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Category'],
        }),

        // Brands
        getBrands: builder.query<{ brands: Brand[]; meta: PaginationMeta }, { page?: number; search?: string; is_active?: boolean }>({
            query: (params) => ({
                url: '/inventory/brands',
                params,
            }),
            providesTags: ['Brand'],
        }),
        getAllBrands: builder.query<{ brands: Brand[] }, void>({
            query: () => '/inventory/brands/all',
            providesTags: ['Brand'],
        }),
        getBrand: builder.query<{ brand: Brand }, string>({
            query: (id) => `/inventory/brands/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Brand', id }],
        }),
        createBrand: builder.mutation<{ brand: Brand }, FormData>({
            query: (data) => ({
                url: '/inventory/brands',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Brand'],
        }),
        updateBrand: builder.mutation<{ brand: Brand }, { id: string; data: FormData }>({
            query: ({ id, data }) => ({
                url: `/inventory/brands/${id}`,
                method: 'POST',
                body: data,
                headers: {
                    'X-HTTP-Method-Override': 'PUT',
                },
            }),
            invalidatesTags: ['Brand'],
        }),
        deleteBrand: builder.mutation<void, string>({
            query: (id) => ({
                url: `/inventory/brands/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Brand'],
        }),
        toggleBrandActive: builder.mutation<{ brand: Brand }, string>({
            query: (id) => ({
                url: `/inventory/brands/${id}/toggle`,
                method: 'POST',
            }),
            invalidatesTags: ['Brand'],
        }),

        // Products
        getProducts: builder.query<{ products: Product[]; meta: PaginationMeta }, {
            page?: number;
            search?: string;
            category_id?: string;
            brand_id?: string;
            type?: string;
            condition?: string;
            is_active?: boolean;
            is_serialized?: boolean;
            low_stock?: boolean;
            out_of_stock?: boolean;
            per_page?: number;
        }>({
            query: (params) => ({
                url: '/inventory/products',
                params,
            }),
            providesTags: ['Product'],
        }),
        searchProducts: builder.query<{ products: Product[] }, { q: string; type?: string } | string>({
            query: (params) => {
                const q = typeof params === 'string' ? params : params.q;
                const type = typeof params === 'string' ? undefined : params.type;
                return {
                    url: '/inventory/products/search',
                    params: { q, ...(type ? { type } : {}) },
                };
            },
        }),
        getProduct: builder.query<{ product: Product; recent_movements: StockMovement[] }, string>({
            query: (id) => `/inventory/products/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Product', id }],
        }),
        getProductByBarcode: builder.query<{ product: Product }, string>({
            query: (barcode) => `/inventory/products/barcode/${barcode}`,
        }),
        createProduct: builder.mutation<{ product: Product }, Partial<Product>>({
            query: (data) => ({
                url: '/inventory/products',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Product'],
        }),
        updateProduct: builder.mutation<{ product: Product }, { id: string; data: Partial<Product> }>({
            query: ({ id, data }) => ({
                url: `/inventory/products/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Product'],
        }),
        deleteProduct: builder.mutation<void, string>({
            query: (id) => ({
                url: `/inventory/products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Product'],
        }),
        uploadProductImages: builder.mutation<{ images: string[] }, { id: string; data: FormData }>({
            query: ({ id, data }) => ({
                url: `/inventory/products/${id}/images`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Product'],
        }),
        deleteProductImage: builder.mutation<{ images: string[] }, { id: string; image: string }>({
            query: ({ id, image }) => ({
                url: `/inventory/products/${id}/images`,
                method: 'DELETE',
                body: { image },
            }),
            invalidatesTags: ['Product'],
        }),
        toggleProductActive: builder.mutation<{ product: Product }, string>({
            query: (id) => ({
                url: `/inventory/products/${id}/toggle`,
                method: 'POST',
            }),
            invalidatesTags: ['Product'],
        }),

        // Inventory Items
        getInventoryItems: builder.query<{ inventory_items: InventoryItem[]; meta: PaginationMeta }, {
            page?: number;
            search?: string;
            product_id?: string;
            status?: string;
            condition?: string;
            warranty_expiring?: boolean;
        }>({
            query: (params) => ({
                url: '/inventory/inventory-items',
                params,
            }),
            providesTags: ['InventoryItem'],
        }),
        getInventoryItem: builder.query<{ inventory_item: InventoryItem }, string>({
            query: (id) => `/inventory/inventory-items/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'InventoryItem', id }],
        }),
        getInventoryItemBySerial: builder.query<{ inventory_item: InventoryItem }, string>({
            query: (serial) => `/inventory/inventory-items/serial/${serial}`,
        }),
        getAvailableItems: builder.query<{ inventory_items: InventoryItem[] }, string>({
            query: (productId) => `/inventory/inventory-items/available/${productId}`,
            providesTags: ['InventoryItem'],
        }),
        createInventoryItem: builder.mutation<{ inventory_item: InventoryItem }, {
            product_id: string;
            serial_number: string;
            cost_price: number;
            condition?: string;
            status?: string;
            warranty_expires_at?: string;
        }>({
            query: (data) => ({
                url: '/inventory/inventory-items',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['InventoryItem', 'Product'],
        }),
        createBulkInventoryItems: builder.mutation<{ inventory_items: InventoryItem[] }, {
            product_id: string;
            items: { serial_number: string; cost_price: number; condition?: string; warranty_expires_at?: string }[];
        }>({
            query: (data) => ({
                url: '/inventory/inventory-items/bulk',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['InventoryItem', 'Product'],
        }),
        updateInventoryItem: builder.mutation<{ inventory_item: InventoryItem }, { id: string; data: Partial<InventoryItem> }>({
            query: ({ id, data }) => ({
                url: `/inventory/inventory-items/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['InventoryItem', 'Product'],
        }),
        deleteInventoryItem: builder.mutation<void, string>({
            query: (id) => ({
                url: `/inventory/inventory-items/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['InventoryItem', 'Product'],
        }),

        // Stock
        getStockLevels: builder.query<{ products: Product[] }, { category_id?: string; brand_id?: string; search?: string }>({
            query: (params) => ({
                url: '/stock/levels',
                params,
            }),
            providesTags: ['Product'],
        }),
        getLowStock: builder.query<{ products: Product[]; count: number }, void>({
            query: () => '/stock/low-stock',
            providesTags: ['Product'],
        }),
        getOutOfStock: builder.query<{ products: Product[]; count: number }, void>({
            query: () => '/stock/out-of-stock',
            providesTags: ['Product'],
        }),
        getStockMovements: builder.query<{ movements: StockMovement[]; meta: PaginationMeta }, {
            page?: number;
            product_id?: string;
            type?: string;
            date_from?: string;
            date_to?: string;
        }>({
            query: (params) => ({
                url: '/stock/movements',
                params,
            }),
            providesTags: ['StockMovement'],
        }),
        getMovementTypes: builder.query<{ types: { value: string; label: string }[] }, void>({
            query: () => '/stock/movement-types',
        }),
        adjustStock: builder.mutation<{ movement: StockMovement; old_quantity: number; new_quantity: number }, {
            product_id: string;
            new_quantity: number;
            reason: string;
        }>({
            query: (data) => ({
                url: '/stock/adjustment',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Product', 'StockMovement'],
        }),
        addStock: builder.mutation<{ movement: StockMovement; new_quantity: number }, {
            product_id: string;
            quantity: number;
            reason?: string;
        }>({
            query: (data) => ({
                url: '/stock/add',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Product', 'StockMovement'],
        }),
        removeStock: builder.mutation<{ movement: StockMovement; new_quantity: number }, {
            product_id: string;
            quantity: number;
            reason: string;
        }>({
            query: (data) => ({
                url: '/stock/remove',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Product', 'StockMovement'],
        }),
        getStockValuation: builder.query<{
            items: { id: string; name: string; sku: string; quantity: number; cost_price: number; selling_price: number; cost_value: number; retail_value: number }[];
            summary: { total_products: number; total_quantity: number; total_cost_value: number; total_retail_value: number; potential_profit: number };
        }, { category_id?: string; brand_id?: string }>({
            query: (params) => ({
                url: '/stock/valuation',
                params,
            }),
        }),
    }),
});

export const {
    // Categories
    useGetCategoriesQuery,
    useGetCategoryTreeQuery,
    useGetCategoryQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    // Brands
    useGetBrandsQuery,
    useGetAllBrandsQuery,
    useGetBrandQuery,
    useCreateBrandMutation,
    useUpdateBrandMutation,
    useDeleteBrandMutation,
    useToggleBrandActiveMutation,
    // Products
    useGetProductsQuery,
    useSearchProductsQuery,
    useLazySearchProductsQuery,
    useGetProductQuery,
    useGetProductByBarcodeQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    useUploadProductImagesMutation,
    useDeleteProductImageMutation,
    useToggleProductActiveMutation,
    // Inventory Items
    useGetInventoryItemsQuery,
    useGetInventoryItemQuery,
    useGetInventoryItemBySerialQuery,
    useGetAvailableItemsQuery,
    useCreateInventoryItemMutation,
    useCreateBulkInventoryItemsMutation,
    useUpdateInventoryItemMutation,
    useDeleteInventoryItemMutation,
    // Stock
    useGetStockLevelsQuery,
    useGetLowStockQuery,
    useGetOutOfStockQuery,
    useGetStockMovementsQuery,
    useGetMovementTypesQuery,
    useAdjustStockMutation,
    useAddStockMutation,
    useRemoveStockMutation,
    useGetStockValuationQuery,
} = inventoryApi;
