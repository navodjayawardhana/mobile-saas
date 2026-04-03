import { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useGetSaleQuery, useLazyGetSaleInvoiceQuery } from '../../../store/api/salesApi';
import ThermalReceipt from '../../../components/Sales/ThermalReceipt';
import { useCurrency } from '../../../hooks/useCurrency';

const SalesView = () => {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading, error } = useGetSaleQuery(id!);
    const [getInvoice, { data: invoiceData }] = useLazyGetSaleInvoiceQuery();

    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
    });

    const { formatCurrency } = useCurrency();

    const handlePrintReceipt = async () => {
        await getInvoice(id!).unwrap();
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !data?.sale) {
        return (
            <div className="panel">
                <div className="text-center py-10">
                    <svg className="w-16 h-16 mx-auto mb-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-2">Sale Not Found</h3>
                    <p className="text-gray-500 mb-4">The sale you're looking for doesn't exist or has been deleted.</p>
                    <Link to="/sales" className="btn btn-primary">
                        Back to Sales
                    </Link>
                </div>
            </div>
        );
    }

    const sale = data.sale;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="panel">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold">{sale.invoice_number}</h2>
                            <span className={getStatusBadge(sale.payment_status)}>
                                {sale.payment_status.charAt(0).toUpperCase() + sale.payment_status.slice(1)}
                            </span>
                        </div>
                        <p className="text-gray-500 mt-1">{formatDate(sale.sale_date)}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={handlePrintReceipt}
                        >
                            <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Receipt
                        </button>
                        <Link to="/sales" className="btn btn-outline-dark">
                            Back to Sales
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sale Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="panel">
                        <h5 className="text-lg font-semibold mb-4">Items</h5>
                        <div className="table-responsive">
                            <table className="table-striped">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-right">Unit Price</th>
                                        <th className="text-right">Discount</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.items?.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div>
                                                    <p className="font-medium">{item.product?.name}</p>
                                                    <p className="text-xs text-gray-500">{item.product?.sku}</p>
                                                    {item.inventory_item?.serial_number && (
                                                        <p className="text-xs text-info">IMEI: {item.inventory_item.serial_number}</p>
                                                    )}
                                                    {item.warranty_months && (
                                                        <p className="text-xs text-success">
                                                            Warranty: {item.warranty_months} months
                                                            {item.warranty_expires_at && ` (expires ${new Date(item.warranty_expires_at).toLocaleDateString()})`}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-right">{formatCurrency(item.unit_price)}</td>
                                            <td className="text-right text-danger">
                                                {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : '-'}
                                            </td>
                                            <td className="text-right font-semibold">{formatCurrency(item.total_price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payments */}
                    {sale.payments && sale.payments.length > 0 && (
                        <div className="panel">
                            <h5 className="text-lg font-semibold mb-4">Payments</h5>
                            <div className="table-responsive">
                                <table className="table-striped">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Method</th>
                                            <th>Reference</th>
                                            <th className="text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.payments.map((payment) => (
                                            <tr key={payment.id}>
                                                <td>{formatDate(payment.payment_date)}</td>
                                                <td>{payment.payment_method?.name}</td>
                                                <td>{payment.reference_number || '-'}</td>
                                                <td className="text-right font-semibold text-success">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {sale.notes && (
                        <div className="panel">
                            <h5 className="text-lg font-semibold mb-4">Notes</h5>
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{sale.notes}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="panel">
                        <h5 className="text-lg font-semibold mb-4">Summary</h5>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal</span>
                                <span>{formatCurrency(sale.subtotal)}</span>
                            </div>
                            {sale.discount_amount > 0 && (
                                <div className="flex justify-between text-danger">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(sale.discount_amount)}</span>
                                </div>
                            )}
                            {sale.tax_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tax</span>
                                    <span>{formatCurrency(sale.tax_amount)}</span>
                                </div>
                            )}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span className="text-primary">{formatCurrency(sale.total_amount)}</span>
                            </div>
                            <div className="flex justify-between text-success">
                                <span>Paid</span>
                                <span>{formatCurrency(sale.paid_amount)}</span>
                            </div>
                            {sale.due_amount > 0 && (
                                <div className="flex justify-between text-danger font-semibold">
                                    <span>Due</span>
                                    <span>{formatCurrency(sale.due_amount)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer */}
                    <div className="panel">
                        <h5 className="text-lg font-semibold mb-4">Customer</h5>
                        {sale.customer ? (
                            <div className="space-y-2">
                                <p className="font-medium text-lg">{sale.customer.name}</p>
                                {sale.customer.phone && (
                                    <p className="text-gray-500 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {sale.customer.phone}
                                    </p>
                                )}
                                {sale.customer.email && (
                                    <p className="text-gray-500 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {sale.customer.email}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500">Walk-in Customer</p>
                        )}
                    </div>

                    {/* Cashier */}
                    <div className="panel">
                        <h5 className="text-lg font-semibold mb-4">Cashier</h5>
                        <p className="font-medium">{sale.user?.name}</p>
                    </div>
                </div>
            </div>

            {/* Hidden Receipt for Printing */}
            <div style={{ display: 'none' }}>
                <div ref={receiptRef}>
                    {invoiceData && <ThermalReceipt data={invoiceData} />}
                </div>
            </div>
        </div>
    );
};

export default SalesView;
