import { baseApi } from './baseApi';

export interface NotificationSettings {
    whatsapp_enabled: boolean;
    whatsapp_provider: 'meta' | 'twilio';
    whatsapp_notifications: boolean;
    notify_on_statuses: string[];
    send_payment_reminders: boolean;
    payment_reminder_days: number;
    // Credential status
    has_meta_credentials: boolean;
    has_twilio_credentials: boolean;
    meta_phone_number_id: string;
    twilio_whatsapp_from: string;
}

export interface UpdateNotificationSettingsData {
    whatsapp_provider?: 'meta' | 'twilio';
    whatsapp_notifications?: boolean;
    notify_on_statuses?: string[];
    send_payment_reminders?: boolean;
    payment_reminder_days?: number;
    // Meta WhatsApp credentials
    whatsapp_meta_access_token?: string;
    whatsapp_meta_phone_number_id?: string;
    // Twilio credentials
    twilio_sid?: string;
    twilio_auth_token?: string;
    twilio_whatsapp_from?: string;
}

export const notificationsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get notification settings
        getNotificationSettings: builder.query<NotificationSettings, void>({
            query: () => '/settings/notifications',
            providesTags: ['Shop'],
        }),

        // Update notification settings
        updateNotificationSettings: builder.mutation<{ message: string; settings: any }, UpdateNotificationSettingsData>({
            query: (data) => ({
                url: '/settings/notifications',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Shop'],
        }),

        // Test WhatsApp
        testWhatsApp: builder.mutation<{ success: boolean; message: string }, { phone: string }>({
            query: (data) => ({
                url: '/settings/notifications/test-whatsapp',
                method: 'POST',
                body: data,
            }),
        }),
    }),
});

export const {
    useGetNotificationSettingsQuery,
    useUpdateNotificationSettingsMutation,
    useTestWhatsAppMutation,
} = notificationsApi;
