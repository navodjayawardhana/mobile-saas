import { useState } from 'react';
import { useLazyTrackRepairQuery } from '../../store/api/repairsApi';

const TrackRepair = () => {
    const [jobNumber, setJobNumber] = useState('');
    const [trackRepair, { data, isLoading, error }] = useLazyTrackRepairQuery();
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jobNumber.trim()) return;
        setSearched(true);
        await trackRepair(jobNumber.trim());
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusInfo = (status: string) => {
        const statusMap: Record<string, { label: string; description: string; color: string; icon: string }> = {
            received: {
                label: 'Received',
                description: 'Your device has been received and is waiting to be diagnosed.',
                color: 'bg-info',
                icon: '📥',
            },
            diagnosing: {
                label: 'Diagnosing',
                description: 'Our technicians are examining your device to identify the issues.',
                color: 'bg-warning',
                icon: '🔍',
            },
            waiting_parts: {
                label: 'Waiting for Parts',
                description: 'We are waiting for replacement parts to arrive.',
                color: 'bg-secondary',
                icon: '📦',
            },
            in_progress: {
                label: 'In Progress',
                description: 'Your device is currently being repaired by our technicians.',
                color: 'bg-primary',
                icon: '🔧',
            },
            on_hold: {
                label: 'On Hold',
                description: 'The repair is temporarily on hold. We may contact you for more information.',
                color: 'bg-dark',
                icon: '⏸️',
            },
            completed: {
                label: 'Completed',
                description: 'The repair is complete! Your device is ready for pickup.',
                color: 'bg-success',
                icon: '✅',
            },
            delivered: {
                label: 'Delivered',
                description: 'Your device has been delivered. Thank you for choosing us!',
                color: 'bg-success',
                icon: '🎉',
            },
            cancelled: {
                label: 'Cancelled',
                description: 'This repair has been cancelled.',
                color: 'bg-danger',
                icon: '❌',
            },
        };
        return statusMap[status] || { label: status, description: '', color: 'bg-secondary', icon: '❓' };
    };

    const getPriorityLabel = (priority: string) => {
        const priorityMap: Record<string, string> = {
            low: 'Low Priority',
            normal: 'Normal Priority',
            high: 'High Priority',
            urgent: 'Urgent',
        };
        return priorityMap[priority] || priority;
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Track Your Repair</h1>
                    <p className="text-gray-600 dark:text-gray-400">Enter your job number to check the status of your repair</p>
                </div>

                {/* Search Form */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <input
                            type="text"
                            className="form-input flex-1 text-lg"
                            placeholder="Enter Job Number (e.g., REP-20260328-0001)"
                            value={jobNumber}
                            onChange={(e) => setJobNumber(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary px-8" disabled={isLoading || !jobNumber.trim()}>
                            {isLoading ? (
                                <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block"></span>
                            ) : (
                                'Track'
                            )}
                        </button>
                    </form>
                </div>

                {/* Results */}
                {searched && !isLoading && (
                    <>
                        {error ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Repair Not Found</h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    We couldn't find a repair with job number "{jobNumber}". Please check the number and try again.
                                </p>
                            </div>
                        ) : data ? (
                            <div className="space-y-6">
                                {/* Status Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                                    <div className={`${getStatusInfo(data.status).color} text-white p-6`}>
                                        <div className="flex items-center gap-4">
                                            <span className="text-4xl">{getStatusInfo(data.status).icon}</span>
                                            <div>
                                                <p className="text-sm opacity-80">Current Status</p>
                                                <h2 className="text-2xl font-bold">{getStatusInfo(data.status).label}</h2>
                                            </div>
                                        </div>
                                        <p className="mt-4 opacity-90">{getStatusInfo(data.status).description}</p>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold mb-4 dark:text-white">Repair Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-gray-500 text-sm">Job Number</p>
                                                <p className="font-semibold dark:text-white">{data.job_number}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-sm">Priority</p>
                                                <p className="font-semibold dark:text-white">{getPriorityLabel(data.priority)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-sm">Device</p>
                                                <p className="font-semibold dark:text-white">
                                                    {data.device_type}
                                                    {data.device_brand && ` - ${data.device_brand}`}
                                                    {data.device_model && ` ${data.device_model}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-sm">Received On</p>
                                                <p className="font-semibold dark:text-white">{formatDate(data.received_at)}</p>
                                            </div>
                                            {data.estimated_completion && (
                                                <div>
                                                    <p className="text-gray-500 text-sm">Estimated Completion</p>
                                                    <p className="font-semibold dark:text-white">{formatDate(data.estimated_completion)}</p>
                                                </div>
                                            )}
                                            {data.completed_at && (
                                                <div>
                                                    <p className="text-gray-500 text-sm">Completed On</p>
                                                    <p className="font-semibold text-success">{formatDate(data.completed_at)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline */}
                                {data.status_history && data.status_history.length > 0 && (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                                        <h3 className="text-lg font-semibold mb-4 dark:text-white">Status History</h3>
                                        <div className="relative before:absolute before:left-4 before:top-0 before:h-full before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
                                            {data.status_history.map((history, index) => {
                                                const info = getStatusInfo(history.to_status);
                                                return (
                                                    <div key={index} className="relative pl-10 pb-6 last:pb-0">
                                                        <div className={`absolute left-2 w-4 h-4 rounded-full ${info.color} border-2 border-white dark:border-gray-800`}></div>
                                                        <div>
                                                            <span className={`badge ${info.color}`}>{info.label}</span>
                                                            <p className="text-sm text-gray-500 mt-1">{formatDate(history.created_at)}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Ready for Pickup Notice */}
                                {data.status === 'completed' && (
                                    <div className="bg-success-light border border-success text-success rounded-lg p-6 text-center">
                                        <div className="text-4xl mb-2">🎉</div>
                                        <h3 className="text-lg font-bold">Your device is ready for pickup!</h3>
                                        <p>Please bring this job number and a valid ID when collecting your device.</p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </>
                )}

                {/* Footer */}
                <div className="text-center mt-8 text-gray-500 text-sm">
                    <p>Having issues? Contact us at our store or call our support line.</p>
                </div>
            </div>
        </div>
    );
};

export default TrackRepair;
