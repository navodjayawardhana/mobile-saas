export interface Currency {
    id: string;
    code: string;
    name: string;
    symbol: string;
    exchange_rate: number;
    is_default: boolean;
}

export interface PaymentMethod {
    id: string;
    name: string;
    is_active: boolean;
    settings: Record<string, any> | null;
}

export interface ExpenseCategory {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
}

export interface Permission {
    id: string;
    name: string;
    slug: string;
    group: string;
    description: string | null;
}

export interface PermissionGroup {
    group: string;
    permissions: Permission[];
}

export interface Role {
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
    users_count?: number;
    permissions?: Permission[];
    permission_ids?: string[];
}

export interface ShopSettings {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    logo: string | null;
    timezone: string;
    default_currency_id: string | null;
    subscription_plan: string;
    settings: Record<string, any> | null;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface UserListItem {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    is_active: boolean;
    role: {
        id: string;
        name: string;
    } | null;
    created_at: string;
}
