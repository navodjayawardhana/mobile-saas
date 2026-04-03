import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    useGetRepairsQuery,
    useGetRepairStatusOptionsQuery,
    useGetTechniciansQuery,
    useUpdateRepairStatusMutation,
} from '../../store/api/repairsApi';
import type { Repair } from '../../store/api/repairsApi';
import Modal from '../../components/Common/Modal';
import { useCurrency } from '../../hooks/useCurrency';

const RepairsIndex = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [priority, setPriority] = useState('');
    const [technicianId, setTechnicianId] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { data, isLoading } = useGetRepairsQuery({
        page,
        search,
        status: status || undefined,
        priority: priority || undefined,
        technician_id: technicianId || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
    });
    const { data: statusOptions } = useGetRepairStatusOptionsQuery();
    const { data: techniciansData } = useGetTechniciansQuery();
    const [updateStatus, { isLoading: isUpdating }] = useUpdateRepairStatusMutation();

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
    const [newStatus, setNewStatus] = useState('');
    const [statusNotes, setStatusNotes] = useState('');
    const [error, setError] = useState('');

    const { formatCurrency } = useCurrency();

    const formatDate = (date: string) => {
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
            received: { class: 'badge bg-info', label: 'Received' },
            diagnosing: { class: 'badge bg-warning', label: 'Diagnosing' },
            waiting_parts: { class: 'badge bg-secondary', label: 'Waiting Parts' },
            in_progress: { class: 'badge bg-primary', label: 'In Progress' },
            on_hold: { class: 'badge bg-dark', label: 'On Hold' },
            completed: { class: 'badge bg-success', label: 'Completed' },
            delivered: { class: 'badge bg-success', label: 'Delivered' },
            cancelled: { class: 'badge bg-danger', label: 'Cancelled' },
        };
        return statusMap[status] || { class: 'badge bg-secondary', label: status };
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

    const openStatusModal = (repair: Repair) => {
        setSelectedRepair(repair);
        setNewStatus('');
        setStatusNotes('');
        setError('');
        setIsStatusModalOpen(true);
    };

    const handleStatusUpdate = async () => {
        if (!selectedRepair || !newStatus) return;
        setError('');

        try {
            await updateStatus({
                id: selectedRepair.id,
                status: newStatus,
                notes: statusNotes || undefined,
            }).unwrap();
            setIsStatusModalOpen(false);
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to update status');
        }
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

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setPriority('');
        setTechnicianId('');
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
                <h5 className="text-lg font-semibold dark:text-white-light">Repair Jobs</h5>
                <div className="flex gap-2">
                    <Link to="/repairs/overdue" className="btn btn-outline-danger">
                        <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Overdue
                    </Link>
                    <Link to="/repairs/create" className="btn btn-primary">
                        <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        New Repair
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-5">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search job #, device, customer..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
                <select
                    className="form-select"
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Status</option>
                    {statusOptions?.statuses.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
                <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => {
                        setPriority(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Priority</option>
                    {statusOptions?.priorities.map((p) => (
                        <option key={p.value} value={p.value}>
                            {p.label}
                        </option>
                    ))}
                </select>
                <select
                    className="form-select"
                    value={technicianId}
                    onChange={(e) => {
                        setTechnicianId(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Technicians</option>
                    {techniciansData?.technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
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
            </div>

            {(search || status || priority || technicianId || dateFrom || dateTo) && (
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
                            <th>Job #</th>
                            <th>Device</th>
                            <th>Customer</th>
                            <th>Technician</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Cost</th>
                            <th>Received</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.repairs.map((repair) => {
                            const statusInfo = getStatusBadge(repair.status);
                            const priorityInfo = getPriorityBadge(repair.priority);
                            return (
                                <tr key={repair.id}>
                                    <td className="font-semibold">{repair.job_number}</td>
                                    <td>
                                        <div>
                                            <span className="font-medium">{repair.device_type}</span>
                                            {repair.device_brand && (
                                                <p className="text-xs text-gray-500">
                                                    {repair.device_brand} {repair.device_model}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {repair.customer ? (
                                            <div>
                                                <span>{repair.customer.name}</span>
                                                {repair.customer.phone && (
                                                    <p className="text-xs text-gray-500">{repair.customer.phone}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">Walk-in</span>
                                        )}
                                    </td>
                                    <td>{repair.technician?.name || <span className="text-gray-400">Unassigned</span>}</td>
                                    <td>
                                        <span className={statusInfo.class}>{statusInfo.label}</span>
                                    </td>
                                    <td>
                                        <span className={priorityInfo.class}>{priorityInfo.label}</span>
                                    </td>
                                    <td>
                                        <div>
                                            <span className="font-semibold">{formatCurrency(repair.final_cost)}</span>
                                            {repair.due_amount > 0 && (
                                                <p className="text-xs text-danger">Due: {formatCurrency(repair.due_amount)}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-sm">{formatDate(repair.received_at)}</td>
                                    <td className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link to={`/repairs/${repair.id}`} className="btn btn-sm btn-outline-primary">
                                                View
                                            </Link>
                                            {!['delivered', 'cancelled'].includes(repair.status) && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-info"
                                                    onClick={() => openStatusModal(repair)}
                                                >
                                                    Status
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {data?.repairs.length === 0 && <div className="text-center py-10 text-gray-500">No repairs found.</div>}

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

            {/* Status Update Modal */}
            <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Update Repair Status">
                {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

                {selectedRepair && (
                    <div className="space-y-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                            <p className="font-semibold">{selectedRepair.job_number}</p>
                            <p className="text-sm text-gray-500">
                                {selectedRepair.device_type} - {selectedRepair.device_brand} {selectedRepair.device_model}
                            </p>
                            <p className="text-sm">
                                Current Status: <span className={getStatusBadge(selectedRepair.status).class}>{getStatusBadge(selectedRepair.status).label}</span>
                            </p>
                        </div>

                        <div>
                            <label htmlFor="new_status">New Status *</label>
                            <select
                                id="new_status"
                                className="form-select"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                <option value="">Select new status</option>
                                {getValidTransitions(selectedRepair.status).map((s) => {
                                    const statusInfo = statusOptions?.statuses.find((st) => st.value === s);
                                    return (
                                        <option key={s} value={s}>
                                            {statusInfo?.label || s}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="status_notes">Notes</label>
                            <textarea
                                id="status_notes"
                                className="form-textarea"
                                rows={3}
                                placeholder="Add notes about this status change..."
                                value={statusNotes}
                                onChange={(e) => setStatusNotes(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" className="btn btn-outline-dark" onClick={() => setIsStatusModalOpen(false)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleStatusUpdate}
                                disabled={isUpdating || !newStatus}
                            >
                                {isUpdating && (
                                    <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>
                                )}
                                Update Status
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RepairsIndex;
