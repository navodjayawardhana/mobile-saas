import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetProfitLossReportQuery } from '../../store/api/reportsApi';
import { useCurrency } from '../../hooks/useCurrency';

const ProfitLossReport = () => {
    const [dateRange, setDateRange] = useState({
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
    });
    const [isExporting, setIsExporting] = useState(false);

    const { data: report, isLoading } = useGetProfitLossReportQuery(dateRange);

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(
                `/api/v1/reports/profit-loss/export-pdf?date_from=${dateRange.date_from}&date_to=${dateRange.date_to}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/pdf',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `profit_loss_report_${dateRange.date_from}_to_${dateRange.date_to}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to export PDF', error);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const { formatCurrency } = useCurrency();

    const setPresetRange = (preset: string) => {
        const today = new Date();
        let from: Date;
        let to = today;

        switch (preset) {
            case 'month':
                from = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'quarter':
                from = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
                break;
            case 'year':
                from = new Date(today.getFullYear(), 0, 1);
                break;
            case 'lastMonth':
                from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                to = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'lastQuarter':
                const lastQuarterStart = Math.floor(today.getMonth() / 3) * 3 - 3;
                from = new Date(today.getFullYear(), lastQuarterStart, 1);
                to = new Date(today.getFullYear(), lastQuarterStart + 3, 0);
                break;
            default:
                return;
        }

        setDateRange({
            date_from: from.toISOString().split('T')[0],
            date_to: to.toISOString().split('T')[0],
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Calculate chart max for monthly breakdown
    const maxMonthlyValue = report?.monthly_breakdown
        ? Math.max(...report.monthly_breakdown.map((m) => Math.max(m.revenue, Math.abs(m.expenses))))
        : 0;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="panel">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h5 className="text-lg font-semibold dark:text-white-light">Profit & Loss Report</h5>
                        <p className="text-gray-500">Financial performance analysis</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportPdf} className="btn btn-primary" disabled={isExporting}>
                            {isExporting ? (
                                <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4 inline-block ltr:mr-2 rtl:ml-2"></span>
                            ) : (
                                <svg className="w-4 h-4 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                </svg>
                            )}
                            {isExporting ? 'Exporting...' : 'Download PDF'}
                        </button>
                        <Link to="/reports" className="btn btn-outline-primary">
                            <svg className="w-4 h-4 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            All Reports
                        </Link>
                    </div>
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="panel">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">From:</label>
                        <input
                            type="date"
                            className="form-input w-auto"
                            value={dateRange.date_from}
                            onChange={(e) => setDateRange({ ...dateRange, date_from: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">To:</label>
                        <input
                            type="date"
                            className="form-input w-auto"
                            value={dateRange.date_to}
                            onChange={(e) => setDateRange({ ...dateRange, date_to: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setPresetRange('month')} className="btn btn-sm btn-outline-secondary">
                            This Month
                        </button>
                        <button onClick={() => setPresetRange('lastMonth')} className="btn btn-sm btn-outline-secondary">
                            Last Month
                        </button>
                        <button onClick={() => setPresetRange('quarter')} className="btn btn-sm btn-outline-secondary">
                            This Quarter
                        </button>
                        <button onClick={() => setPresetRange('year')} className="btn btn-sm btn-outline-secondary">
                            This Year
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="panel bg-primary text-white">
                    <p className="text-lg opacity-80">Total Revenue</p>
                    <h2 className="text-2xl font-bold mt-1">{formatCurrency(report?.revenue.total || 0)}</h2>
                    <div className="text-sm opacity-80 mt-2">
                        <p>Sales: {formatCurrency(report?.revenue.sales || 0)}</p>
                        <p>Repairs: {formatCurrency(report?.revenue.repairs || 0)}</p>
                    </div>
                </div>
                <div className="panel bg-warning text-white">
                    <p className="text-lg opacity-80">Cost of Goods</p>
                    <h2 className="text-2xl font-bold mt-1">{formatCurrency(report?.cost_of_goods_sold || 0)}</h2>
                </div>
                <div className="panel bg-info text-white">
                    <p className="text-lg opacity-80">Gross Profit</p>
                    <h2 className="text-2xl font-bold mt-1">{formatCurrency(report?.gross_profit || 0)}</h2>
                    <p className="text-sm opacity-80 mt-2">Margin: {report?.gross_margin || 0}%</p>
                </div>
                <div className={`panel text-white ${(report?.net_profit || 0) >= 0 ? 'bg-success' : 'bg-danger'}`}>
                    <p className="text-lg opacity-80">Net Profit</p>
                    <h2 className="text-2xl font-bold mt-1">{formatCurrency(report?.net_profit || 0)}</h2>
                    <p className="text-sm opacity-80 mt-2">Margin: {report?.net_margin || 0}%</p>
                </div>
            </div>

            {/* P&L Statement */}
            <div className="panel">
                <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Profit & Loss Statement</h5>
                <div className="table-responsive">
                    <table className="w-full">
                        <tbody>
                            {/* Revenue Section */}
                            <tr className="bg-primary-light">
                                <td className="p-3 font-bold text-lg" colSpan={2}>
                                    Revenue
                                </td>
                            </tr>
                            <tr className="border-b dark:border-gray-700">
                                <td className="p-3 pl-8">Sales Revenue</td>
                                <td className="p-3 text-right font-medium">{formatCurrency(report?.revenue.sales || 0)}</td>
                            </tr>
                            <tr className="border-b dark:border-gray-700">
                                <td className="p-3 pl-8">Repair Revenue</td>
                                <td className="p-3 text-right font-medium">{formatCurrency(report?.revenue.repairs || 0)}</td>
                            </tr>
                            <tr className="border-b-2 border-primary dark:border-gray-500 bg-gray-50 dark:bg-gray-800">
                                <td className="p-3 font-bold">Total Revenue</td>
                                <td className="p-3 text-right font-bold text-lg">{formatCurrency(report?.revenue.total || 0)}</td>
                            </tr>

                            {/* Cost Section */}
                            <tr className="bg-warning-light">
                                <td className="p-3 font-bold text-lg" colSpan={2}>
                                    Cost of Goods Sold
                                </td>
                            </tr>
                            <tr className="border-b dark:border-gray-700">
                                <td className="p-3 pl-8">Product Costs</td>
                                <td className="p-3 text-right font-medium text-danger">({formatCurrency(report?.cost_of_goods_sold || 0)})</td>
                            </tr>
                            <tr className="border-b-2 border-warning dark:border-gray-500 bg-gray-50 dark:bg-gray-800">
                                <td className="p-3 font-bold">Gross Profit</td>
                                <td className="p-3 text-right font-bold text-lg">{formatCurrency(report?.gross_profit || 0)}</td>
                            </tr>

                            {/* Expenses Section */}
                            <tr className="bg-danger-light">
                                <td className="p-3 font-bold text-lg" colSpan={2}>
                                    Operating Expenses
                                </td>
                            </tr>
                            {report?.expenses.by_category.map((expense, index) => (
                                <tr key={index} className="border-b dark:border-gray-700">
                                    <td className="p-3 pl-8">{expense.name}</td>
                                    <td className="p-3 text-right font-medium text-danger">({formatCurrency(expense.total)})</td>
                                </tr>
                            ))}
                            <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <td className="p-3 pl-8 font-medium">Total Expenses</td>
                                <td className="p-3 text-right font-medium text-danger">({formatCurrency(report?.expenses.total || 0)})</td>
                            </tr>

                            {/* Net Profit */}
                            <tr className={`${(report?.net_profit || 0) >= 0 ? 'bg-success-light' : 'bg-danger-light'}`}>
                                <td className="p-4 font-bold text-xl">Net Profit</td>
                                <td className={`p-4 text-right font-bold text-2xl ${(report?.net_profit || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {formatCurrency(report?.net_profit || 0)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Monthly Trend */}
            <div className="panel">
                <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Monthly Trend</h5>
                {report?.monthly_breakdown && report.monthly_breakdown.length > 0 ? (
                    <>
                        <div className="flex items-end gap-2 h-64">
                            {report.monthly_breakdown.map((month, index) => {
                                const revenueHeight = maxMonthlyValue > 0 ? (month.revenue / maxMonthlyValue) * 100 : 0;
                                const expenseHeight = maxMonthlyValue > 0 ? (month.expenses / maxMonthlyValue) * 100 : 0;
                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center group relative">
                                        <div className="absolute bottom-full mb-2 bg-dark text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            <div>Revenue: {formatCurrency(month.revenue)}</div>
                                            <div>Expenses: {formatCurrency(month.expenses)}</div>
                                            <div className={month.profit >= 0 ? 'text-success' : 'text-danger'}>
                                                Profit: {formatCurrency(month.profit)}
                                            </div>
                                        </div>
                                        <div className="w-full flex gap-1 items-end h-52">
                                            <div
                                                className="flex-1 bg-primary rounded-t transition-all duration-300"
                                                style={{ height: `${revenueHeight}%`, minHeight: revenueHeight > 0 ? '4px' : '0' }}
                                            ></div>
                                            <div
                                                className="flex-1 bg-danger rounded-t transition-all duration-300"
                                                style={{ height: `${expenseHeight}%`, minHeight: expenseHeight > 0 ? '4px' : '0' }}
                                            ></div>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-2">{month.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-primary rounded"></div>
                                <span className="text-sm">Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-danger rounded"></div>
                                <span className="text-sm">Expenses</span>
                            </div>
                        </div>

                        {/* Monthly Table */}
                        <div className="table-responsive mt-6">
                            <table className="table-striped">
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th className="text-right">Revenue</th>
                                        <th className="text-right">Expenses</th>
                                        <th className="text-right">Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.monthly_breakdown.map((month, index) => (
                                        <tr key={index}>
                                            <td className="font-medium">{month.label}</td>
                                            <td className="text-right">{formatCurrency(month.revenue)}</td>
                                            <td className="text-right text-danger">{formatCurrency(month.expenses)}</td>
                                            <td className={`text-right font-bold ${month.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {formatCurrency(month.profit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-10 text-gray-500">No monthly data available</div>
                )}
            </div>
        </div>
    );
};

export default ProfitLossReport;
