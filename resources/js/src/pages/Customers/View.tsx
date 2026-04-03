import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    useGetCustomerQuery,
    useGetCustomerPurchasesQuery,
    useGetCustomerDuesQuery,
    useUpdateCustomerMutation,
} from '../../store/api/salesApi';
import Modal from '../../components/Common/Modal';
import { showToast } from '../../utils/toast';
import { useCurrency } from '../../hooks/useCurrency';

const CustomerView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: customerData, isLoading } = useGetCustomerQuery(id!);
    const { data: purchasesData } = useGetCustomerPurchasesQuery({ id: id!, page: 1 });
    const { data: duesData } = useGetCustomerDuesQuery(id!);
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        customer_type: 'individual' as string,
        credit_limit: '0',
    });

    const customer = customerData?.customer;
    const { formatCurrency } = useCurrency();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const openEditModal = () => {
        if (customer) {
            setFormData({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                customer_type: customer.customer_type,
                credit_limit: customer.credit_limit.toString(),
            });
            setIsEditModalOpen(true);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateCustomer({
                id: id!,
                data: {
                    name: formData.name,
                    email: formData.email || undefined,
                    phone: formData.phone || undefined,
                    address: formData.address || undefined,
                    customer_type: formData.customer_type as any,
                    credit_limit: parseFloat(formData.credit_limit) || 0,
                },
            }).unwrap();
            setIsEditModalOpen(false);
            showToast.success('Customer updated successfully');
        } catch (err: any) {
            showToast.error(err?.data?.message || 'Failed to update customer');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="panel">
                <div className="text-center py-10">
                    <h2 className="text-xl font-semibold text-danger">Customer Not Found</h2>
                    <p className="text-gray-500 mt-2">The customer you're looking for doesn't exist.</p>
                    <Link to="/customers" className="btn btn-primary mt-4">
                        Back to Customers
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="btn btn-outline-dark btn-sm"
                        onClick={() => navigate('/customers')}
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-2xl font-bold">{customer.name}</h1>
                    <span className={`badge ${customer.customer_type === 'business' ? 'bg-primary' : 'bg-info'}`}>
                        {customer.customer_type === 'business' ? 'Business' : 'Individual'}
                    </span>
                </div>
                <button type="button" className="btn btn-primary" onClick={openEditModal}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Customer
                </button>
            </div>

            {/* Customer Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="panel">
                    <div className="text-gray-500 text-sm">Total Purchases</div>
                    <div className="text-2xl font-bold text-primary mt-1">{formatCurrency(customer.total_purchases)}</div>
                </div>
                <div className="panel">
                    <div className="text-gray-500 text-sm">Outstanding Dues</div>
                    <div className={`text-2xl font-bold mt-1 ${customer.total_due > 0 ? 'text-danger' : 'text-success'}`}>
                        {formatCurrency(customer.total_due)}
                    </div>
                </div>
                <div className="panel">
                    <div className="text-gray-500 text-sm">Credit Limit</div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(customer.credit_limit)}</div>
                </div>
                <div className="panel">
                    <div className="text-gray-500 text-sm">Available Credit</div>
                    <div className="text-2xl font-bold text-info mt-1">
                        {formatCurrency(duesData?.available_credit || Math.max(0, customer.credit_limit - customer.total_due))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Contact Info */}
                <div className="panel">
                    <h5 className="font-semibold text-lg mb-4">Contact Information</h5>
                    <div className="space-y-3">
                        {customer.phone && (
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{customer.phone}</span>
                            </div>
                        )}
                        {customer.email && (
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{customer.email}</span>
                            </div>
                        )}
                        {customer.address && (
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{customer.address}</span>
                            </div>
                        )}
                        {!customer.phone && !customer.email && !customer.address && (
                            <p className="text-gray-500">No contact information available</p>
                        )}
                    </div>
                </div>

                {/* Unpaid Sales */}
                <div className="panel lg:col-span-2">
                    <h5 className="font-semibold text-lg mb-4">Unpaid Invoices</h5>
                    {duesData?.unpaid_sales && duesData.unpaid_sales.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table-striped">
                                <thead>
                                    <tr>
                                        <th>Invoice</th>
                                        <th>Date</th>
                                        <th>Total</th>
                                        <th>Paid</th>
                                        <th>Due</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {duesData.unpaid_sales.map((sale: any) => (
                                        <tr key={sale.id}>
                                            <td className="font-mono">{sale.invoice_number}</td>
                                            <td>{formatDate(sale.sale_date)}</td>
                                            <td>{formatCurrency(sale.total_amount)}</td>
                                            <td>{formatCurrency(sale.paid_amount)}</td>
                                            <td className="text-danger font-bold">{formatCurrency(sale.due_amount)}</td>
                                            <td>
                                                <Link to={`/sales/${sale.id}`} className="btn btn-sm btn-outline-primary">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No unpaid invoices</p>
                    )}
                </div>
            </div>

            {/* Purchase History */}
            <div className="panel">
                <h5 className="font-semibold text-lg mb-4">Purchase History</h5>
                {purchasesData?.sales && purchasesData.sales.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>Invoice</th>
                                    <th>Date</th>
                                    <th>Total</th>
                                    <th>Paid</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchasesData.sales.map((sale: any) => (
                                    <tr key={sale.id}>
                                        <td className="font-mono">{sale.invoice_number}</td>
                                        <td>{formatDate(sale.sale_date)}</td>
                                        <td className="font-semibold">{formatCurrency(sale.total_amount)}</td>
                                        <td>{formatCurrency(sale.paid_amount)}</td>
                                        <td>
                                            <span className={`badge ${
                                                sale.payment_status === 'paid' ? 'bg-success' :
                                                sale.payment_status === 'partial' ? 'bg-warning' :
                                                sale.payment_status === 'voided' ? 'bg-dark' : 'bg-danger'
                                            }`}>
                                                {sale.payment_status.charAt(0).toUpperCase() + sale.payment_status.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/sales/${sale.id}`} className="btn btn-sm btn-outline-info">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">No purchases yet</p>
                )}
            </div>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer">
                <form onSubmit={handleUpdate}>
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
                                    onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                                >
                                    <option value="individual">Individual</option>
                                    <option value="business">Business</option>
                                    <option value="regular">Regular</option>
                                    <option value="wholesale">Wholesale</option>
                                    <option value="vip">VIP</option>
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
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                            {isUpdating && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            Update
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CustomerView;
