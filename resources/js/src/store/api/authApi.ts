import { baseApi } from './baseApi';
import type { AuthResponse, LoginRequest, RegisterRequest, User, ProfileUpdateRequest, PasswordUpdateRequest, ForgotPasswordRequest, ResetPasswordRequest } from '../../types/auth';

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['Auth'],
        }),

        register: builder.mutation<AuthResponse, RegisterRequest>({
            query: (data) => ({
                url: '/auth/register',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Auth'],
        }),

        logout: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            invalidatesTags: ['Auth'],
        }),

        getMe: builder.query<{ user: User }, void>({
            query: () => '/auth/me',
            providesTags: ['Auth'],
        }),

        updateProfile: builder.mutation<{ message: string; user: User }, ProfileUpdateRequest>({
            query: (data) => ({
                url: '/auth/profile',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Auth'],
        }),

        updatePassword: builder.mutation<{ message: string }, PasswordUpdateRequest>({
            query: (data) => ({
                url: '/auth/profile/password',
                method: 'PUT',
                body: data,
            }),
        }),

        uploadAvatar: builder.mutation<{ message: string; avatar: string }, FormData>({
            query: (formData) => ({
                url: '/auth/profile/avatar',
                method: 'POST',
                body: formData,
                formData: true,
            }),
            invalidatesTags: ['Auth'],
        }),

        deleteAvatar: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/auth/profile/avatar',
                method: 'DELETE',
            }),
            invalidatesTags: ['Auth'],
        }),

        forgotPassword: builder.mutation<{ message: string }, ForgotPasswordRequest>({
            query: (data) => ({
                url: '/auth/forgot-password',
                method: 'POST',
                body: data,
            }),
        }),

        resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
            query: (data) => ({
                url: '/auth/reset-password',
                method: 'POST',
                body: data,
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useRegisterMutation,
    useLogoutMutation,
    useGetMeQuery,
    useUpdateProfileMutation,
    useUpdatePasswordMutation,
    useUploadAvatarMutation,
    useDeleteAvatarMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
} = authApi;
