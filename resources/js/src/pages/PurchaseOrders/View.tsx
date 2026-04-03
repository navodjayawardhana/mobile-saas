import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    useGetPurchaseOrderQuery,
    useReceivePurchaseOrderItemsMutation,
    useAddPurchaseOrderPaymentMutation,
    useCancelPurchaseOrderMutation,
} from '../../store/api/suppliersApi';
import { useGetPaymentMethodsQuery } from '../../store/api/settingsApi';
import Modal from '../../components/Common/Modal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { useCurrency } from '../../hooks/useCurrency';

interface ReceiveItem {
    item_id: string;
    quantity_received: number;
    max_quantity: number;
    product_name: string;
    is_serialized: boolean;
    serial_numbers: {
        serial_number: string;
        cost_price: number;
        condition: 'new' | 'used' | 'refurbished';
    }[];
}

const PurchaseOrderView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data, isLoading, refetch } = useGetPurchaseOrderQuery(id!);
    const { data: paymentMethodsData } = useGetPaymentMethodsQuery({});
    const [receiveItems, { isLoading: isReceiving }] = useReceivePurchaseOrderItemsMutation();
    const [addPayment, { isLoading: isAddingPayment }] = useAddPurchaseOrderPaymentMutation();
    const [cancelOrder, { isLoading: isCancelling }] = useCancelPurchaseOrderMutation();

    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [receiveItemsList, setReceiveItemsList] = useState<ReceiveItem[]>([]);
    const [cancelReason, setCancelReason] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        payment_method_id: '',
        reference_number: '',
        notes: '',
    });

    const { formatCurrency } = useCurrency();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { class: string; label: string }> = {
            pending: { class: 'badge badge-lg bg-warning', label: 'Pending' },
            partial: { class: 'badge badge-lg bg-info', label: 'Partially Received' },
            received: { class: 'badge badge-lg bg-success', label: 'Fully Received' },
            cancelled: { class: 'badge badge-lg bg-danger', label: 'Cancelled' },
        };
        return statusMap[status] || { class: 'badge badge-lg bg-secondary', label: status };
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusMap: Record<string, { class: string; label: string }> = {
            unpaid: { class: 'badge badge-lg bg-danger', label: 'Unpaid' },
            partial: { class: 'badge badge-lg bg-warning', label: 'Partially Paid' },
            paid: { class: 'badge badge-lg bg-success', label: 'Fully Paid' },
        };
        return statusMap[status] || { class: 'badge badge-lg bg-secondary', label: status };
    };

    const openReceiveModal = () => {
        if (!data?.purchase_order.items) return;

        const items: ReceiveItem[] = data.purchase_order.items
            .filter((item) => item.quantity_received < item.quantity_ordered)
            .map((item) => ({
                item_id: item.id,
                quantity_received: item.quantity_ordered - item.quantity_received,
                max_quantity: item.quantity_ordered - item.quantity_received,
                product_name: item.product?.name || 'Unknown',
                is_serialized: item.product?.is_serialized || false,
                serial_numbers: [],
            }));

        if (items.length === 0) {
            setError('All items have already been received');
            return;
        }

        setReceiveItemsList(items);
        setError('');
        setIsReceiveModalOpen(true);
    };

    const updateReceiveQuantity = (index: number, quantity: number) => {
        const updated = [...receiveItemsList];
        updated[index].quantity_received = Math.min(quantity, updated[index].max_quantity);

        // If serialized, adjust serial numbers array
        if (updated[index].is_serialized) {
            const currentCount = updated[index].serial_numbers.length;
            if (quantity > currentCount) {
                for (let i = currentCount; i < quantity; i++) {
                    updated[index].serial_numbers.push({
                        serial_number: '',
                        cost_price: data?.purchase_order.items?.find((item) => item.id === updated[index].item_id)?.unit_cost || 0,
                        condition: 'new',
                    });
                }
            } else if (quantity < currentCount) {
                updated[index].serial_numbers = updated[index].serial_numbers.slice(0, quantity);
            }
        }

        setReceiveItemsList(updated);
    };

    const updateSerialNumber = (itemIndex: number, serialIndex: number, field: string, value: any) => {
        const updated = [...receiveItemsList];
        (updated[itemIndex].serial_numbers[serialIndex] as any)[field] = value;
        setReceiveItemsList(updated);
    };

    const handleReceiveSubmit = async () => {
        setError('');

        // Validate
        for (const item of receiveItemsList) {
            if (item.quantity_received <= 0) continue;
            if (item.is_serialized && item.serial_numbers.some((s) => !s.serial_number.trim())) {
                setError(`Please enter all serial numbers for ${item.product_name}`);
                return;
            }
        }

        const itemsToReceive = receiveItemsList
            .filter((item) => item.quantity_received > 0)
            .map((item) => ({
                item_id: item.item_id,
                quantity_received: item.quantity_received,
                serial_numbers: item.is_serialized ? item.serial_numbers : undefined,
            }));

        if (itemsToReceive.length === 0) {
            setError('Please specify at least one item to receive');
            return;
        }

        try {
            await receiveItems({
                id: id!,
                items: itemsToReceive,
            }).unwrap();
            setIsReceiveModalOpen(false);
            setSuccess('Items received successfully');
            setTimeout(() => setSuccess(''), 5000);
            refetch();
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to receive items');
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await addPayment({
                id: id!,
                amount: parseFloat(paymentForm.amount),
                payment_method_id: paymentForm.payment_method_id,
                reference_number: paymentForm.reference_number || undefined,
                notes: paymentForm.notes || undefined,
            }).unwrap();
            setIsPaymentModalOpen(false);
            setPaymentForm({ amount: '', payment_method_id: '', reference_number: '', notes: '' });
            setSuccess('Payment recorded successfully');
            setTimeout(() => setSuccess(''), 5000);
            refetch();
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to record payment');
        }
    };

    const handleCancel = async () => {
        if (!cancelReason.trim()) {
            setError('Please provide a reason for cancellation');
            return;
        }

        try {
            await cancelOrder({ id: id!, reason: cancelReason }).unwrap();
            setIsCancelDialogOpen(false);
            setSuccess('Purchase order cancelled');
            setTimeout(() => setSuccess(''), 5000);
            refetch();
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to cancel purchase order');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data?.purchase_order) {
        return (
            <div className="panel">
                <div className="text-center py-10 text-gray-500">Purchase order not found.</div>
            </div>
        );
    }

    const po = data.purchase_order;
    const statusInfo = getStatusBadge(po.status);
    const paymentInfo = getPaymentStatusBadge(po.payment_status);

    return (
        <div className="space-y-5">
            {success && (
                <div className="bg-success-light text-success p-4 rounded flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {success}
                </div>
            )}

            {/* Header */}
            <div className="panel">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <button type="button" className="btn btn-outline-primary btn-sm mb-3" onClick={() => navigate('/purchase-orders')}>
                            <svg className="w-4 h-4 ltr:mr-1 rtl:ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                        <h2 className="text-xl font-bold dark:text-white">Purchase Order #{po.po_number}</h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={statusInfo.class}>{statusInfo.label}</span>
                            <span className={paymentInfo.class}>{paymentInfo.label}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {po.status !== 'cancelled' && po.status !== 'received' && (
                            <button type="button" className="btn btn-success" onClick={openReceiveModal}>
                                <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Receive Items
                            </button>
                        )}
                        {po.status !== 'cancelled' && po.payment_status !== 'paid' && (
                            <button
                                type="button"
                                className="btn btn-info"
                                onClick={() => {
                                    setPaymentForm({ ...paymentForm, amount: po.due_amount.toString() });
                                    setIsPaymentModalOpen(true);
                                }}
                            >
                                <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                                Add Payment
                            </button>
                        )}
                        {po.status !== 'cancelled' && po.status !== 'received' && (
                            <button type="button" className="btn btn-danger" onClick={() => setIsCancelDialogOpen(true)}>
                                <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                Cancel Order
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="panel">
                    <h5 className="font-semibold text-lg mb-4">Supplier Details</h5>
                    <div className="space-y-3">
                        <div>
                            <span className="text-gray-500">Name:</span>
                            <Link to={`/suppliers/${po.supplier?.id}`} className="ml-2 text-primary font-semibold hover:underline">
                                {po.supplier?.name}
                            </Link>
                        </div>
                        {po.supplier?.phone && (
                            <div>
                                <span className="text-gray-500">Phone:</span>
                                <span className="ml-2">{po.supplier.phone}</span>
                            </div>
                        )}
                        {po.supplier?.email && (
                            <div>
                                <span className="text-gray-500">Email:</span>
                                <span className="ml-2">{po.supplier.email}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="panel">
                    <h5 className="font-semibold text-lg mb-4">Order Details</h5>
                    <div className="space-y-3">
                        <div>
                            <span className="text-gray-500">Order Date:</span>
                            <span className="ml-2">{formatDate(po.order_date)}</span>
                        </div>
                        {po.expected_date && (
                            <div>
                                <span className="text-gray-500">Expected Date:</span>
                                <span className="ml-2">{formatDate(po.expected_date)}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-gray-500">Created By:</span>
                            <span className="ml-2">{po.user?.name}</span>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <h5 className="font-semibold text-lg mb-4">Payment Summary</h5>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal:</span>
                            <span>{formatCurrency(po.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tax:</span>
                            <span>{formatCurrency(po.tax_amount)}</span>
                        </div>
                        <hr className="border-gray-200 dark:border-gray-700" />
                        <div className="flex justify-between">
                            <span className="font-semibold">Total:</span>
                            <span className="font-bold">{formatCurrency(po.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-success">
                            <span>Paid:</span>
                            <span>{formatCurrency(po.paid_amount)}</span>
                        </div>
                        <div className="flex justify-between text-danger">
                            <span className="font-semibold">Due:</span>
                            <span className="font-bold">{formatCurrency(po.due_amount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="panel">
                <h5 className="font-semibold text-lg mb-4">Order Items</h5>
                <div className="table-responsive">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Type</th>
                                <th>Ordered</th>
                                <th>Received</th>
                                <th>Pending</th>
                                <th>Unit Cost</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {po.items?.map((item) => (
                                <tr key={item.id}>
                                    <td className="font-semibold">{item.product?.name}</td>
                                    <td className="text-gray-500">{item.product?.sku}</td>
                                    <td>
                                        {item.product?.is_serialized ? (
                                            <span className="badge bg-info">Serialized</span>
                                        ) : (
                                            <span className="badge bg-secondary">Regular</span>
                                        )}
                                    </td>
                                    <td>{item.quantity_ordered}</td>
                                    <td className="text-success font-semibold">{item.quantity_received}</td>
                                    <td className={item.quantity_ordered - item.quantity_received > 0 ? 'text-warning font-semibold' : ''}>
                                        {item.quantity_ordered - item.quantity_received}
                                    </td>
                                    <td>{formatCurrency(item.unit_cost)}</td>
                                    <td className="font-semibold">{formatCurrency(item.total_cost)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes */}
            {po.notes && (
                <div className="panel">
                    <h5 className="font-semibold text-lg mb-4">Notes</h5>
                    <p className="whitespace-pre-wrap">{po.notes}</p>
                </div>
            )}

            {/* Receive Items Modal */}
            <Modal isOpen={isReceiveModalOpen} onClose={() => setIsReceiveModalOpen(false)} title="Receive Items" size="3xl">
                {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

                <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                    {receiveItemsList.map((item, index) => (
                        <div key={item.item_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h6 className="font-semibold">{item.product_name}</h6>
                                    <p className="text-sm text-gray-500">
                                        Max receivable: {item.max_quantity}
                                        {item.is_serialized && <span className="ml-2 badge bg-info">Serialized - IMEI Required</span>}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-500">Quantity:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={item.max_quantity}
                                        className="form-input w-24"
                                        value={item.quantity_received}
                                        onChange={(e) => updateReceiveQuantity(index, parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            {item.is_serialized && item.quantity_received > 0 && (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium">Enter Serial Numbers (IMEI):</p>
                                    {item.serial_numbers.map((serial, serialIndex) => (
                                        <div key={serialIndex} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                            <div>
                                                <label className="text-xs text-gray-500">Serial/IMEI #{serialIndex + 1}</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Enter serial number"
                                                    value={serial.serial_number}
                                                    onChange={(e) => updateSerialNumber(index, serialIndex, 'serial_number', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Cost Price</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className="form-input"
                                                    value={serial.cost_price}
                                                    onChange={(e) => updateSerialNumber(index, serialIndex, 'cost_price', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Condition</label>
                                                <select
                                                    className="form-select"
                                                    value={serial.condition}
                                                    onChange={(e) => updateSerialNumber(index, serialIndex, 'condition', e.target.value)}
                                                >
                                                    <option value="new">New</option>
                                                    <option value="used">Used</option>
                                                    <option value="refurbished">Refurbished</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button type="button" className="btn btn-outline-dark" onClick={() => setIsReceiveModalOpen(false)}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-success" onClick={handleReceiveSubmit} disabled={isReceiving}>
                        {isReceiving && (
                            <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>
                        )}
                        Confirm Receipt
                    </button>
                </div>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Add Payment">
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
                                max={po.due_amount}
                                className="form-input"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Outstanding: {formatCurrency(po.due_amount)}</p>
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
                                value={paymentForm.notes}
                                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsPaymentModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isAddingPayment}>
                            {isAddingPayment && (
                                <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>
                            )}
                            Record Payment
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Cancel Dialog */}
            <Modal isOpen={isCancelDialogOpen} onClose={() => setIsCancelDialogOpen(false)} title="Cancel Purchase Order">
                {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

                <p className="mb-4">
                    Are you sure you want to cancel this purchase order? Any received stock will be reversed. This action cannot be undone.
                </p>

                <div className="mb-4">
                    <label htmlFor="cancel_reason">Reason for Cancellation *</label>
                    <textarea
                        id="cancel_reason"
                        className="form-textarea"
                        rows={3}
                        placeholder="Please provide a reason..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        required
                    ></textarea>
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" className="btn btn-outline-dark" onClick={() => setIsCancelDialogOpen(false)}>
                        Keep Order
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleCancel} disabled={isCancelling || !cancelReason.trim()}>
                        {isCancelling && (
                            <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>
                        )}
                        Cancel Order
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default PurchaseOrderView;
