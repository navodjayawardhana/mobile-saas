import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetPurchaseOrdersQuery, useGetAllSuppliersQuery } from '../../store/api/suppliersApi';
import { useCurrency } from '../../hooks/useCurrency';

const PurchaseOrdersIndex = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [status, setStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { data, isLoading } = useGetPurchaseOrdersQuery({
        page,
        search,
        supplier_id: supplierId || undefined,
        status: status || undefined,
        payment_status: paymentStatus || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
    });
    const { data: suppliersData } = useGetAllSuppliersQuery();
    const { formatCurrency } = useCurrency();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { class: string; label: string }> = {
            pending: { class: 'badge bg-warning', label: 'Pending' },
            partial: { class: 'badge bg-info', label: 'Partial' },
            received: { class: 'badge bg-success', label: 'Received' },
            cancelled: { class: 'badge bg-danger', label: 'Cancelled' },
        };
        return statusMap[status] || { class: 'badge bg-secondary', label: status };
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusMap: Record<string, { class: string; label: string }> = {
            unpaid: { class: 'badge bg-danger', label: 'Unpaid' },
            partial: { class: 'badge bg-warning', label: 'Partial' },
            paid: { class: 'badge bg-success', label: 'Paid' },
        };
        return statusMap[status] || { class: 'badge bg-secondary', label: status };
    };

    const clearFilters = () => {
        setSearch('');
        setSupplierId('');
        setStatus('');
        setPaymentStatus('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="panel">
            <div className="flex flex-col md:flex-row items-center justify-between mb-5 gap-4">
                <h5 className="text-lg font-semibold dark:text-white-light">Purchase Orders</h5>
                <div className="flex gap-2">
                    <Link to="/purchase-orders/pending" className="btn btn-outline-warning">
                        <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Pending
                    </Link>
                    <Link to="/purchase-orders/create" className="btn btn-primary">
                        <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        New Purchase Order
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-5">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search PO number..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
                <select
                    className="form-select"
                    value={supplierId}
                    onChange={(e) => {
                        setSupplierId(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Suppliers</option>
                    {suppliersData?.suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                        </option>
                    ))}
                </select>
                <select
                    className="form-select"
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select
                    className="form-select"
                    value={paymentStatus}
                    onChange={(e) => {
                        setPaymentStatus(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Payment Status</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                </select>
                <input
                    type="date"
                    className="form-input"
                    placeholder="From Date"
                    value={dateFrom}
                    onChange={(e) => {
                        setDateFrom(e.target.value);
                        setPage(1);
                    }}
                />
                <input
                    type="date"
                    className="form-input"
                    placeholder="To Date"
                    value={dateTo}
                    onChange={(e) => {
                        setDateTo(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            {(search || supplierId || status || paymentStatus || dateFrom || dateTo) && (
                <div className="mb-4">
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={clearFilters}>
                        Clear Filters
                    </button>
                </div>
            )}

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>PO Number</th>
                            <th>Supplier</th>
                            <th>Order Date</th>
                            <th>Expected Date</th>
                            <th>Total Amount</th>
                            <th>Paid</th>
                            <th>Due</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.purchase_orders.map((po) => {
                            const statusInfo = getStatusBadge(po.status);
                            const paymentInfo = getPaymentStatusBadge(po.payment_status);
                            return (
                                <tr key={po.id}>
                                    <td className="font-semibold">{po.po_number}</td>
                                    <td>
                                        <Link to={`/suppliers/${po.supplier?.id}`} className="text-primary hover:underline">
                                            {po.supplier?.name}
                                        </Link>
                                    </td>
                                    <td>{formatDate(po.order_date)}</td>
                                    <td>{po.expected_date ? formatDate(po.expected_date) : '-'}</td>
                                    <td className="font-semibold">{formatCurrency(po.total_amount)}</td>
                                    <td className="text-success">{formatCurrency(po.paid_amount)}</td>
                                    <td className={po.due_amount > 0 ? 'text-danger font-semibold' : ''}>{formatCurrency(po.due_amount)}</td>
                                    <td>
                                        <span className={statusInfo.class}>{statusInfo.label}</span>
                                    </td>
                                    <td>
                                        <span className={paymentInfo.class}>{paymentInfo.label}</span>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link to={`/purchase-orders/${po.id}`} className="btn btn-sm btn-outline-primary">
                                                View
                                            </Link>
                                            {po.status === 'pending' || po.status === 'partial' ? (
                                                <Link to={`/purchase-orders/${po.id}/receive`} className="btn btn-sm btn-outline-success">
                                                    Receive
                                                </Link>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {data?.purchase_orders.length === 0 && <div className="text-center py-10 text-gray-500">No purchase orders found.</div>}

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
    );
};

export default PurchaseOrdersIndex;
