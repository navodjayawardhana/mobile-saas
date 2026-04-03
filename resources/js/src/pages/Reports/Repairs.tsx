import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetRepairReportQuery } from '../../store/api/reportsApi';
import { useCurrency } from '../../hooks/useCurrency';

const RepairsReport = () => {
    const [dateRange, setDateRange] = useState({
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
    });
    const [isExporting, setIsExporting] = useState(false);

    const { data, isLoading } = useGetRepairReportQuery(dateRange);
    const { formatCurrency } = useCurrency();

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams({ date_from: dateRange.date_from, date_to: dateRange.date_to });
            const response = await fetch(`/api/v1/reports/repairs/export-pdf?${params}`, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
            });
            if (!response.ok) throw new Error('Failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `repairs_report_${dateRange.date_from}_to_${dateRange.date_to}.pdf`;
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
                        <h5 className="text-lg font-semibold dark:text-white-light">Repairs Report</h5>
                        <p className="text-gray-500">Repair service analysis</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportPdf} className="btn btn-dark" disabled={isExporting}>
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </button>
                        <Link to="/reports" className="btn btn-outline-primary">All Reports</Link>
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

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="panel bg-primary text-white">
                    <p className="text-sm opacity-80">Total Repairs</p>
                    <h2 className="text-2xl font-bold">{data?.summary?.total_repairs || 0}</h2>
                </div>
                <div className="panel bg-success text-white">
                    <p className="text-sm opacity-80">Completed</p>
                    <h2 className="text-2xl font-bold">{data?.summary?.completed_repairs || 0}</h2>
                    <p className="text-xs opacity-80">{data?.summary?.completion_rate || 0}% rate</p>
                </div>
                <div className="panel bg-info text-white">
                    <p className="text-sm opacity-80">Total Revenue</p>
                    <h2 className="text-2xl font-bold">{formatCurrency(data?.summary?.total_revenue || 0)}</h2>
                </div>
                <div className="panel bg-warning text-white">
                    <p className="text-sm opacity-80">Outstanding</p>
                    <h2 className="text-2xl font-bold">{formatCurrency(data?.summary?.total_due || 0)}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* By Status */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-4 dark:text-white-light">By Status</h5>
                    <div className="space-y-3">
                        {data?.by_status?.map((s: any, i: number) => (
                            <div key={i} className="flex justify-between">
                                <span className="capitalize">{s.status}</span>
                                <span className="badge bg-primary">{s.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* By Priority */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-4 dark:text-white-light">By Priority</h5>
                    <div className="space-y-3">
                        {data?.by_priority?.map((p: any, i: number) => (
                            <div key={i} className="flex justify-between">
                                <span className="capitalize">{p.priority}</span>
                                <span className="badge bg-info">{p.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* By Device Type */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-4 dark:text-white-light">By Device Type</h5>
                    <div className="space-y-3">
                        {data?.by_device_type?.map((d: any, i: number) => (
                            <div key={i} className="flex justify-between">
                                <span>{d.device_type}</span>
                                <span>{d.count} ({formatCurrency(d.revenue)})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RepairsReport;
