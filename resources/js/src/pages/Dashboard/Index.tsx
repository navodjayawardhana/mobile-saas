import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    useGetDashboardStatsQuery,
    useGetSalesChartQuery,
    useGetRecentSalesQuery,
    useGetRecentRepairsQuery,
    useGetDashboardLowStockQuery,
    useGetOverdueItemsQuery,
    useGetTopProductsQuery,
} from '../../store/api/dashboardApi';
import { useCurrency } from '../../hooks/useCurrency';

const Dashboard = () => {
    const [chartPeriod, setChartPeriod] = useState<'7days' | '30days' | '12months'>('7days');

    const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery();
    const { data: chartData } = useGetSalesChartQuery({ period: chartPeriod });
    const { data: recentSales } = useGetRecentSalesQuery();
    const { data: recentRepairs } = useGetRecentRepairsQuery();
    const { data: lowStock } = useGetDashboardLowStockQuery();
    const { data: overdue } = useGetOverdueItemsQuery();
    const { data: topProducts } = useGetTopProductsQuery({ days: 30 });
    const { formatCurrency } = useCurrency();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { class: string; label: string }> = {
            paid: { class: 'badge bg-success', label: 'Paid' },
            partial: { class: 'badge bg-warning', label: 'Partial' },
            unpaid: { class: 'badge bg-danger', label: 'Unpaid' },
            received: { class: 'badge bg-info', label: 'Received' },
            diagnosing: { class: 'badge bg-warning', label: 'Diagnosing' },
            in_progress: { class: 'badge bg-primary', label: 'In Progress' },
            completed: { class: 'badge bg-success', label: 'Completed' },
        };
        return statusMap[status] || { class: 'badge bg-secondary', label: status };
    };

    const getPriorityBadge = (priority: string) => {
        const priorityMap: Record<string, string> = {
            low: 'badge bg-secondary',
            normal: 'badge bg-info',
            high: 'badge bg-warning',
            urgent: 'badge bg-danger',
        };
        return priorityMap[priority] || 'badge bg-secondary';
    };

    // Calculate chart max for scaling
    const maxChartValue = chartData ? Math.max(...chartData.map((d) => Math.max(d.sales, d.expenses))) : 0;

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Today's Sales */}
                <div className="panel bg-primary text-white">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-lg opacity-80">Today's Sales</p>
                            <h2 className="text-3xl font-bold mt-2">{formatCurrency(stats?.today.sales_amount || 0)}</h2>
                            <p className="text-sm opacity-80 mt-1">{stats?.today.sales_count || 0} transactions</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Monthly Profit */}
                <div className="panel bg-success text-white">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-lg opacity-80">Monthly Profit</p>
                            <h2 className="text-3xl font-bold mt-2">{formatCurrency(stats?.month.profit || 0)}</h2>
                            <p className="text-sm opacity-80 mt-1">
                                Sales: {formatCurrency(stats?.month.sales_amount || 0)}
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 3v18h18" />
                                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Active Repairs */}
                <div className="panel bg-warning text-white">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-lg opacity-80">Active Repairs</p>
                            <h2 className="text-3xl font-bold mt-2">{stats?.repairs.active || 0}</h2>
                            {(stats?.repairs.overdue || 0) > 0 && (
                                <p className="text-sm mt-1">
                                    <span className="bg-white/30 px-2 py-0.5 rounded">{stats?.repairs.overdue} overdue</span>
                                </p>
                            )}
                        </div>
                        <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Low Stock */}
                <div className="panel bg-danger text-white">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-lg opacity-80">Low Stock Items</p>
                            <h2 className="text-3xl font-bold mt-2">{stats?.inventory.low_stock || 0}</h2>
                            <Link to="/inventory/stock/low-stock" className="text-sm underline opacity-80 mt-1 inline-block">
                                View all
                            </Link>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="panel">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-info-light flex items-center justify-center text-info">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Customer Dues</p>
                            <p className="font-bold text-lg">{formatCurrency(stats?.dues.customer_dues || 0)}</p>
                        </div>
                    </div>
                </div>
                <div className="panel">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-warning-light flex items-center justify-center text-warning">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="3" width="15" height="13" rx="2" />
                                <path d="M16 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
                                <path d="M5 6v11" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Supplier Dues</p>
                            <p className="font-bold text-lg">{formatCurrency(stats?.dues.supplier_dues || 0)}</p>
                        </div>
                    </div>
                </div>
                <div className="panel">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-danger-light flex items-center justify-center text-danger">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Overdue Installments</p>
                            <p className="font-bold text-lg">{stats?.installments.overdue || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="panel">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary-light flex items-center justify-center text-secondary">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 17H5a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm12-2h-4a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zM5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2v0" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Pending POs</p>
                            <p className="font-bold text-lg">{stats?.purchase_orders.pending || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Sales Chart */}
                <div className="panel lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="text-lg font-semibold dark:text-white-light">Sales Overview</h5>
                        <div className="flex gap-2">
                            {(['7days', '30days', '12months'] as const).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setChartPeriod(period)}
                                    className={`btn btn-sm ${chartPeriod === period ? 'btn-primary' : 'btn-outline-primary'}`}
                                >
                                    {period === '7days' ? '7 Days' : period === '30days' ? '30 Days' : '12 Months'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {chartData && chartData.length > 0 ? (
                        <div className="flex items-end gap-1 h-64">
                            {chartData.map((item, index) => {
                                const salesHeight = maxChartValue > 0 ? (item.sales / maxChartValue) * 100 : 0;
                                const expenseHeight = maxChartValue > 0 ? (item.expenses / maxChartValue) * 100 : 0;
                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center group relative">
                                        <div className="absolute bottom-full mb-2 bg-dark text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            <div>Sales: {formatCurrency(item.sales)}</div>
                                            <div>Expenses: {formatCurrency(item.expenses)}</div>
                                            <div>Profit: {formatCurrency(item.profit)}</div>
                                        </div>
                                        <div className="w-full flex gap-1 items-end h-52">
                                            <div
                                                className="flex-1 bg-primary rounded-t transition-all duration-300"
                                                style={{ height: `${salesHeight}%`, minHeight: salesHeight > 0 ? '4px' : '0' }}
                                            ></div>
                                            <div
                                                className="flex-1 bg-danger rounded-t transition-all duration-300"
                                                style={{ height: `${expenseHeight}%`, minHeight: expenseHeight > 0 ? '4px' : '0' }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                                            {chartPeriod === '12months' ? item.date.split('-')[1] : item.date.split('-').slice(1).join('/')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">No data available</div>
                    )}
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-primary rounded"></div>
                            <span className="text-sm">Sales</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-danger rounded"></div>
                            <span className="text-sm">Expenses</span>
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div className="panel">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="text-lg font-semibold dark:text-white-light">Top Selling Products</h5>
                        <span className="text-xs text-gray-500">Last 30 days</span>
                    </div>
                    {topProducts && topProducts.length > 0 ? (
                        <div className="space-y-4">
                            {topProducts.slice(0, 5).map((product, index) => (
                                <div key={product.id} className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-primary-light text-primary text-sm flex items-center justify-center font-bold">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate dark:text-white-light">{product.name}</p>
                                        <p className="text-xs text-gray-500">{product.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{product.total_qty} sold</p>
                                        <p className="text-xs text-success">{formatCurrency(product.total_revenue)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">No sales data</div>
                    )}
                </div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent Sales */}
                <div className="panel">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="text-lg font-semibold dark:text-white-light">Recent Sales</h5>
                        <Link to="/sales" className="text-primary hover:underline text-sm">
                            View All
                        </Link>
                    </div>
                    {recentSales && recentSales.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Invoice</th>
                                        <th>Customer</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentSales.slice(0, 5).map((sale) => (
                                        <tr key={sale.id}>
                                            <td>
                                                <Link to={`/sales/${sale.id}`} className="text-primary hover:underline">
                                                    {sale.invoice_number}
                                                </Link>
                                            </td>
                                            <td>{sale.customer_name}</td>
                                            <td className="font-semibold">{formatCurrency(sale.total_amount)}</td>
                                            <td>
                                                <span className={getStatusBadge(sale.payment_status).class}>
                                                    {getStatusBadge(sale.payment_status).label}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">No recent sales</div>
                    )}
                </div>

                {/* Recent Repairs */}
                <div className="panel">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="text-lg font-semibold dark:text-white-light">Recent Repairs</h5>
                        <Link to="/repairs" className="text-primary hover:underline text-sm">
                            View All
                        </Link>
                    </div>
                    {recentRepairs && recentRepairs.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Job #</th>
                                        <th>Device</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRepairs.slice(0, 5).map((repair) => (
                                        <tr key={repair.id}>
                                            <td>
                                                <Link to={`/repairs/${repair.id}`} className="text-primary hover:underline">
                                                    {repair.job_number}
                                                </Link>
                                            </td>
                                            <td className="max-w-[150px] truncate">{repair.device}</td>
                                            <td>
                                                <span className={getStatusBadge(repair.status).class}>
                                                    {getStatusBadge(repair.status).label}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getPriorityBadge(repair.priority)}>{repair.priority}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">No recent repairs</div>
                    )}
                </div>
            </div>

            {/* Alerts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Low Stock Alerts */}
                <div className="panel">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="text-lg font-semibold dark:text-white-light">Low Stock Alerts</h5>
                        <Link to="/inventory/stock/low-stock" className="text-primary hover:underline text-sm">
                            View All
                        </Link>
                    </div>
                    {lowStock && lowStock.length > 0 ? (
                        <div className="space-y-3">
                            {lowStock.slice(0, 5).map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-danger-light rounded">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-danger font-bold">{item.current_stock} left</p>
                                        <p className="text-xs text-gray-500">Min: {item.min_stock_alert}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-success">
                            <svg className="w-12 h-12 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <p>All stock levels are healthy!</p>
                        </div>
                    )}
                </div>

                {/* Overdue Items */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Overdue Items</h5>
                    {(overdue?.repairs?.length || 0) + (overdue?.installments?.length || 0) > 0 ? (
                        <div className="space-y-3">
                            {overdue?.repairs?.slice(0, 3).map((item) => (
                                <div key={`repair-${item.id}`} className="flex items-center justify-between p-3 bg-warning-light rounded">
                                    <div>
                                        <span className="badge bg-warning mr-2">Repair</span>
                                        <span className="font-medium">{item.reference}</span>
                                        <p className="text-xs text-gray-500">{item.customer_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-danger font-bold">{item.days_overdue} days overdue</p>
                                    </div>
                                </div>
                            ))}
                            {overdue?.installments?.slice(0, 3).map((item) => (
                                <div key={`installment-${item.id}`} className="flex items-center justify-between p-3 bg-danger-light rounded">
                                    <div>
                                        <span className="badge bg-danger mr-2">Payment</span>
                                        <span className="font-medium">{item.reference}</span>
                                        <p className="text-xs text-gray-500">{item.customer_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-danger font-bold">{formatCurrency(item.amount || 0)}</p>
                                        <p className="text-xs text-gray-500">{item.days_overdue} days overdue</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-success">
                            <svg className="w-12 h-12 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <p>No overdue items!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
