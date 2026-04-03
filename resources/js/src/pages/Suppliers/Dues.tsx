import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSuppliersWithDuesQuery, useCreateSupplierPaymentMutation } from '../../store/api/suppliersApi';
import { useGetPaymentMethodsQuery } from '../../store/api/settingsApi';
import type { Supplier } from '../../store/api/suppliersApi';
import Modal from '../../components/Common/Modal';
import { useCurrency } from '../../hooks/useCurrency';

const SupplierDues = () => {
    const [page, setPage] = useState(1);
    const { data, isLoading, refetch } = useGetSuppliersWithDuesQuery({ page });
    const { data: paymentMethodsData } = useGetPaymentMethodsQuery({});
    const [createPayment, { isLoading: isCreatingPayment }] = useCreateSupplierPaymentMutation();
    const { formatCurrency } = useCurrency();

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        payment_method_id: '',
        reference_number: '',
        notes: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const openPaymentModal = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setPaymentForm({
            amount: supplier.total_due.toString(),
            payment_method_id: '',
            reference_number: '',
            notes: '',
        });
        setError('');
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplier) return;
        setError('');

        try {
            await createPayment({
                supplier_id: selectedSupplier.id,
                amount: parseFloat(paymentForm.amount),
                payment_method_id: paymentForm.payment_method_id,
                reference_number: paymentForm.reference_number || undefined,
                notes: paymentForm.notes || undefined,
            }).unwrap();
            setIsPaymentModalOpen(false);
            setSuccess(`Payment of ${formatCurrency(parseFloat(paymentForm.amount))} recorded for ${selectedSupplier.name}`);
            setTimeout(() => setSuccess(''), 5000);
            refetch();
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to record payment');
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
                        <h5 className="text-lg font-semibold dark:text-white-light">Supplier Dues</h5>
                        <p className="text-gray-500">Track and manage outstanding payments to suppliers</p>
                    </div>
                    <Link to="/suppliers" className="btn btn-outline-primary">
                        <svg className="w-4 h-4 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Suppliers
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="panel bg-danger text-white">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm opacity-80">Total Outstanding Dues</p>
                            <h3 className="text-2xl font-bold mt-1">{formatCurrency(data?.summary?.total_dues_amount || 0)}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-white/30 flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="panel bg-warning text-white">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm opacity-80">Suppliers with Dues</p>
                            <h3 className="text-2xl font-bold mt-1">{data?.summary?.total_suppliers_with_dues || 0}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-white/30 flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="panel bg-info text-white">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm opacity-80">Average Due</p>
                            <h3 className="text-2xl font-bold mt-1">
                                {data?.summary?.total_suppliers_with_dues
                                    ? formatCurrency((data?.summary?.total_dues_amount || 0) / data.summary.total_suppliers_with_dues)
                                    : '$0.00'}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-white/30 flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {success && (
                <div className="bg-success-light text-success p-4 rounded flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {success}
                </div>
            )}

            {/* Suppliers List */}
            <div className="panel">
                <div className="table-responsive">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>Supplier</th>
                                <th>Contact</th>
                                <th>Total Purchases</th>
                                <th>Outstanding Dues</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.suppliers.map((supplier) => (
                                <tr key={supplier.id}>
                                    <td>
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-danger text-white flex items-center justify-center mr-3 text-sm font-bold">
                                                {supplier.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="font-semibold">{supplier.name}</span>
                                                {supplier.contact_person && <p className="text-xs text-gray-500">{supplier.contact_person}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {supplier.phone && <p>{supplier.phone}</p>}
                                        {supplier.email && <p className="text-xs text-gray-500">{supplier.email}</p>}
                                    </td>
                                    <td className="font-semibold">{formatCurrency(supplier.total_purchases)}</td>
                                    <td>
                                        <span className="text-danger font-bold text-lg">{formatCurrency(supplier.total_due)}</span>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link to={`/suppliers/${supplier.id}`} className="btn btn-sm btn-outline-info">
                                                View
                                            </Link>
                                            <button type="button" className="btn btn-sm btn-success" onClick={() => openPaymentModal(supplier)}>
                                                <svg className="w-4 h-4 ltr:mr-1 rtl:ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                                </svg>
                                                Pay
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data?.suppliers.length === 0 && (
                    <div className="text-center py-10">
                        <svg className="w-16 h-16 mx-auto text-success mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <p className="text-lg font-semibold text-success">All payments are up to date!</p>
                        <p className="text-gray-500">No outstanding dues to suppliers.</p>
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
            </div>

            {/* Payment Modal */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Payment">
                <form onSubmit={handlePaymentSubmit}>
                    {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

                    {selectedSupplier && (
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded mb-4">
                            <p className="font-semibold">{selectedSupplier.name}</p>
                            <p className="text-sm text-gray-500">Outstanding: {formatCurrency(selectedSupplier.total_due)}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="amount">Amount *</label>
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={selectedSupplier?.total_due}
                                className="form-input"
                                placeholder="Payment amount"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                required
                            />
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

export default SupplierDues;
