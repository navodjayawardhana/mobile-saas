import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSalesQuery, useVoidSaleMutation } from '../../../store/api/salesApi';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import Modal from '../../../components/Common/Modal';
import { useCurrency } from '../../../hooks/useCurrency';

const SalesIndex = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { data, isLoading } = useGetSalesQuery({
        page,
        search,
        payment_status: paymentStatus || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
    });
    const [voidSale, { isLoading: isVoiding }] = useVoidSaleMutation();

    const [isVoidOpen, setIsVoidOpen] = useState(false);
    const [voidingId, setVoidingId] = useState<string | null>(null);
    const [voidReason, setVoidReason] = useState('');
    const [error, setError] = useState('');

    const { formatCurrency } = useCurrency();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return 'badge bg-success';
            case 'partial':
                return 'badge bg-warning';
            case 'unpaid':
                return 'badge bg-danger';
            case 'voided':
                return 'badge bg-dark';
            default:
                return 'badge bg-secondary';
        }
    };

    const handleVoid = async () => {
        if (!voidingId || !voidReason.trim()) return;
        try {
            await voidSale({ id: voidingId, reason: voidReason }).unwrap();
            setIsVoidOpen(false);
            setVoidingId(null);
            setVoidReason('');
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot void sale');
        }
    };

    const clearFilters = () => {
        setSearch('');
        setPaymentStatus('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="panel">
            <div className="flex flex-col md:flex-row items-center justify-between mb-5 gap-4">
                <h5 className="text-lg font-semibold dark:text-white-light">Sales</h5>
                <Link to="/sales/pos" className="btn btn-primary">
                    <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    Open POS
                </Link>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search invoice, customer..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
                <select
                    className="form-select"
                    value={paymentStatus}
                    onChange={(e) => {
                        setPaymentStatus(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="voided">Voided</option>
                </select>
                <input
                    type="date"
                    className="form-input"
                    value={dateFrom}
                    onChange={(e) => {
                        setDateFrom(e.target.value);
                        setPage(1);
                    }}
                />
                <input
                    type="date"
                    className="form-input"
                    value={dateTo}
                    onChange={(e) => {
                        setDateTo(e.target.value);
                        setPage(1);
                    }}
                />
                <button type="button" className="btn btn-outline-dark" onClick={clearFilters}>
                    Clear
                </button>
            </div>

            {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Paid</th>
                            <th>Due</th>
                            <th>Status</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.sales.map((sale) => (
                            <tr key={sale.id} className={sale.payment_status === 'voided' ? 'opacity-50' : ''}>
                                <td>
                                    <Link to={`/sales/${sale.id}`} className="text-primary hover:underline font-medium">
                                        {sale.invoice_number}
                                    </Link>
                                </td>
                                <td className="whitespace-nowrap">{formatDate(sale.sale_date)}</td>
                                <td>
                                    {sale.customer ? (
                                        <div>
                                            <p className="font-medium">{sale.customer.name}</p>
                                            {sale.customer.phone && <p className="text-xs text-gray-500">{sale.customer.phone}</p>}
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">Walk-in</span>
                                    )}
                                </td>
                                <td className="font-semibold">{formatCurrency(sale.total_amount)}</td>
                                <td className="text-success">{formatCurrency(sale.paid_amount)}</td>
                                <td className={sale.due_amount > 0 ? 'text-danger font-bold' : ''}>
                                    {formatCurrency(sale.due_amount)}
                                </td>
                                <td>
                                    <span className={getStatusBadge(sale.payment_status)}>
                                        {sale.payment_status.charAt(0).toUpperCase() + sale.payment_status.slice(1)}
                                    </span>
                                </td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Link
                                            to={`/sales/${sale.id}`}
                                            className="btn btn-sm btn-outline-info"
                                        >
                                            View
                                        </Link>
                                        {sale.payment_status !== 'voided' && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => {
                                                    setVoidingId(sale.id);
                                                    setIsVoidOpen(true);
                                                    setError('');
                                                }}
                                            >
                                                Void
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data?.sales.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    No sales found.
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

            {/* Void Modal */}
            <Modal isOpen={isVoidOpen} onClose={() => setIsVoidOpen(false)} title="Void Sale">
                <div className="space-y-4">
                    <p className="text-danger">
                        This will void the sale and restore all stock. This action cannot be undone.
                    </p>
                    <div>
                        <label htmlFor="void_reason">Reason for voiding *</label>
                        <textarea
                            id="void_reason"
                            className="form-textarea"
                            rows={3}
                            placeholder="Enter reason..."
                            value={voidReason}
                            onChange={(e) => setVoidReason(e.target.value)}
                            required
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsVoidOpen(false)}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleVoid}
                            disabled={isVoiding || !voidReason.trim()}
                        >
                            {isVoiding && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            Void Sale
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SalesIndex;
