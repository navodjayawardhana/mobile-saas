import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetCustomersQuery, useDeleteCustomerMutation, useCreateCustomerMutation, useUpdateCustomerMutation } from '../../store/api/salesApi';
import type { Customer } from '../../store/api/salesApi';
import Modal from '../../components/Common/Modal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { useCurrency } from '../../hooks/useCurrency';

const CustomersIndex = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [customerType, setCustomerType] = useState('');
    const [hasDues, setHasDues] = useState(false);

    const { data, isLoading } = useGetCustomersQuery({
        page,
        search,
        customer_type: customerType || undefined,
        has_dues: hasDues || undefined,
    });
    const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
    const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        customer_type: 'individual' as 'individual' | 'business',
        credit_limit: '0',
    });

    const { formatCurrency } = useCurrency();

    const openCreateModal = () => {
        setEditingCustomer(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            customer_type: 'individual',
            credit_limit: '0',
        });
        setError('');
        setIsModalOpen(true);
    };

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            customer_type: customer.customer_type,
            credit_limit: customer.credit_limit.toString(),
        });
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const payload = {
            name: formData.name,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            address: formData.address || undefined,
            customer_type: formData.customer_type,
            credit_limit: parseFloat(formData.credit_limit) || 0,
        };

        try {
            if (editingCustomer) {
                await updateCustomer({ id: editingCustomer.id, data: payload }).unwrap();
            } else {
                await createCustomer(payload).unwrap();
            }
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err?.data?.message || 'An error occurred');
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteCustomer(deletingId).unwrap();
            setIsDeleteOpen(false);
            setDeletingId(null);
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot delete customer');
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="panel">
            <div className="flex flex-col md:flex-row items-center justify-between mb-5 gap-4">
                <h5 className="text-lg font-semibold dark:text-white-light">Customers</h5>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                    <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Customer
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search name, phone, email..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
                <select
                    className="form-select"
                    value={customerType}
                    onChange={(e) => {
                        setCustomerType(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Types</option>
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                </select>
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={hasDues}
                        onChange={(e) => {
                            setHasDues(e.target.checked);
                            setPage(1);
                        }}
                    />
                    <span className="ml-2">Has Outstanding Dues</span>
                </label>
            </div>

            {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Contact</th>
                            <th>Type</th>
                            <th>Total Purchases</th>
                            <th>Outstanding Dues</th>
                            <th>Credit Limit</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.customers.map((customer) => (
                            <tr key={customer.id}>
                                <td>
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3 text-sm font-bold">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-semibold">{customer.name}</span>
                                    </div>
                                </td>
                                <td>
                                    {customer.phone && <p>{customer.phone}</p>}
                                    {customer.email && <p className="text-xs text-gray-500">{customer.email}</p>}
                                </td>
                                <td>
                                    <span className={`badge ${customer.customer_type === 'business' ? 'bg-primary' : 'bg-info'}`}>
                                        {customer.customer_type === 'business' ? 'Business' : 'Individual'}
                                    </span>
                                </td>
                                <td className="font-semibold">{formatCurrency(customer.total_purchases)}</td>
                                <td>
                                    <span className={customer.total_due > 0 ? 'text-danger font-bold' : ''}>
                                        {formatCurrency(customer.total_due)}
                                    </span>
                                </td>
                                <td>{formatCurrency(customer.credit_limit)}</td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Link
                                            to={`/customers/${customer.id}`}
                                            className="btn btn-sm btn-outline-info"
                                        >
                                            View
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => openEditModal(customer)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => {
                                                setDeletingId(customer.id);
                                                setIsDeleteOpen(true);
                                                setError('');
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data?.customers.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    No customers found.
                </div>
            )}

            {/* Pagination */}
            {data?.meta && data.meta.last_page > 1 && (
                <div className="flex justify-center mt-5">
                    <ul className="inline-flex items-center space-x-1 rtl:space-x-reverse">
                        <li>
                            <button
                                type="button"
                                className="flex justify-center font-semibold px-3.5 py-2 rounded transition bg-white-light text-dark hover:text-white hover:bg-primary dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary disabled:opacity-50"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Prev
                            </button>
                        </li>
                        {Array.from({ length: Math.min(data.meta.last_page, 5) }, (_, i) => i + 1).map((p) => (
                            <li key={p}>
                                <button
                                    type="button"
                                    className={`flex justify-center font-semibold px-3.5 py-2 rounded transition ${
                                        p === page
                                            ? 'bg-primary text-white'
                                            : 'bg-white-light text-dark hover:text-white hover:bg-primary dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary'
                                    }`}
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </button>
                            </li>
                        ))}
                        <li>
                            <button
                                type="button"
                                className="flex justify-center font-semibold px-3.5 py-2 rounded transition bg-white-light text-dark hover:text-white hover:bg-primary dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary disabled:opacity-50"
                                disabled={page === data.meta.last_page}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </button>
                        </li>
                    </ul>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add Customer'}>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name">Name *</label>
                            <input
                                id="name"
                                type="text"
                                className="form-input"
                                placeholder="Customer name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="phone">Phone</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    className="form-input"
                                    placeholder="Phone number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="Email address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="address">Address</label>
                            <textarea
                                id="address"
                                className="form-textarea"
                                rows={2}
                                placeholder="Address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="customer_type">Customer Type</label>
                                <select
                                    id="customer_type"
                                    className="form-select"
                                    value={formData.customer_type}
                                    onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as any })}
                                >
                                    <option value="individual">Individual</option>
                                    <option value="business">Business</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="credit_limit">Credit Limit</label>
                                <input
                                    id="credit_limit"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="form-input"
                                    value={formData.credit_limit}
                                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isCreating || isUpdating}>
                            {(isCreating || isUpdating) && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            {editingCustomer ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Customer"
                message="Are you sure you want to delete this customer? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default CustomersIndex;
