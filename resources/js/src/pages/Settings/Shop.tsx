import { useState, useRef } from 'react';
import { useGetShopSettingsQuery, useUpdateShopSettingsMutation, useUploadShopLogoMutation } from '../../store/api/settingsApi';
import Swal from 'sweetalert2';

const ShopSettings = () => {
    const { data, isLoading } = useGetShopSettingsQuery();
    const [updateSettings, { isLoading: isUpdating }] = useUpdateShopSettingsMutation();
    const [uploadLogo, { isLoading: isUploading }] = useUploadShopLogoMutation();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewLogo, setPreviewLogo] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
    });

    // Initialize form when data loads
    useState(() => {
        if (data?.shop) {
            setFormData({
                name: data.shop.name || '',
                email: data.shop.email || '',
                phone: data.shop.phone || '',
                address: data.shop.address || '',
            });
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await updateSettings(formData).unwrap();
            Swal.fire('Success', 'Shop settings updated successfully', 'success');
        } catch (error: any) {
            Swal.fire('Error', error.data?.message || 'Failed to update settings', 'error');
        }
    };

    const handleLogoClick = () => {
        fileInputRef.current?.click();
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewLogo(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        const formData = new FormData();
        formData.append('logo', file);

        try {
            await uploadLogo(formData).unwrap();
            Swal.fire('Success', 'Logo uploaded successfully', 'success');
        } catch (error: any) {
            Swal.fire('Error', error.data?.message || 'Failed to upload logo', 'error');
            setPreviewLogo(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const shop = data?.shop;
    const logoUrl = previewLogo || (shop?.logo ? `/storage/${shop.logo}` : null);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="panel">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h5 className="text-lg font-semibold dark:text-white-light">Shop Profile</h5>
                        <p className="text-gray-500">Manage your shop information and branding</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Logo Section */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Shop Logo</h5>
                    <div className="flex flex-col items-center">
                        <div
                            onClick={handleLogoClick}
                            className="w-40 h-40 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden"
                        >
                            {logoUrl ? (
                                <img src={logoUrl} alt="Shop Logo" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm">Click to upload</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                        />
                        <p className="text-xs text-gray-500 mt-3 text-center">
                            Recommended: 200x200px<br />
                            Max size: 2MB
                        </p>
                        {isUploading && (
                            <div className="mt-3">
                                <span className="animate-spin border-2 border-primary border-l-transparent rounded-full w-5 h-5 inline-block"></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Shop Details Form */}
                <div className="panel lg:col-span-2">
                    <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Shop Information</h5>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="name" className="block mb-2 dark:text-white-light">
                                    Shop Name <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    className="form-input"
                                    value={formData.name || shop?.name || ''}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block mb-2 dark:text-white-light">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className="form-input"
                                    value={formData.email || shop?.email || ''}
                                    onChange={handleChange}
                                    placeholder="shop@example.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block mb-2 dark:text-white-light">
                                    Phone Number
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="text"
                                    className="form-input"
                                    value={formData.phone || shop?.phone || ''}
                                    onChange={handleChange}
                                    placeholder="+94 77 123 4567"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 dark:text-white-light">
                                    Subscription
                                </label>
                                <input
                                    type="text"
                                    className="form-input bg-gray-100 dark:bg-gray-800"
                                    value={shop?.subscription_plan || 'Free'}
                                    disabled
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="address" className="block mb-2 dark:text-white-light">
                                Address
                            </label>
                            <textarea
                                id="address"
                                name="address"
                                className="form-textarea"
                                rows={3}
                                value={formData.address || shop?.address || ''}
                                onChange={handleChange}
                                placeholder="Shop address for receipts and invoices"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                                {isUpdating ? (
                                    <>
                                        <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block mr-2"></span>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Receipt Preview */}
            <div className="panel">
                <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Receipt Preview</h5>
                <div className="max-w-sm mx-auto bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-6 text-center">
                    {logoUrl && (
                        <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain mx-auto mb-3" />
                    )}
                    <h3 className="font-bold text-lg">{formData.name || shop?.name || 'Your Shop Name'}</h3>
                    {(formData.address || shop?.address) && (
                        <p className="text-sm text-gray-500 mt-1">{formData.address || shop?.address}</p>
                    )}
                    {(formData.phone || shop?.phone) && (
                        <p className="text-sm text-gray-500">Tel: {formData.phone || shop?.phone}</p>
                    )}
                    {(formData.email || shop?.email) && (
                        <p className="text-sm text-gray-500">{formData.email || shop?.email}</p>
                    )}
                    <div className="border-t dark:border-gray-700 mt-4 pt-4">
                        <p className="text-xs text-gray-400">This is how your shop info will appear on receipts</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopSettings;
