import { useState } from 'react';
import { useGetNotificationSettingsQuery, useUpdateNotificationSettingsMutation, useTestWhatsAppMutation } from '../../store/api/notificationsApi';
import Swal from 'sweetalert2';

const NotificationSettings = () => {
    const { data: settings, isLoading } = useGetNotificationSettingsQuery();
    const [updateSettings, { isLoading: isUpdating }] = useUpdateNotificationSettingsMutation();
    const [testWhatsApp, { isLoading: isTesting }] = useTestWhatsAppMutation();

    const [testPhone, setTestPhone] = useState('');
    const [showCredentials, setShowCredentials] = useState(false);

    // WhatsApp credentials form
    const [credentials, setCredentials] = useState({
        whatsapp_provider: 'meta' as 'meta' | 'twilio',
        // Meta
        whatsapp_meta_access_token: '',
        whatsapp_meta_phone_number_id: '',
        // Twilio
        twilio_sid: '',
        twilio_auth_token: '',
        twilio_whatsapp_from: '',
    });

    const repairStatuses = [
        { value: 'received', label: 'Received' },
        { value: 'diagnosing', label: 'Diagnosing' },
        { value: 'waiting_parts', label: 'Waiting for Parts' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'on_hold', label: 'On Hold' },
        { value: 'completed', label: 'Completed' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    const handleToggleWhatsApp = async () => {
        try {
            await updateSettings({
                whatsapp_notifications: !settings?.whatsapp_notifications,
            }).unwrap();
            Swal.fire('Success', 'WhatsApp notifications updated', 'success');
        } catch (error: any) {
            Swal.fire('Error', error.data?.message || 'Failed to update settings', 'error');
        }
    };

    const handleToggleStatus = async (status: string) => {
        if (!settings) return;

        const currentStatuses = settings.notify_on_statuses || [];
        let newStatuses: string[];

        if (currentStatuses.includes(status)) {
            newStatuses = currentStatuses.filter((s) => s !== status);
        } else {
            newStatuses = [...currentStatuses, status];
        }

        try {
            await updateSettings({
                notify_on_statuses: newStatuses,
            }).unwrap();
        } catch (error: any) {
            Swal.fire('Error', error.data?.message || 'Failed to update settings', 'error');
        }
    };

    const handleTogglePaymentReminders = async () => {
        try {
            await updateSettings({
                send_payment_reminders: !settings?.send_payment_reminders,
            }).unwrap();
            Swal.fire('Success', 'Payment reminder settings updated', 'success');
        } catch (error: any) {
            Swal.fire('Error', error.data?.message || 'Failed to update settings', 'error');
        }
    };

    const handleUpdateReminderDays = async (days: number) => {
        try {
            await updateSettings({
                payment_reminder_days: days,
            }).unwrap();
        } catch (error: any) {
            Swal.fire('Error', error.data?.message || 'Failed to update settings', 'error');
        }
    };

    const handleSaveCredentials = async () => {
        try {
            const data: any = {
                whatsapp_provider: credentials.whatsapp_provider,
            };

            if (credentials.whatsapp_provider === 'meta') {
                if (!credentials.whatsapp_meta_access_token || !credentials.whatsapp_meta_phone_number_id) {
                    Swal.fire('Error', 'Please fill in all Meta WhatsApp fields', 'error');
                    return;
                }
                data.whatsapp_meta_access_token = credentials.whatsapp_meta_access_token;
                data.whatsapp_meta_phone_number_id = credentials.whatsapp_meta_phone_number_id;
            } else {
                if (!credentials.twilio_sid || !credentials.twilio_auth_token || !credentials.twilio_whatsapp_from) {
                    Swal.fire('Error', 'Please fill in all Twilio fields', 'error');
                    return;
                }
                data.twilio_sid = credentials.twilio_sid;
                data.twilio_auth_token = credentials.twilio_auth_token;
                data.twilio_whatsapp_from = credentials.twilio_whatsapp_from;
            }

            await updateSettings(data).unwrap();
            Swal.fire('Success', 'WhatsApp credentials saved successfully', 'success');
            setShowCredentials(false);
            // Clear sensitive fields
            setCredentials((prev) => ({
                ...prev,
                whatsapp_meta_access_token: '',
                twilio_auth_token: '',
            }));
        } catch (error: any) {
            Swal.fire('Error', error.data?.message || 'Failed to save credentials', 'error');
        }
    };

    const handleTestWhatsApp = async () => {
        if (!testPhone.trim()) {
            Swal.fire('Error', 'Please enter a phone number', 'error');
            return;
        }

        try {
            const result = await testWhatsApp({ phone: testPhone }).unwrap();
            if (result.success) {
                Swal.fire('Success', result.message, 'success');
            } else {
                Swal.fire('Error', result.message, 'error');
            }
        } catch (error: any) {
            Swal.fire('Error', error.data?.message || 'Failed to send test message', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="panel">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h5 className="text-lg font-semibold dark:text-white-light">Notification Settings</h5>
                        <p className="text-gray-500">Configure WhatsApp notifications for your shop</p>
                    </div>
                </div>
            </div>

            {/* WhatsApp Status */}
            <div className="panel">
                <div className="flex items-center gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${settings?.whatsapp_enabled ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>
                        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h5 className="text-lg font-semibold dark:text-white-light">WhatsApp Integration</h5>
                        <p className="text-gray-500">
                            {settings?.whatsapp_enabled
                                ? `Connected via ${settings?.whatsapp_provider === 'meta' ? 'Meta WhatsApp Cloud API' : 'Twilio'}`
                                : 'WhatsApp is not configured. Add your credentials below.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {settings?.whatsapp_enabled && (
                            <span className="badge bg-info">
                                {settings?.whatsapp_provider === 'meta' ? 'Meta Cloud API' : 'Twilio'}
                            </span>
                        )}
                        <span className={`badge ${settings?.whatsapp_enabled ? 'bg-success' : 'bg-warning'}`}>
                            {settings?.whatsapp_enabled ? 'Connected' : 'Not Configured'}
                        </span>
                    </div>
                </div>

                {/* Configure Credentials Button */}
                <div className="border-t dark:border-gray-700 pt-5">
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => setShowCredentials(!showCredentials)}
                    >
                        {showCredentials ? 'Hide Credentials' : (settings?.whatsapp_enabled ? 'Update Credentials' : 'Configure WhatsApp')}
                    </button>
                </div>

                {/* Credentials Form */}
                {showCredentials && (
                    <div className="mt-5 p-5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h6 className="font-semibold mb-4 dark:text-white-light">WhatsApp Credentials</h6>

                        {/* Provider Selection */}
                        <div className="mb-5">
                            <label className="block mb-2 dark:text-white-light">Provider</label>
                            <div className="flex gap-4">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="provider"
                                        className="form-radio"
                                        checked={credentials.whatsapp_provider === 'meta'}
                                        onChange={() => setCredentials({ ...credentials, whatsapp_provider: 'meta' })}
                                    />
                                    <span className="ml-2 dark:text-white-light">Meta WhatsApp Cloud API (Free)</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="provider"
                                        className="form-radio"
                                        checked={credentials.whatsapp_provider === 'twilio'}
                                        onChange={() => setCredentials({ ...credentials, whatsapp_provider: 'twilio' })}
                                    />
                                    <span className="ml-2 dark:text-white-light">Twilio (Paid)</span>
                                </label>
                            </div>
                        </div>

                        {/* Meta Credentials */}
                        {credentials.whatsapp_provider === 'meta' && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mb-4">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Get your credentials from{' '}
                                        <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="underline">
                                            Meta Developer Portal
                                        </a>
                                    </p>
                                </div>
                                <div>
                                    <label className="block mb-2 dark:text-white-light">Access Token</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder={settings?.has_meta_credentials ? '••••••••••••••••' : 'Enter your access token'}
                                        value={credentials.whatsapp_meta_access_token}
                                        onChange={(e) => setCredentials({ ...credentials, whatsapp_meta_access_token: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 dark:text-white-light">Phone Number ID</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={settings?.meta_phone_number_id || 'Enter your phone number ID'}
                                        value={credentials.whatsapp_meta_phone_number_id}
                                        onChange={(e) => setCredentials({ ...credentials, whatsapp_meta_phone_number_id: e.target.value })}
                                    />
                                    {settings?.meta_phone_number_id && (
                                        <p className="text-xs text-gray-500 mt-1">Current: {settings.meta_phone_number_id}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Twilio Credentials */}
                        {credentials.whatsapp_provider === 'twilio' && (
                            <div className="space-y-4">
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded mb-4">
                                    <p className="text-sm text-orange-700 dark:text-orange-300">
                                        Get your credentials from{' '}
                                        <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer" className="underline">
                                            Twilio Console
                                        </a>
                                    </p>
                                </div>
                                <div>
                                    <label className="block mb-2 dark:text-white-light">Account SID</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={settings?.has_twilio_credentials ? '••••••••••••••••' : 'Enter your Account SID'}
                                        value={credentials.twilio_sid}
                                        onChange={(e) => setCredentials({ ...credentials, twilio_sid: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 dark:text-white-light">Auth Token</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Enter your Auth Token"
                                        value={credentials.twilio_auth_token}
                                        onChange={(e) => setCredentials({ ...credentials, twilio_auth_token: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 dark:text-white-light">WhatsApp From Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={settings?.twilio_whatsapp_from || '+14155238886'}
                                        value={credentials.twilio_whatsapp_from}
                                        onChange={(e) => setCredentials({ ...credentials, twilio_whatsapp_from: e.target.value })}
                                    />
                                    {settings?.twilio_whatsapp_from && (
                                        <p className="text-xs text-gray-500 mt-1">Current: {settings.twilio_whatsapp_from}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-5 flex gap-3">
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveCredentials}
                                disabled={isUpdating}
                            >
                                {isUpdating ? 'Saving...' : 'Save Credentials'}
                            </button>
                            <button
                                className="btn btn-outline-dark"
                                onClick={() => setShowCredentials(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Enable/Disable Toggle */}
                {settings?.whatsapp_enabled && (
                    <div className="border-t dark:border-gray-700 pt-5 mt-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium dark:text-white-light">Enable WhatsApp Notifications</p>
                                <p className="text-sm text-gray-500">Send automated messages to customers</p>
                            </div>
                            <label className="w-12 h-6 relative">
                                <input
                                    type="checkbox"
                                    className="custom_switch absolute w-full h-full opacity-0 z-10 cursor-pointer peer"
                                    checked={settings?.whatsapp_notifications ?? true}
                                    onChange={handleToggleWhatsApp}
                                    disabled={isUpdating}
                                />
                                <span className="bg-[#ebedf2] dark:bg-dark block h-full rounded-full before:absolute before:left-1 before:bg-white dark:before:bg-white-dark before:bottom-1 before:w-4 before:h-4 before:rounded-full peer-checked:before:left-7 peer-checked:bg-primary before:transition-all before:duration-300"></span>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Repair Status Notifications */}
            {settings?.whatsapp_enabled && settings?.whatsapp_notifications && (
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Repair Status Notifications</h5>
                    <p className="text-gray-500 mb-4">Select which status changes should trigger a WhatsApp notification to the customer.</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {repairStatuses.map((status) => (
                            <label key={status.value} className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="form-checkbox"
                                    checked={settings?.notify_on_statuses?.includes(status.value) ?? false}
                                    onChange={() => handleToggleStatus(status.value)}
                                />
                                <span className="ml-2 dark:text-white-light">{status.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Payment Reminders */}
            {settings?.whatsapp_enabled && (
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Payment Reminders</h5>

                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className="font-medium dark:text-white-light">Send Payment Reminders</p>
                            <p className="text-sm text-gray-500">Automatically remind customers about upcoming payments</p>
                        </div>
                        <label className="w-12 h-6 relative">
                            <input
                                type="checkbox"
                                className="custom_switch absolute w-full h-full opacity-0 z-10 cursor-pointer peer"
                                checked={settings?.send_payment_reminders ?? true}
                                onChange={handleTogglePaymentReminders}
                                disabled={isUpdating}
                            />
                            <span className="bg-[#ebedf2] dark:bg-dark block h-full rounded-full before:absolute before:left-1 before:bg-white dark:before:bg-white-dark before:bottom-1 before:w-4 before:h-4 before:rounded-full peer-checked:before:left-7 peer-checked:bg-primary before:transition-all before:duration-300"></span>
                        </label>
                    </div>

                    {settings?.send_payment_reminders && (
                        <div className="flex items-center gap-4">
                            <label className="dark:text-white-light">Send reminder</label>
                            <select
                                className="form-select w-auto"
                                value={settings?.payment_reminder_days ?? 3}
                                onChange={(e) => handleUpdateReminderDays(parseInt(e.target.value))}
                            >
                                <option value={1}>1 day</option>
                                <option value={2}>2 days</option>
                                <option value={3}>3 days</option>
                                <option value={5}>5 days</option>
                                <option value={7}>7 days</option>
                            </select>
                            <span className="dark:text-white-light">before due date</span>
                        </div>
                    )}
                </div>
            )}

            {/* Test WhatsApp */}
            {settings?.whatsapp_enabled && (
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Test WhatsApp</h5>
                    <p className="text-gray-500 mb-4">Send a test message to verify your WhatsApp integration is working.</p>

                    <div className="flex gap-4">
                        <input
                            type="text"
                            className="form-input flex-1"
                            placeholder="Enter phone number (e.g., +94771234567)"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={handleTestWhatsApp} disabled={isTesting || !testPhone.trim()}>
                            {isTesting ? (
                                <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block"></span>
                            ) : (
                                'Send Test'
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Phone number must be in international format (e.g., +94771234567)</p>
                </div>
            )}
        </div>
    );
};

export default NotificationSettings;
