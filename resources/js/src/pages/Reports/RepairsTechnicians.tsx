import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetRepairsByTechnicianQuery } from '../../store/api/reportsApi';
import { useCurrency } from '../../hooks/useCurrency';

const RepairsTechnicians = () => {
    const [dateRange, setDateRange] = useState({
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
    });
    const [isExporting, setIsExporting] = useState(false);

    const { data, isLoading } = useGetRepairsByTechnicianQuery(dateRange);
    const { formatCurrency } = useCurrency();

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams({ date_from: dateRange.date_from, date_to: dateRange.date_to });
            const response = await fetch(`/api/v1/reports/repairs/by-technician/export-pdf?${params}`, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
            });
            if (!response.ok) throw new Error('Failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `repairs_by_technician_${dateRange.date_from}_to_${dateRange.date_to}.pdf`;
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

    const totals = {
        repairs: data?.technicians?.reduce((sum: number, t: any) => sum + t.total_repairs, 0) || 0,
        completed: data?.technicians?.reduce((sum: number, t: any) => sum + t.completed, 0) || 0,
        revenue: data?.technicians?.reduce((sum: number, t: any) => sum + t.total_revenue, 0) || 0,
    };

    return (
        <div className="space-y-5">
            <div className="panel">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h5 className="text-lg font-semibold dark:text-white-light">Repairs by Technician</h5>
                        <p className="text-gray-500">Technician performance analysis</p>
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

            {/* Table */}
            <div className="panel">
                <div className="table-responsive">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Technician</th>
                                <th className="text-center">Total Repairs</th>
                                <th className="text-center">Completed</th>
                                <th className="text-right">Revenue</th>
                                <th className="text-center">Avg Days</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.technicians?.map((t: any, i: number) => (
                                <tr key={t.id}>
                                    <td>{i + 1}</td>
                                    <td className="font-medium">{t.name}</td>
                                    <td className="text-center">{t.total_repairs}</td>
                                    <td className="text-center">
                                        <span className="badge bg-success">{t.completed}</span>
                                    </td>
                                    <td className="text-right">{formatCurrency(t.total_revenue)}</td>
                                    <td className="text-center">{t.avg_days ? Number(t.avg_days).toFixed(1) : '-'}</td>
                                </tr>
                            ))}
                            {data?.technicians && data.technicians.length > 0 && (
                                <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                                    <td colSpan={2} className="text-right">Total:</td>
                                    <td className="text-center">{totals.repairs}</td>
                                    <td className="text-center">{totals.completed}</td>
                                    <td className="text-right">{formatCurrency(totals.revenue)}</td>
                                    <td></td>
                                </tr>
                            )}
                            {(!data?.technicians || data.technicians.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">No data for this period</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RepairsTechnicians;
