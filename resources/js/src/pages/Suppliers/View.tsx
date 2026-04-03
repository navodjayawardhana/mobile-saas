import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    useGetSupplierQuery,
    useGetSupplierPurchasesQuery,
    useGetSupplierPaymentsQuery,
    useGetSupplierDuesQuery,
    useCreateSupplierPaymentMutation,
} from '../../store/api/suppliersApi';
import { useGetPaymentMethodsQuery } from '../../store/api/settingsApi';
import Modal from '../../components/Common/Modal';
import { useCurrency } from '../../hooks/useCurrency';

const SupplierView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [purchasesPage, setPurchasesPage] = useState(1);
    const [paymentsPage, setPaymentsPage] = useState(1);

    const { data: supplierData, isLoading: loadingSupplier } = useGetSupplierQuery(id!);
    const { data: purchasesData, isLoading: loadingPurchases } = useGetSupplierPurchasesQuery({ id: id!, page: purchasesPage });
    const { data: paymentsData, isLoading: loadingPayments } = useGetSupplierPaymentsQuery({ id: id!, page: paymentsPage });
    const { data: duesData, isLoading: loadingDues } = useGetSupplierDuesQuery(id!);
    const { data: paymentMethodsData } = useGetPaymentMethodsQuery({});

    const [createPayment, { isLoading: isCreatingPayment }] = useCreateSupplierPaymentMutation();

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        payment_method_id: '',
        reference_number: '',
        notes: '',
    });
    const [error, setError] = useState('');

    const { formatCurrency } = useCurrency();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, string> = {
            pending: 'badge bg-warning',
            partial: 'badge bg-info',
            received: 'badge bg-success',
            cancelled: 'badge bg-danger',
        };
        return statusMap[status] || 'badge bg-secondary';
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusMap: Record<string, string> = {
            unpaid: 'badge bg-danger',
            partial: 'badge bg-warning',
            paid: 'badge bg-success',
        };
        return statusMap[status] || 'badge bg-secondary';
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await createPayment({
                supplier_id: id!,
                amount: parseFloat(paymentForm.amount),
                payment_method_id: paymentForm.payment_method_id,
                reference_number: paymentForm.reference_number || undefined,
                notes: paymentForm.notes || undefined,
            }).unwrap();
            setIsPaymentModalOpen(false);
            setPaymentForm({ amount: '', payment_method_id: '', reference_number: '', notes: '' });
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to record payment');
        }
    };

    if (loadingSupplier) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!supplierData?.supplier) {
        return (
            <div className="panel">
                <div className="text-center py-10 text-gray-500">Supplier not found.</div>
            </div>
        );
    }

    const supplier = supplierData.supplier;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="panel">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => navigate('/suppliers')}>
                            <svg className="w-4 h-4 ltr:mr-1 rtl:ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                        <div className="flex items-center">
                            <div className="w-16 h-16 rounded-full bg-secondary text-white flex items-center justify-center text-2xl font-bold">
                                {supplier.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                                <h2 className="text-xl font-bold dark:text-white">{supplier.name}</h2>
                                <p className="text-gray-500">{supplier.contact_person || 'No contact person'}</p>
                                <span className={`badge ${supplier.is_active ? 'bg-success' : 'bg-danger'} mt-1`}>
                                    {supplier.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to={`/purchase-orders/create?supplier=${id}`} className="btn btn-primary">
                            <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            New Purchase Order
                        </Link>
                        {supplier.total_due > 0 && (
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => {
                                    setPaymentForm({
                                        amount: supplier.total_due.toString(),
                                        payment_method_id: '',
                                        reference_number: '',
                                        notes: '',
                                    });
                                    setIsPaymentModalOpen(true);
                                }}
                            >
                                <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                                Record Payment
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="panel bg-gradient-to-r from-blue-500 to-blue-400 text-white">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm opacity-80">Total Purchases</p>
                            <h3 className="text-2xl font-bold mt-1">{formatCurrency(supplier.total_purchases)}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-white/30 flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className={`panel ${supplier.total_due > 0 ? 'bg-gradient-to-r from-danger to-danger-light' : 'bg-gradient-to-r from-success to-success-light'} text-white`}>
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm opacity-80">Outstanding Dues</p>
                            <h3 className="text-2xl font-bold mt-1">{formatCurrency(supplier.total_due)}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-white/30 flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-purple-500 to-purple-400 text-white">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm opacity-80">Total Orders</p>
                            <h3 className="text-2xl font-bold mt-1">{purchasesData?.meta?.total || 0}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-white/30 flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="panel">
                <ul className="flex flex-wrap border-b border-[#ebedf2] dark:border-[#191e3a] mb-5">
                    <li>
                        <button
                            type="button"
                            className={`-mb-[1px] block border border-transparent p-3.5 py-2 hover:text-primary ${
                                activeTab === 'overview' ? 'border-b-white text-primary dark:border-b-black' : ''
                            }`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className={`-mb-[1px] block border border-transparent p-3.5 py-2 hover:text-primary ${
                                activeTab === 'purchases' ? 'border-b-white text-primary dark:border-b-black' : ''
                            }`}
                            onClick={() => setActiveTab('purchases')}
                        >
                            Purchase Orders ({purchasesData?.meta?.total || 0})
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className={`-mb-[1px] block border border-transparent p-3.5 py-2 hover:text-primary ${
                                activeTab === 'payments' ? 'border-b-white text-primary dark:border-b-black' : ''
                            }`}
                            onClick={() => setActiveTab('payments')}
                        >
                            Payments ({paymentsData?.meta?.total || 0})
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className={`-mb-[1px] block border border-transparent p-3.5 py-2 hover:text-primary ${
                                activeTab === 'dues' ? 'border-b-white text-primary dark:border-b-black' : ''
                            }`}
                            onClick={() => setActiveTab('dues')}
                        >
                            Dues ({duesData?.unpaid_orders?.length || 0})
                        </button>
                    </li>
                </ul>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h5 className="text-lg font-semibold mb-4">Contact Information</h5>
                            <div className="space-y-3">
                                <div className="flex">
                                    <span className="text-gray-500 w-32">Contact Person:</span>
                                    <span className="font-medium">{supplier.contact_person || '-'}</span>
                                </div>
                                <div className="flex">
                                    <span className="text-gray-500 w-32">Phone:</span>
                                    <span className="font-medium">{supplier.phone || '-'}</span>
                                </div>
                                <div className="flex">
                                    <span className="text-gray-500 w-32">Email:</span>
                                    <span className="font-medium">{supplier.email || '-'}</span>
                                </div>
                                <div className="flex">
                                    <span className="text-gray-500 w-32">Address:</span>
                                    <span className="font-medium">{supplier.address || '-'}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h5 className="text-lg font-semibold mb-4">Business Information</h5>
                            <div className="space-y-3">
                                <div className="flex">
                                    <span className="text-gray-500 w-32">Payment Terms:</span>
                                    <span className="font-medium">{supplier.payment_terms || 'Not specified'}</span>
                                </div>
                                <div className="flex">
                                    <span className="text-gray-500 w-32">Status:</span>
                                    <span className={`badge ${supplier.is_active ? 'bg-success' : 'bg-danger'}`}>
                                        {supplier.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex">
                                    <span className="text-gray-500 w-32">Created:</span>
                                    <span className="font-medium">{formatDate(supplier.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Purchases Tab */}
                {activeTab === 'purchases' && (
                    <div>
                        {loadingPurchases ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <>
                                <div className="table-responsive">
                                    <table className="table-striped">
                                        <thead>
                                            <tr>
                                                <th>PO Number</th>
                                                <th>Order Date</th>
                                                <th>Total Amount</th>
                                                <th>Paid</th>
                                                <th>Due</th>
                                                <th>Status</th>
                                                <th>Payment</th>
                                                <th className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchasesData?.purchase_orders.map((po) => (
                                                <tr key={po.id}>
                                                    <td className="font-semibold">{po.po_number}</td>
                                                    <td>{formatDate(po.order_date)}</td>
                                                    <td className="font-semibold">{formatCurrency(po.total_amount)}</td>
                                                    <td className="text-success">{formatCurrency(po.paid_amount)}</td>
                                                    <td className={po.due_amount > 0 ? 'text-danger font-semibold' : ''}>{formatCurrency(po.due_amount)}</td>
                                                    <td>
                                                        <span className={getStatusBadge(po.status)}>{po.status}</span>
                                                    </td>
                                                    <td>
                                                        <span className={getPaymentStatusBadge(po.payment_status)}>{po.payment_status}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <Link to={`/purchase-orders/${po.id}`} className="btn btn-sm btn-outline-primary">
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {purchasesData?.purchase_orders.length === 0 && (
                                    <div className="text-center py-10 text-gray-500">No purchase orders found.</div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                    <div>
                        {loadingPayments ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <>
                                <div className="table-responsive">
                                    <table className="table-striped">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Amount</th>
                                                <th>Payment Method</th>
                                                <th>Reference</th>
                                                <th>Recorded By</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paymentsData?.payments.map((payment) => (
                                                <tr key={payment.id}>
                                                    <td>{formatDate(payment.payment_date)}</td>
                                                    <td className="font-semibold text-success">{formatCurrency(payment.amount)}</td>
                                                    <td>{payment.payment_method?.name || '-'}</td>
                                                    <td>{payment.reference_number || '-'}</td>
                                                    <td>{payment.user?.name || '-'}</td>
                                                    <td>{payment.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {paymentsData?.payments.length === 0 && (
                                    <div className="text-center py-10 text-gray-500">No payments recorded.</div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Dues Tab */}
                {activeTab === 'dues' && (
                    <div>
                        {loadingDues ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-gray-500 text-sm">Total Due</p>
                                            <p className="text-xl font-bold text-danger">{formatCurrency(duesData?.total_due || 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-sm">Total Purchases</p>
                                            <p className="text-xl font-bold">{formatCurrency(duesData?.total_purchases || 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-sm">Unpaid Orders</p>
                                            <p className="text-xl font-bold">{duesData?.unpaid_orders?.length || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="table-responsive">
                                    <table className="table-striped">
                                        <thead>
                                            <tr>
                                                <th>PO Number</th>
                                                <th>Order Date</th>
                                                <th>Total Amount</th>
                                                <th>Paid</th>
                                                <th>Due</th>
                                                <th className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {duesData?.unpaid_orders?.map((order) => (
                                                <tr key={order.id}>
                                                    <td className="font-semibold">{order.po_number}</td>
                                                    <td>{formatDate(order.order_date)}</td>
                                                    <td>{formatCurrency(order.total_amount)}</td>
                                                    <td className="text-success">{formatCurrency(order.paid_amount)}</td>
                                                    <td className="text-danger font-bold">{formatCurrency(order.due_amount)}</td>
                                                    <td className="text-center">
                                                        <Link to={`/purchase-orders/${order.id}`} className="btn btn-sm btn-outline-primary">
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {(!duesData?.unpaid_orders || duesData.unpaid_orders.length === 0) && (
                                    <div className="text-center py-10 text-success">
                                        <svg className="w-16 h-16 mx-auto mb-3 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        No outstanding dues. All payments are complete.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Payment">
                <form onSubmit={handlePaymentSubmit}>
                    {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="amount">Amount *</label>
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={supplier.total_due}
                                className="form-input"
                                placeholder="Payment amount"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Outstanding due: {formatCurrency(supplier.total_due)}</p>
                        </div>
                        <div>
                            <label htmlFor="payment_method">Payment Method *</label>
                            <select
                                id="payment_method"
                                className="form-select"
                                value={paymentForm.payment_method_id}
                                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method_id: e.target.value })}
                                required
                            >
                                <option value="">Select payment method</option>
                                {paymentMethodsData?.payment_methods.map((method) => (
                                    <option key={method.id} value={method.id}>
                                        {method.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="reference_number">Reference Number</label>
                            <input
                                id="reference_number"
                                type="text"
                                className="form-input"
                                placeholder="Check number, transaction ID, etc."
                                value={paymentForm.reference_number}
                                onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="notes">Notes</label>
                            <textarea
                                id="notes"
                                className="form-textarea"
                                rows={2}
                                placeholder="Additional notes"
                                value={paymentForm.notes}
                                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsPaymentModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-success" disabled={isCreatingPayment}>
                            {isCreatingPayment && (
                                <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>
                            )}
                            Record Payment
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SupplierView;
