import { Link } from 'react-router-dom';
import { useGetPendingPurchaseOrdersQuery } from '../../store/api/suppliersApi';
import { useCurrency } from '../../hooks/useCurrency';

const PendingPurchaseOrders = () => {
    const { data, isLoading } = useGetPendingPurchaseOrdersQuery();
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
        };
        return statusMap[status] || { class: 'badge bg-secondary', label: status };
    };

    const isOverdue = (expectedDate: string | null) => {
        if (!expectedDate) return false;
        return new Date(expectedDate) < new Date();
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
                        <h5 className="text-lg font-semibold dark:text-white-light">Pending Purchase Orders</h5>
                        <p className="text-gray-500">Orders awaiting receipt of items</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/purchase-orders" className="btn btn-outline-primary">
                            <svg className="w-4 h-4 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            All Orders
                        </Link>
                        <Link to="/purchase-orders/create" className="btn btn-primary">
                            <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            New Order
                        </Link>
                    </div>
                </div>
            </div>

            {/* Summary Card */}
            <div className="panel bg-warning text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-lg opacity-80">Pending Orders</p>
                        <h2 className="text-4xl font-bold mt-2">{data?.count || 0}</h2>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="panel">
                {data?.purchase_orders && data.purchase_orders.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>PO Number</th>
                                    <th>Supplier</th>
                                    <th>Order Date</th>
                                    <th>Expected Date</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.purchase_orders.map((po) => {
                                    const overdue = isOverdue(po.expected_date);
                                    const statusInfo = getStatusBadge(po.status);
                                    return (
                                        <tr key={po.id} className={overdue ? 'bg-danger-light' : ''}>
                                            <td className="font-semibold">{po.po_number}</td>
                                            <td>
                                                <Link to={`/suppliers/${po.supplier?.id}`} className="text-primary hover:underline">
                                                    {po.supplier?.name}
                                                </Link>
                                            </td>
                                            <td>{formatDate(po.order_date)}</td>
                                            <td>
                                                {po.expected_date ? (
                                                    <span className={overdue ? 'text-danger font-bold' : ''}>
                                                        {formatDate(po.expected_date)}
                                                        {overdue && (
                                                            <span className="badge bg-danger ml-2">Overdue</span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="font-semibold">{formatCurrency(po.total_amount)}</td>
                                            <td>
                                                <span className={statusInfo.class}>{statusInfo.label}</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link to={`/purchase-orders/${po.id}`} className="btn btn-sm btn-outline-primary">
                                                        View
                                                    </Link>
                                                    <Link to={`/purchase-orders/${po.id}`} className="btn btn-sm btn-success">
                                                        <svg className="w-4 h-4 ltr:mr-1 rtl:ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Receive
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <svg className="w-16 h-16 mx-auto text-success mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <p className="text-lg font-semibold text-success">All caught up!</p>
                        <p className="text-gray-500">No pending purchase orders at the moment.</p>
                        <Link to="/purchase-orders/create" className="btn btn-primary mt-4">
                            Create New Order
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingPurchaseOrders;
