export interface Shop {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    timezone: string;
}

export interface Role {
    id: string;
    name: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    is_active: boolean;
    shop: Shop | null;
    role: Role | null;
    permissions: string[];
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    shop_name: string;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

export interface ProfileUpdateRequest {
    name: string;
    email: string;
    phone?: string;
}

export interface PasswordUpdateRequest {
    current_password: string;
    password: string;
    password_confirmation: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
}
