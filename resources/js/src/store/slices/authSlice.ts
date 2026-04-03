import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../../types/auth';
import { authApi } from '../api/authApi';

const TOKEN_KEY = 'auth_token';

const getStoredToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY);
    }
    return null;
};

const initialState: AuthState = {
    user: null,
    token: getStoredToken(),
    isAuthenticated: !!getStoredToken(),
    isLoading: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.isLoading = false;
            localStorage.setItem(TOKEN_KEY, action.payload.token);
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isLoading = false;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            localStorage.removeItem(TOKEN_KEY);
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
                state.user = payload.user;
                state.token = payload.token;
                state.isAuthenticated = true;
                state.isLoading = false;
                localStorage.setItem(TOKEN_KEY, payload.token);
            })
            .addMatcher(authApi.endpoints.register.matchFulfilled, (state, { payload }) => {
                state.user = payload.user;
                state.token = payload.token;
                state.isAuthenticated = true;
                state.isLoading = false;
                localStorage.setItem(TOKEN_KEY, payload.token);
            })
            .addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.isLoading = false;
                localStorage.removeItem(TOKEN_KEY);
            })
            .addMatcher(authApi.endpoints.getMe.matchFulfilled, (state, { payload }) => {
                state.user = payload.user;
                state.isAuthenticated = true;
                state.isLoading = false;
            })
            .addMatcher(authApi.endpoints.getMe.matchRejected, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.isLoading = false;
                localStorage.removeItem(TOKEN_KEY);
            });
    },
});

export const { setCredentials, setUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectUserPermissions = (state: { auth: AuthState }) => state.auth.user?.permissions || [];

// Permission check helper
export const hasPermission = (permissions: string[], permission: string): boolean => {
    return permissions.includes(permission);
};

export const hasAnyPermission = (permissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.some((p) => permissions.includes(p));
};
