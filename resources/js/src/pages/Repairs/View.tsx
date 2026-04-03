import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
    useGetRepairQuery,
    useUpdateRepairStatusMutation,
    useAddRepairItemMutation,
    useRemoveRepairItemMutation,
    useAddRepairPaymentMutation,
    useGetRepairStatusOptionsQuery,
    useGetTechniciansQuery,
    useLazyGetJobCardQuery,
} from '../../store/api/repairsApi';
import { useLazySearchProductsQuery } from '../../store/api/inventoryApi';
import { useGetPaymentMethodsQuery } from '../../store/api/settingsApi';
import Modal from '../../components/Common/Modal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import JobCardPrint from '../../components/Repair/JobCardPrint';
import { showToast } from '../../utils/toast';
import { useCurrency } from '../../hooks/useCurrency';

const RepairView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const jobCardRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, refetch } = useGetRepairQuery(id!);
    const { data: statusOptions } = useGetRepairStatusOptionsQuery();
    const { data: techniciansData } = useGetTechniciansQuery();
    const { data: paymentMethodsData } = useGetPaymentMethodsQuery({});
    const [getJobCard] = useLazyGetJobCardQuery();

    const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateRepairStatusMutation();
    const [addItem, { isLoading: isAddingItem }] = useAddRepairItemMutation();
    const [removeItem, { isLoading: isRemovingItem }] = useRemoveRepairItemMutation();
    const [addPayment, { isLoading: isAddingPayment }] = useAddRepairPaymentMutation();

    const [activeTab, setActiveTab] = useState('details');
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isRemoveItemOpen, setIsRemoveItemOpen] = useState(false);
    const [removingItemId, setRemovingItemId] = useState<string | null>(null);
    const [jobCardData, setJobCardData] = useState<any>(null);

    // Status form
    const [newStatus, setNewStatus] = useState('');
    const [statusNotes, setStatusNotes] = useState('');

    // Item form
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [searchProducts, { data: productsData }] = useLazySearchProductsQuery();
    const [itemForm, setItemForm] = useState({
        product_id: '',
        product_name: '',
        description: '',
        type: 'service' as 'part' | 'service' | 'other',
        quantity: 1,
        unit_price: 0,
    });

    // Payment form
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        payment_method_id: '',
        reference_number: '',
        notes: '',
    });

    const handlePrint = useReactToPrint({
        contentRef: jobCardRef,
    });

    const printJobCard = async () => {
        try {
            const result = await getJobCard(id!).unwrap();
            setJobCardData(result);
            setTimeout(() => handlePrint(), 100);
        } catch (err) {
            showToast.error('Failed to load job card');
        }
    };

    const { formatCurrency } = useCurrency();

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { class: string; label: string }> = {
            received: { class: 'badge badge-lg bg-info', label: 'Received' },
            diagnosing: { class: 'badge badge-lg bg-warning', label: 'Diagnosing' },
            waiting_parts: { class: 'badge badge-lg bg-secondary', label: 'Waiting Parts' },
            in_progress: { class: 'badge badge-lg bg-primary', label: 'In Progress' },
            on_hold: { class: 'badge badge-lg bg-dark', label: 'On Hold' },
            completed: { class: 'badge badge-lg bg-success', label: 'Completed' },
            delivered: { class: 'badge badge-lg bg-success', label: 'Delivered' },
            cancelled: { class: 'badge badge-lg bg-danger', label: 'Cancelled' },
        };
        return statusMap[status] || { class: 'badge badge-lg bg-secondary', label: status };
    };

    const getPriorityBadge = (priority: string) => {
        const priorityMap: Record<string, { class: string; label: string }> = {
            low: { class: 'badge bg-secondary', label: 'Low' },
            normal: { class: 'badge bg-info', label: 'Normal' },
            high: { class: 'badge bg-warning', label: 'High' },
            urgent: { class: 'badge bg-danger', label: 'Urgent' },
        };
        return priorityMap[priority] || { class: 'badge bg-secondary', label: priority };
    };

    const getValidTransitions = (currentStatus: string): string[] => {
        const transitions: Record<string, string[]> = {
            received: ['diagnosing', 'cancelled'],
            diagnosing: ['waiting_parts', 'in_progress', 'cancelled'],
            waiting_parts: ['in_progress', 'cancelled'],
            in_progress: ['completed', 'on_hold', 'cancelled'],
            on_hold: ['in_progress', 'cancelled'],
            completed: ['delivered'],
            delivered: [],
            cancelled: [],
        };
        return transitions[currentStatus] || [];
    };

    const handleStatusUpdate = async () => {
        if (!newStatus) return;

        try {
            await updateStatus({
                id: id!,
                status: newStatus,
                notes: statusNotes || undefined,
            }).unwrap();
            setIsStatusModalOpen(false);
            setNewStatus('');
            setStatusNotes('');
            showToast.success('Status updated successfully');
        } catch (err: any) {
            showToast.error(err?.data?.message || 'Failed to update status');
        }
    };

    const selectProduct = (product: any) => {
        setItemForm({
            ...itemForm,
            product_id: product.id,
            product_name: product.name,
            description: product.name,
            type: 'part',
            unit_price: product.selling_price || 0,
        });
        setProductSearch('');
        setShowProductDropdown(false);
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await addItem({
                id: id!,
                product_id: itemForm.product_id || undefined,
                description: itemForm.description,
                type: itemForm.type,
                quantity: itemForm.quantity,
                unit_price: itemForm.unit_price,
            }).unwrap();
            setIsItemModalOpen(false);
            setItemForm({
                product_id: '',
                product_name: '',
                description: '',
                type: 'service',
                quantity: 1,
                unit_price: 0,
            });
            setProductSearch('');
            showToast.success('Item added successfully');
        } catch (err: any) {
            showToast.error(err?.data?.message || 'Failed to add item');
        }
    };

    const handleRemoveItem = async () => {
        if (!removingItemId) return;

        try {
            await removeItem({
                repairId: id!,
                itemId: removingItemId,
            }).unwrap();
            setIsRemoveItemOpen(false);
            setRemovingItemId(null);
            showToast.success('Item removed successfully');
        } catch (err: any) {
            showToast.error(err?.data?.message || 'Failed to remove item');
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();

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
            showToast.success('Payment recorded successfully');
        } catch (err: any) {
            showToast.error(err?.data?.message || 'Failed to add payment');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data?.repair) {
        return (
            <div className="panel">
                <div className="text-center py-10 text-gray-500">Repair not found.</div>
            </div>
        );
    }

    const repair = data.repair;
    const statusInfo = getStatusBadge(repair.status);
    const priorityInfo = getPriorityBadge(repair.priority);
    const canEdit = !['delivered', 'cancelled'].includes(repair.status);
    const canUpdateStatus = getValidTransitions(repair.status).length > 0;

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="panel">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <button type="button" className="btn btn-outline-primary btn-sm mb-3" onClick={() => navigate('/repairs')}>
                            <svg className="w-4 h-4 ltr:mr-1 rtl:ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold dark:text-white">Job #{repair.job_number}</h2>
                            <span className={statusInfo.class}>{statusInfo.label}</span>
                            <span className={priorityInfo.class}>{priorityInfo.label}</span>
                        </div>
                        <p className="text-gray-500 mt-1">
                            {repair.device_type} {repair.device_brand && `- ${repair.device_brand}`} {repair.device_model}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn btn-outline-info" onClick={printJobCard}>
                            <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
                            </svg>
                            Print Job Card
                        </button>
                        {canUpdateStatus && (
                            <button type="button" className="btn btn-primary" onClick={() => setIsStatusModalOpen(true)}>
                                <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Update Status
                            </button>
                        )}
                        {canEdit && repair.due_amount > 0 && (
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => {
                                    setPaymentForm({ ...paymentForm, amount: repair.due_amount.toString() });
                                    setIsPaymentModalOpen(true);
                                }}
                            >
                                <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                                Add Payment
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="panel bg-primary text-white">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm opacity-80">Estimated Cost</p>
                            <h3 className="text-2xl font-bold mt-1">{formatCurrency(repair.estimated_cost)}</h3>
                        </div>
                    </div>
                </div>
                <div className="panel bg-secondary text-white">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm opacity-80">Final Cost</p>
                            <h3 className="text-2xl font-bold mt-1">{formatCurrency(repair.final_cost)}</h3>
                        </div>
                    </div>
                </div>
                <div className="panel bg-success text-white">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm opacity-80">Paid Amount</p>
                            <h3 className="text-2xl font-bold mt-1">{formatCurrency(repair.paid_amount)}</h3>
                        </div>
                    </div>
                </div>
                <div className={`panel ${repair.due_amount > 0 ? 'bg-danger' : 'bg-success'} text-white`}>
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm opacity-80">Due Amount</p>
                            <h3 className="text-2xl font-bold mt-1">{formatCurrency(repair.due_amount)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="panel">
                <ul className="flex flex-wrap border-b border-[#ebedf2] dark:border-[#191e3a] mb-5">
                    {['details', 'items', 'timeline', 'payments'].map((tab) => (
                        <li key={tab}>
                            <button
                                type="button"
                                className={`-mb-[1px] block border border-transparent p-3.5 py-2 hover:text-primary capitalize ${
                                    activeTab === tab ? 'border-b-white text-primary dark:border-b-black' : ''
                                }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'items' ? `Parts & Services (${repair.items?.length || 0})` : tab}
                            </button>
                        </li>
                    ))}
                </ul>

                {/* Details Tab */}
                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h5 className="text-lg font-semibold mb-4">Device Information</h5>
                            <div className="space-y-3">
                                <div className="flex"><span className="text-gray-500 w-40">Device Type:</span><span className="font-medium">{repair.device_type}</span></div>
                                <div className="flex"><span className="text-gray-500 w-40">Brand:</span><span className="font-medium">{repair.device_brand || '-'}</span></div>
                                <div className="flex"><span className="text-gray-500 w-40">Model:</span><span className="font-medium">{repair.device_model || '-'}</span></div>
                                <div className="flex"><span className="text-gray-500 w-40">Serial/IMEI:</span><span className="font-medium">{repair.serial_imei || '-'}</span></div>
                                <div className="flex"><span className="text-gray-500 w-40">Condition:</span><span className="font-medium">{repair.device_condition || '-'}</span></div>
                                {repair.accessories_received && repair.accessories_received.length > 0 && (
                                    <div className="flex">
                                        <span className="text-gray-500 w-40">Accessories:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {repair.accessories_received.map((acc, i) => (
                                                <span key={i} className="badge bg-info">{acc}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h5 className="text-lg font-semibold mb-4">Customer & Assignment</h5>
                            <div className="space-y-3">
                                <div className="flex">
                                    <span className="text-gray-500 w-40">Customer:</span>
                                    {repair.customer ? (
                                        <Link to={`/customers/${repair.customer.id}`} className="text-primary hover:underline">
                                            {repair.customer.name}
                                        </Link>
                                    ) : (
                                        <span className="text-gray-400">Walk-in</span>
                                    )}
                                </div>
                                {repair.customer?.phone && (
                                    <div className="flex"><span className="text-gray-500 w-40">Phone:</span><span>{repair.customer.phone}</span></div>
                                )}
                                <div className="flex"><span className="text-gray-500 w-40">Technician:</span><span>{repair.technician?.name || <span className="text-gray-400">Unassigned</span>}</span></div>
                                <div className="flex"><span className="text-gray-500 w-40">Received By:</span><span>{repair.received_by?.name}</span></div>
                                <div className="flex"><span className="text-gray-500 w-40">Warranty:</span><span>{repair.warranty_days} days</span></div>
                            </div>
                        </div>

                        <div>
                            <h5 className="text-lg font-semibold mb-4">Issue & Diagnosis</h5>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-500">Reported Issues:</span>
                                    <p className="mt-1 bg-gray-50 dark:bg-gray-800 p-3 rounded">{repair.reported_issues}</p>
                                </div>
                                {repair.diagnosis && (
                                    <div>
                                        <span className="text-gray-500">Diagnosis:</span>
                                        <p className="mt-1 bg-gray-50 dark:bg-gray-800 p-3 rounded">{repair.diagnosis}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h5 className="text-lg font-semibold mb-4">Timeline</h5>
                            <div className="space-y-3">
                                <div className="flex"><span className="text-gray-500 w-40">Received:</span><span>{formatDate(repair.received_at)}</span></div>
                                <div className="flex"><span className="text-gray-500 w-40">Est. Completion:</span><span>{formatDate(repair.estimated_completion)}</span></div>
                                <div className="flex"><span className="text-gray-500 w-40">Completed:</span><span>{formatDate(repair.completed_at)}</span></div>
                                <div className="flex"><span className="text-gray-500 w-40">Delivered:</span><span>{formatDate(repair.delivered_at)}</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Items Tab */}
                {activeTab === 'items' && (
                    <div>
                        {canEdit && (
                            <div className="mb-4">
                                <button type="button" className="btn btn-primary" onClick={() => setIsItemModalOpen(true)}>
                                    <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                    Add Part/Service
                                </button>
                            </div>
                        )}

                        {repair.items && repair.items.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table-striped">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Type</th>
                                            <th>Qty</th>
                                            <th>Unit Price</th>
                                            <th>Total</th>
                                            {canEdit && <th className="text-center">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repair.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <span className="font-medium">{item.description}</span>
                                                    {item.product && <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>}
                                                    {item.inventory_item && <p className="text-xs text-gray-500">S/N: {item.inventory_item.serial_number}</p>}
                                                </td>
                                                <td>
                                                    <span className={`badge ${item.type === 'part' ? 'bg-info' : item.type === 'service' ? 'bg-primary' : 'bg-secondary'}`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td>{item.quantity}</td>
                                                <td>{formatCurrency(item.unit_price)}</td>
                                                <td className="font-semibold">{formatCurrency(item.total_price)}</td>
                                                {canEdit && (
                                                    <td className="text-center">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => {
                                                                setRemovingItemId(item.id);
                                                                setIsRemoveItemOpen(true);
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={canEdit ? 4 : 3} className="text-right font-semibold">Total:</td>
                                            <td colSpan={canEdit ? 2 : 1} className="font-bold text-lg">{formatCurrency(repair.final_cost)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">No parts or services added yet.</div>
                        )}
                    </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                    <div className="max-w-2xl">
                        {repair.status_history && repair.status_history.length > 0 ? (
                            <div className="relative before:absolute before:left-4 before:top-0 before:h-full before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
                                {repair.status_history.map((history, index) => {
                                    const statusInfo = getStatusBadge(history.to_status);
                                    return (
                                        <div key={history.id} className="relative pl-10 pb-6">
                                            <div className="absolute left-2 w-4 h-4 rounded-full bg-primary border-2 border-white dark:border-gray-900"></div>
                                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={statusInfo.class}>{statusInfo.label}</span>
                                                    <span className="text-sm text-gray-500">{formatDate(history.created_at)}</span>
                                                </div>
                                                {history.from_status && (
                                                    <p className="text-sm text-gray-500">
                                                        Changed from {getStatusBadge(history.from_status).label}
                                                    </p>
                                                )}
                                                {history.notes && <p className="text-sm mt-2">{history.notes}</p>}
                                                <p className="text-xs text-gray-400 mt-2">By {history.user?.name}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">No status history.</div>
                        )}
                    </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                    <div>
                        {repair.payments && repair.payments.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table-striped">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Method</th>
                                            <th>Reference</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repair.payments.map((payment) => (
                                            <tr key={payment.id}>
                                                <td>{formatDate(payment.payment_date)}</td>
                                                <td className="font-semibold text-success">{formatCurrency(payment.amount)}</td>
                                                <td>{payment.payment_method?.name}</td>
                                                <td>{payment.reference_number || '-'}</td>
                                                <td>{payment.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td className="font-semibold">Total Paid:</td>
                                            <td colSpan={4} className="font-bold text-success">{formatCurrency(repair.paid_amount)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">No payments recorded yet.</div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={jobCardRef}>
                    {jobCardData && <JobCardPrint data={jobCardData} />}
                </div>
            </div>

            {/* Status Update Modal */}
            <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Update Status">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="new_status">New Status *</label>
                        <select id="new_status" className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                            <option value="">Select status</option>
                            {getValidTransitions(repair.status).map((s) => {
                                const info = statusOptions?.statuses.find((st) => st.value === s);
                                return <option key={s} value={s}>{info?.label || s}</option>;
                            })}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status_notes">Notes</label>
                        <textarea id="status_notes" className="form-textarea" rows={3} value={statusNotes} onChange={(e) => setStatusNotes(e.target.value)}></textarea>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsStatusModalOpen(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={handleStatusUpdate} disabled={isUpdatingStatus || !newStatus}>
                            {isUpdatingStatus && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            Update
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Add Item Modal */}
            <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Add Part/Service" size="lg">
                <form onSubmit={handleAddItem}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="item_type">Type *</label>
                            <select id="item_type" className="form-select" value={itemForm.type} onChange={(e) => setItemForm({ ...itemForm, type: e.target.value as any })}>
                                <option value="service">Service</option>
                                <option value="part">Part</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {itemForm.type === 'part' && (
                            <div className="relative">
                                <label>Search Product (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search product..."
                                    value={itemForm.product_name || productSearch}
                                    onFocus={(e) => {
                                        searchProducts({ q: e.target.value || '', type: 'spare_part' });
                                        setShowProductDropdown(true);
                                    }}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        setItemForm({ ...itemForm, product_id: '', product_name: '' });
                                        searchProducts({ q: e.target.value, type: 'spare_part' });
                                        setShowProductDropdown(true);
                                    }}
                                    onBlur={() => {
                                        // Delay to allow click event on dropdown items
                                        setTimeout(() => setShowProductDropdown(false), 200);
                                    }}
                                />
                                {showProductDropdown && productsData && (
                                    <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                                        {productsData.products && productsData.products.length > 0 ? (
                                            productsData.products.map((product) => (
                                                <div key={product.id} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => selectProduct(product)}>
                                                    <div className="font-semibold">{product.name}</div>
                                                    <div className="text-xs text-gray-500">SKU: {product.sku} | Price: {formatCurrency(product.selling_price)}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 text-gray-500 text-center text-sm">No products found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label htmlFor="description">Description *</label>
                            <input id="description" type="text" className="form-input" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="quantity">Quantity</label>
                                <input id="quantity" type="number" min="1" className="form-input" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) || 1 })} />
                            </div>
                            <div>
                                <label htmlFor="unit_price">Unit Price *</label>
                                <input id="unit_price" type="number" step="0.01" min="0" className="form-input" value={itemForm.unit_price} onChange={(e) => setItemForm({ ...itemForm, unit_price: parseFloat(e.target.value) || 0 })} required />
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                            <span className="text-gray-500">Total: </span>
                            <span className="font-bold text-lg">{formatCurrency(itemForm.quantity * itemForm.unit_price)}</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsItemModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isAddingItem}>
                            {isAddingItem && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            Add Item
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Add Payment">
                <form onSubmit={handleAddPayment}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="amount">Amount *</label>
                            <input id="amount" type="number" step="0.01" min="0.01" max={repair.due_amount} className="form-input" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
                            <p className="text-xs text-gray-500 mt-1">Due: {formatCurrency(repair.due_amount)}</p>
                        </div>
                        <div>
                            <label htmlFor="payment_method">Payment Method *</label>
                            <select id="payment_method" className="form-select" value={paymentForm.payment_method_id} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method_id: e.target.value })} required>
                                <option value="">Select method</option>
                                {paymentMethodsData?.payment_methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="reference_number">Reference</label>
                            <input id="reference_number" type="text" className="form-input" value={paymentForm.reference_number} onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })} />
                        </div>
                        <div>
                            <label htmlFor="payment_notes">Notes</label>
                            <textarea id="payment_notes" className="form-textarea" rows={2} value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-success" disabled={isAddingPayment}>
                            {isAddingPayment && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            Add Payment
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Remove Item Confirmation */}
            <ConfirmDialog
                isOpen={isRemoveItemOpen}
                onClose={() => setIsRemoveItemOpen(false)}
                onConfirm={handleRemoveItem}
                title="Remove Item"
                message="Are you sure you want to remove this item? Stock will be restored if applicable."
                confirmText="Remove"
                isLoading={isRemovingItem}
            />
        </div>
    );
};

export default RepairView;
