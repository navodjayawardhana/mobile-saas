import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRepairMutation, useGetTechniciansQuery, useGetRepairStatusOptionsQuery } from '../../store/api/repairsApi';
import { useLazySearchCustomersQuery, useCreateCustomerMutation } from '../../store/api/salesApi';

const RepairCreate = () => {
    const navigate = useNavigate();
    const [createRepair, { isLoading }] = useCreateRepairMutation();
    const { data: techniciansData } = useGetTechniciansQuery();
    const { data: statusOptions } = useGetRepairStatusOptionsQuery();
    const [searchCustomers] = useLazySearchCustomersQuery();
    const [createCustomer] = useCreateCustomerMutation();

    const [error, setError] = useState('');

    // Customer search
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState<any[]>([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        customer_id: '',
        customer_name: '',
        customer_phone: '',
        technician_id: '',
        device_type: '',
        device_brand: '',
        device_model: '',
        serial_imei: '',
        device_condition: '',
        reported_issues: '',
        diagnosis: '',
        accessories_received: [] as string[],
        estimated_cost: '',
        priority: 'normal',
        estimated_completion: '',
        warranty_days: '0',
        notes: '',
        internal_notes: '',
    });

    // Accessory input
    const [newAccessory, setNewAccessory] = useState('');

    const handleCustomerSearch = async (query: string) => {
        setCustomerSearch(query);
        setFormData({ ...formData, customer_name: query, customer_id: '' });

        if (query.length >= 2) {
            const result = await searchCustomers(query).unwrap();
            setCustomerResults(result.customers || []);
            setShowCustomerDropdown(true);
        } else {
            setCustomerResults([]);
            setShowCustomerDropdown(false);
        }
    };

    const selectCustomer = (customer: any) => {
        setFormData({
            ...formData,
            customer_id: customer.id,
            customer_name: customer.name,
            customer_phone: customer.phone || '',
        });
        setCustomerSearch(customer.name);
        setShowCustomerDropdown(false);
    };

    const addAccessory = () => {
        if (newAccessory.trim()) {
            setFormData({
                ...formData,
                accessories_received: [...formData.accessories_received, newAccessory.trim()],
            });
            setNewAccessory('');
        }
    };

    const removeAccessory = (index: number) => {
        setFormData({
            ...formData,
            accessories_received: formData.accessories_received.filter((_, i) => i !== index),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Create customer if needed
            let customerId = formData.customer_id;
            if (!customerId && formData.customer_name) {
                const customerResult = await createCustomer({
                    name: formData.customer_name,
                    phone: formData.customer_phone || undefined,
                }).unwrap();
                customerId = customerResult.customer.id;
            }

            const result = await createRepair({
                customer_id: customerId || undefined,
                technician_id: formData.technician_id || undefined,
                device_type: formData.device_type,
                device_brand: formData.device_brand || undefined,
                device_model: formData.device_model || undefined,
                serial_imei: formData.serial_imei || undefined,
                device_condition: formData.device_condition || undefined,
                reported_issues: formData.reported_issues,
                diagnosis: formData.diagnosis || undefined,
                accessories_received: formData.accessories_received.length > 0 ? formData.accessories_received : undefined,
                estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : undefined,
                priority: formData.priority,
                estimated_completion: formData.estimated_completion || undefined,
                warranty_days: parseInt(formData.warranty_days) || 0,
                notes: formData.notes || undefined,
                internal_notes: formData.internal_notes || undefined,
            }).unwrap();

            navigate(`/repairs/${result.repair.id}`);
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to create repair');
        }
    };

    const commonDeviceTypes = ['Smartphone', 'Tablet', 'Laptop', 'Desktop', 'Smartwatch', 'Other'];
    const commonBrands = ['Apple', 'Samsung', 'Huawei', 'Xiaomi', 'OnePlus', 'Google', 'OPPO', 'Vivo', 'Realme', 'Nokia', 'Other'];

    return (
        <div className="space-y-5">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="text-lg font-semibold dark:text-white-light">Create Repair Job</h5>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => navigate('/repairs')}>
                        <svg className="w-4 h-4 ltr:mr-1 rtl:ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                </div>

                {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Customer Section */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-5 mb-5">
                        <h6 className="text-base font-semibold mb-4">Customer Information</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <label htmlFor="customer">Customer Name</label>
                                <input
                                    id="customer"
                                    type="text"
                                    className="form-input"
                                    placeholder="Search or enter customer name..."
                                    value={customerSearch || formData.customer_name}
                                    onChange={(e) => handleCustomerSearch(e.target.value)}
                                    onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                                />
                                {showCustomerDropdown && customerResults.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                                        {customerResults.map((customer) => (
                                            <div
                                                key={customer.id}
                                                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                onClick={() => selectCustomer(customer)}
                                            >
                                                <div className="font-semibold">{customer.name}</div>
                                                <div className="text-xs text-gray-500">{customer.phone}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="customer_phone">Phone Number</label>
                                <input
                                    id="customer_phone"
                                    type="tel"
                                    className="form-input"
                                    placeholder="Customer phone number"
                                    value={formData.customer_phone}
                                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Device Section */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-5 mb-5">
                        <h6 className="text-base font-semibold mb-4">Device Information</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="device_type">Device Type *</label>
                                <select
                                    id="device_type"
                                    className="form-select"
                                    value={formData.device_type}
                                    onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                                    required
                                >
                                    <option value="">Select device type</option>
                                    {commonDeviceTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="device_brand">Brand</label>
                                <select
                                    id="device_brand"
                                    className="form-select"
                                    value={formData.device_brand}
                                    onChange={(e) => setFormData({ ...formData, device_brand: e.target.value })}
                                >
                                    <option value="">Select brand</option>
                                    {commonBrands.map((brand) => (
                                        <option key={brand} value={brand}>
                                            {brand}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="device_model">Model</label>
                                <input
                                    id="device_model"
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., iPhone 14 Pro, Galaxy S23"
                                    value={formData.device_model}
                                    onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="serial_imei">Serial/IMEI</label>
                                <input
                                    id="serial_imei"
                                    type="text"
                                    className="form-input"
                                    placeholder="Device serial or IMEI number"
                                    value={formData.serial_imei}
                                    onChange={(e) => setFormData({ ...formData, serial_imei: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="device_condition">Device Condition</label>
                                <input
                                    id="device_condition"
                                    type="text"
                                    className="form-input"
                                    placeholder="Physical condition, scratches, damages..."
                                    value={formData.device_condition}
                                    onChange={(e) => setFormData({ ...formData, device_condition: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Accessories */}
                        <div className="mt-4">
                            <label>Accessories Received</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Charger, Case, SIM card..."
                                    value={newAccessory}
                                    onChange={(e) => setNewAccessory(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAccessory())}
                                />
                                <button type="button" className="btn btn-outline-primary" onClick={addAccessory}>
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.accessories_received.map((acc, index) => (
                                    <span key={index} className="badge bg-info flex items-center gap-1">
                                        {acc}
                                        <button type="button" className="text-white hover:text-gray-200" onClick={() => removeAccessory(index)}>
                                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Issue Section */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-5 mb-5">
                        <h6 className="text-base font-semibold mb-4">Issue Details</h6>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="reported_issues">Reported Issues *</label>
                                <textarea
                                    id="reported_issues"
                                    className="form-textarea"
                                    rows={3}
                                    placeholder="Describe the issues reported by the customer..."
                                    value={formData.reported_issues}
                                    onChange={(e) => setFormData({ ...formData, reported_issues: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                            <div>
                                <label htmlFor="diagnosis">Initial Diagnosis</label>
                                <textarea
                                    id="diagnosis"
                                    className="form-textarea"
                                    rows={2}
                                    placeholder="Initial diagnosis (can be updated later)..."
                                    value={formData.diagnosis}
                                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Assignment & Scheduling */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-5 mb-5">
                        <h6 className="text-base font-semibold mb-4">Assignment & Scheduling</h6>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label htmlFor="technician">Assign Technician</label>
                                <select
                                    id="technician"
                                    className="form-select"
                                    value={formData.technician_id}
                                    onChange={(e) => setFormData({ ...formData, technician_id: e.target.value })}
                                >
                                    <option value="">Unassigned</option>
                                    {techniciansData?.technicians.map((tech) => (
                                        <option key={tech.id} value={tech.id}>
                                            {tech.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="priority">Priority</label>
                                <select
                                    id="priority"
                                    className="form-select"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    {statusOptions?.priorities.map((p) => (
                                        <option key={p.value} value={p.value}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="estimated_completion">Estimated Completion</label>
                                <input
                                    id="estimated_completion"
                                    type="datetime-local"
                                    className="form-input"
                                    value={formData.estimated_completion}
                                    onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="estimated_cost">Estimated Cost</label>
                                <input
                                    id="estimated_cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    placeholder="0.00"
                                    value={formData.estimated_cost}
                                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mb-5">
                        <h6 className="text-base font-semibold mb-4">Additional Information</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="warranty_days">Warranty (Days)</label>
                                <input
                                    id="warranty_days"
                                    type="number"
                                    min="0"
                                    className="form-input"
                                    value={formData.warranty_days}
                                    onChange={(e) => setFormData({ ...formData, warranty_days: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="notes">Customer Notes</label>
                                <textarea
                                    id="notes"
                                    className="form-textarea"
                                    rows={2}
                                    placeholder="Notes visible to customer..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="internal_notes">Internal Notes</label>
                                <textarea
                                    id="internal_notes"
                                    className="form-textarea"
                                    rows={2}
                                    placeholder="Internal notes (not visible to customer)..."
                                    value={formData.internal_notes}
                                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button type="button" className="btn btn-outline-dark" onClick={() => navigate('/repairs')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading && (
                                <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>
                            )}
                            Create Repair Job
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RepairCreate;
