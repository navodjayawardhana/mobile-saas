import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetRepairTurnaroundQuery } from '../../store/api/reportsApi';

const RepairsTurnaround = () => {
    const [dateRange, setDateRange] = useState({
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
    });
    const [isExporting, setIsExporting] = useState(false);

    const { data, isLoading } = useGetRepairTurnaroundQuery(dateRange);

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams({ date_from: dateRange.date_from, date_to: dateRange.date_to });
            const response = await fetch(`/api/v1/reports/repairs/turnaround/export-pdf?${params}`, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
            });
            if (!response.ok) throw new Error('Failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `repairs_turnaround_${dateRange.date_from}_to_${dateRange.date_to}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('Failed to export PDF');
        } finally {
            setIsExporting(false);
        }
    };

    const setPresetRange = (preset: string) => {
        const today = new Date();
        let from: Date;
        switch (preset) {
            case 'today': from = today; break;
            case 'week': from = new Date(today); from.setDate(from.getDate() - 7); break;
            case 'month': from = new Date(today.getFullYear(), today.getMonth(), 1); break;
            case 'year': from = new Date(today.getFullYear(), 0, 1); break;
            default: return;
        }
        setDateRange({ date_from: from.toISOString().split('T')[0], date_to: today.toISOString().split('T')[0] });
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
            <div className="panel">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h5 className="text-lg font-semibold dark:text-white-light">Repair Turnaround</h5>
                        <p className="text-gray-500">Turnaround time analysis</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportPdf} className="btn btn-dark" disabled={isExporting}>
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </button>
                        <Link to="/reports/repairs" className="btn btn-outline-primary">Repairs Report</Link>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="panel">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">From:</label>
                        <input type="date" className="form-input w-auto" value={dateRange.date_from} onChange={(e) => setDateRange({ ...dateRange, date_from: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">To:</label>
                        <input type="date" className="form-input w-auto" value={dateRange.date_to} onChange={(e) => setDateRange({ ...dateRange, date_to: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setPresetRange('today')} className="btn btn-sm btn-outline-secondary">Today</button>
                        <button onClick={() => setPresetRange('week')} className="btn btn-sm btn-outline-secondary">Last 7 Days</button>
                        <button onClick={() => setPresetRange('month')} className="btn btn-sm btn-outline-secondary">This Month</button>
                        <button onClick={() => setPresetRange('year')} className="btn btn-sm btn-outline-secondary">This Year</button>
                    </div>
                </div>
            </div>

            {/* On-Time Analysis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="panel bg-success text-white">
                    <p className="text-sm opacity-80">On Time</p>
                    <h2 className="text-2xl font-bold">{data?.on_time_analysis?.on_time || 0}</h2>
                </div>
                <div className="panel bg-danger text-white">
                    <p className="text-sm opacity-80">Late</p>
                    <h2 className="text-2xl font-bold">{data?.on_time_analysis?.late || 0}</h2>
                </div>
                <div className="panel bg-primary text-white">
                    <p className="text-sm opacity-80">On-Time Rate</p>
                    <h2 className="text-2xl font-bold">{data?.on_time_analysis?.on_time_rate || 0}%</h2>
                </div>
            </div>

            {/* Distribution */}
            <div className="panel">
                <h5 className="text-lg font-semibold mb-4 dark:text-white-light">Turnaround Distribution</h5>
                <div className="table-responsive">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>Time Range</th>
                                <th className="text-center">Count</th>
                                <th className="text-right">Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.distribution?.map((d: any, i: number) => (
                                <tr key={i}>
                                    <td className="font-medium">{d.range || d.label}</td>
                                    <td className="text-center">
                                        <span className="badge bg-primary">{d.count}</span>
                                    </td>
                                    <td className="text-right">{d.percentage?.toFixed(1) || 0}%</td>
                                </tr>
                            ))}
                            {(!data?.distribution || data.distribution.length === 0) && (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-gray-500">No data for this period</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RepairsTurnaround;
