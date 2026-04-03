import { Link } from 'react-router-dom';
import { useGetOverdueRepairsQuery } from '../../store/api/repairsApi';

const OverdueRepairs = () => {
    const { data, isLoading } = useGetOverdueRepairsQuery();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getOverdueDays = (expectedDate: string) => {
        const expected = new Date(expectedDate);
        const now = new Date();
        const diffTime = now.getTime() - expected.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { class: string; label: string }> = {
            received: { class: 'badge bg-info', label: 'Received' },
            diagnosing: { class: 'badge bg-warning', label: 'Diagnosing' },
            waiting_parts: { class: 'badge bg-secondary', label: 'Waiting Parts' },
            in_progress: { class: 'badge bg-primary', label: 'In Progress' },
            on_hold: { class: 'badge bg-dark', label: 'On Hold' },
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
                        <h5 className="text-lg font-semibold dark:text-white-light">Overdue Repairs</h5>
                        <p className="text-gray-500">Repairs that have passed their estimated completion date</p>
                    </div>
                    <Link to="/repairs" className="btn btn-outline-primary">
                        <svg className="w-4 h-4 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        All Repairs
                    </Link>
                </div>
            </div>

            {/* Summary Card */}
            <div className="panel bg-gradient-to-r from-danger to-danger-light text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-lg opacity-80">Overdue Repairs</p>
                        <h2 className="text-4xl font-bold mt-2">{data?.count || 0}</h2>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4l3 3" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Repairs List */}
            <div className="panel">
                {data?.repairs && data.repairs.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>Job #</th>
                                    <th>Device</th>
                                    <th>Customer</th>
                                    <th>Technician</th>
                                    <th>Expected Date</th>
                                    <th>Overdue By</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.repairs.map((repair) => {
                                    const overdueDays = getOverdueDays(repair.estimated_completion!);
                                    const statusInfo = getStatusBadge(repair.status);
                                    const priorityInfo = getPriorityBadge(repair.priority);

                                    return (
                                        <tr key={repair.id} className="bg-danger-light">
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
                                            <td>{formatDate(repair.estimated_completion!)}</td>
                                            <td>
                                                <span className="text-danger font-bold">{overdueDays} days</span>
                                            </td>
                                            <td>
                                                <span className={statusInfo.class}>{statusInfo.label}</span>
                                            </td>
                                            <td>
                                                <span className={priorityInfo.class}>{priorityInfo.label}</span>
                                            </td>
                                            <td className="text-center">
                                                <Link to={`/repairs/${repair.id}`} className="btn btn-sm btn-primary">
                                                    View & Update
                                                </Link>
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
                        <p className="text-lg font-semibold text-success">All on track!</p>
                        <p className="text-gray-500">No overdue repairs at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OverdueRepairs;
