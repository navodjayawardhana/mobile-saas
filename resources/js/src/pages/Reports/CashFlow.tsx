import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetCashFlowReportQuery } from '../../store/api/reportsApi';
import { useCurrency } from '../../hooks/useCurrency';

const CashFlowReport = () => {
    const [dateRange, setDateRange] = useState({
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
    });
    const [isExporting, setIsExporting] = useState(false);

    const { data, isLoading } = useGetCashFlowReportQuery(dateRange);
    const { formatCurrency } = useCurrency();

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams({ date_from: dateRange.date_from, date_to: dateRange.date_to });
            const response = await fetch(`/api/v1/reports/cash-flow/export-pdf?${params}`, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
            });
            if (!response.ok) throw new Error('Failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cash_flow_${dateRange.date_from}_to_${dateRange.date_to}.pdf`;
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
                        <h5 className="text-lg font-semibold dark:text-white-light">Cash Flow Report</h5>
                        <p className="text-gray-500">Money in and out analysis</p>
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

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="panel bg-success text-white">
                    <p className="text-sm opacity-80">Total Inflows</p>
                    <h2 className="text-2xl font-bold">{formatCurrency(data?.inflows?.total || 0)}</h2>
                </div>
                <div className="panel bg-danger text-white">
                    <p className="text-sm opacity-80">Total Outflows</p>
                    <h2 className="text-2xl font-bold">{formatCurrency(data?.outflows?.total || 0)}</h2>
                </div>
                <div className={`panel ${(data?.net_cash_flow || 0) >= 0 ? 'bg-primary' : 'bg-warning'} text-white`}>
                    <p className="text-sm opacity-80">Net Cash Flow</p>
                    <h2 className="text-2xl font-bold">{formatCurrency(data?.net_cash_flow || 0)}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Inflows by Method */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-4 dark:text-white-light">Inflows by Payment Method</h5>
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>Method</th>
                                    <th className="text-center">Count</th>
                                    <th className="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.inflows?.by_method?.map((m: any, i: number) => (
                                    <tr key={i}>
                                        <td className="font-medium">{m.name}</td>
                                        <td className="text-center">{m.count}</td>
                                        <td className="text-right text-success">{formatCurrency(m.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Outflows */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-4 dark:text-white-light">Outflows Breakdown</h5>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span>Expenses</span>
                            <span className="text-danger">{formatCurrency(data?.outflows?.expenses || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Supplier Payments</span>
                            <span className="text-danger">{formatCurrency(data?.outflows?.supplier_payments || 0)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Total Outflows</span>
                            <span className="text-danger">{formatCurrency(data?.outflows?.total || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Flow */}
            {data?.daily_flow && data.daily_flow.length > 0 && (
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-4 dark:text-white-light">Daily Cash Flow</h5>
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th className="text-right">Inflow</th>
                                    <th className="text-right">Outflow</th>
                                    <th className="text-right">Net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.daily_flow.map((d: any, i: number) => (
                                    <tr key={i}>
                                        <td>{d.date}</td>
                                        <td className="text-right text-success">{formatCurrency(d.inflow)}</td>
                                        <td className="text-right text-danger">{formatCurrency(d.outflow)}</td>
                                        <td className={`text-right font-semibold ${d.net >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {formatCurrency(d.net)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashFlowReport;
