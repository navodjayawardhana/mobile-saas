import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useGetSalesReportQuery, useGetSalesByCategoryQuery, useGetSalesByStaffQuery } from '../../store/api/reportsApi';
import { useCurrency } from '../../hooks/useCurrency';

const SalesReport = () => {
    const [dateRange, setDateRange] = useState({
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
    });
    const [isExporting, setIsExporting] = useState(false);

    const { data: report, isLoading } = useGetSalesReportQuery(dateRange);
    const { data: categoryReport } = useGetSalesByCategoryQuery(dateRange);
    const { data: staffReport } = useGetSalesByStaffQuery(dateRange);
    const { formatCurrency, symbol } = useCurrency();

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(
                `/api/v1/reports/sales/export-pdf?date_from=${dateRange.date_from}&date_to=${dateRange.date_to}`,
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
            a.download = `sales_report_${dateRange.date_from}_to_${dateRange.date_to}.pdf`;
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

    const setPresetRange = (preset: string) => {
        const today = new Date();
        let from: Date;
        let to = today;

        switch (preset) {
            case 'today':
                from = today;
                break;
            case 'yesterday':
                from = new Date(today);
                from.setDate(from.getDate() - 1);
                to = from;
                break;
            case 'week':
                from = new Date(today);
                from.setDate(from.getDate() - 7);
                break;
            case 'month':
                from = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'quarter':
                from = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
                break;
            case 'year':
                from = new Date(today.getFullYear(), 0, 1);
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

    // Calculate chart max
    const maxDailyValue = report?.daily_breakdown ? Math.max(...report.daily_breakdown.map((d) => d.total)) : 0;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="panel">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h5 className="text-lg font-semibold dark:text-white-light">Sales Report</h5>
                        <p className="text-gray-500">Comprehensive sales analysis</p>
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
                        <button onClick={() => setPresetRange('today')} className="btn btn-sm btn-outline-secondary">
                            Today
                        </button>
                        <button onClick={() => setPresetRange('week')} className="btn btn-sm btn-outline-secondary">
                            Last 7 Days
                        </button>
                        <button onClick={() => setPresetRange('month')} className="btn btn-sm btn-outline-secondary">
                            This Month
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="panel bg-primary text-white">
                    <p className="text-lg opacity-80">Total Sales</p>
                    <h2 className="text-2xl font-bold mt-1">{formatCurrency(report?.summary.total_sales || 0)}</h2>
                    <p className="text-sm opacity-80 mt-1">{report?.summary.total_transactions || 0} transactions</p>
                </div>
                <div className="panel bg-success text-white">
                    <p className="text-lg opacity-80">Collected</p>
                    <h2 className="text-2xl font-bold mt-1">{formatCurrency(report?.summary.paid_amount || 0)}</h2>
                </div>
                <div className="panel bg-warning text-white">
                    <p className="text-lg opacity-80">Outstanding</p>
                    <h2 className="text-2xl font-bold mt-1">{formatCurrency(report?.summary.due_amount || 0)}</h2>
                </div>
                <div className="panel bg-info text-white">
                    <p className="text-lg opacity-80">Average Sale</p>
                    <h2 className="text-2xl font-bold mt-1">{formatCurrency(report?.summary.average_sale || 0)}</h2>
                </div>
            </div>

            {/* Daily Sales Chart */}
            <div className="panel">
                <h5 className="text-lg font-semibold mb-4 dark:text-white-light">Daily Sales</h5>
                {report?.daily_breakdown && report.daily_breakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                            data={report.daily_breakdown.slice(-14).map((d) => ({
                                ...d,
                                date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            }))}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickFormatter={(value) => `${symbol}${(value / 1000).toFixed(0)}k`}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                }}
                                formatter={(value: number) => [formatCurrency(value), 'Sales']}
                                labelStyle={{ color: '#9ca3af' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#4361ee"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorSales)"
                                dot={{ r: 4, fill: '#4361ee', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, fill: '#4361ee', strokeWidth: 2, stroke: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center py-8 text-gray-500">No sales data for this period</div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Payment Status Breakdown */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Payment Status</h5>
                    {report?.payment_breakdown && report.payment_breakdown.length > 0 ? (
                        <div className="space-y-4">
                            {report.payment_breakdown.map((item, index) => {
                                const percentage = report.summary.total_sales > 0 ? (item.total / report.summary.total_sales) * 100 : 0;
                                const colors: Record<string, string> = {
                                    paid: 'bg-success',
                                    partial: 'bg-warning',
                                    unpaid: 'bg-danger',
                                };
                                return (
                                    <div key={index}>
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium capitalize dark:text-white-light">{item.payment_status}</span>
                                            <span className="text-gray-500">
                                                {formatCurrency(item.total)} ({item.count})
                                            </span>
                                        </div>
                                        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors[item.payment_status] || 'bg-secondary'} rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">No data available</div>
                    )}
                </div>

                {/* Sale Type Breakdown */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Sale Type</h5>
                    {report?.type_breakdown && report.type_breakdown.length > 0 ? (
                        <div className="space-y-4">
                            {report.type_breakdown.map((item, index) => {
                                const percentage = report.summary.total_sales > 0 ? (item.total / report.summary.total_sales) * 100 : 0;
                                return (
                                    <div key={index}>
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium capitalize dark:text-white-light">{item.sale_type}</span>
                                            <span className="text-gray-500">
                                                {formatCurrency(item.total)} ({item.count})
                                            </span>
                                        </div>
                                        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-info rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">No data available</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Sales by Category */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Sales by Category</h5>
                    {categoryReport?.categories && categoryReport.categories.length > 0 ? (
                        <div className="space-y-4">
                            {categoryReport.categories.map((cat, index) => (
                                <div key={index}>
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium dark:text-white-light">{cat.name || 'Uncategorized'}</span>
                                        <span className="text-gray-500">{formatCurrency(cat.total_revenue)}</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                            style={{ width: `${cat.percentage}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-right text-xs text-gray-500 mt-1">
                                        {cat.total_qty} items | {cat.percentage}%
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">No data available</div>
                    )}
                </div>

                {/* Sales by Staff */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Sales by Staff</h5>
                    {staffReport?.staff && staffReport.staff.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table-striped">
                                <thead>
                                    <tr>
                                        <th>Staff</th>
                                        <th className="text-center">Transactions</th>
                                        <th className="text-right">Total Sales</th>
                                        <th className="text-right">Avg Sale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffReport.staff.map((staff) => (
                                        <tr key={staff.id}>
                                            <td className="font-medium">{staff.name}</td>
                                            <td className="text-center">{staff.transaction_count}</td>
                                            <td className="text-right font-semibold">{formatCurrency(staff.total_sales)}</td>
                                            <td className="text-right text-gray-500">{formatCurrency(staff.avg_sale)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">No data available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesReport;
