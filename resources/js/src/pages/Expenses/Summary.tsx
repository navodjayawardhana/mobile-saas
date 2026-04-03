import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetExpenseSummaryQuery } from '../../store/api/expensesApi';
import { useCurrency } from '../../hooks/useCurrency';

const ExpenseSummary = () => {
    const [dateRange, setDateRange] = useState({
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
    });

    const { data, isLoading } = useGetExpenseSummaryQuery(dateRange);
    const { formatCurrency } = useCurrency();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getMonthName = (month: number) => {
        return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
    };

    // Calculate max for chart scaling
    const maxMonthlyTotal = data?.monthly_breakdown ? Math.max(...data.monthly_breakdown.map((m) => m.total)) : 0;

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
                        <h5 className="text-lg font-semibold dark:text-white-light">Expense Summary</h5>
                        <p className="text-gray-500">Overview of your business expenses</p>
                    </div>
                    <Link to="/expenses" className="btn btn-outline-primary">
                        <svg className="w-4 h-4 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        All Expenses
                    </Link>
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="panel">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium">From Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={dateRange.date_from}
                            onChange={(e) => setDateRange({ ...dateRange, date_from: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">To Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={dateRange.date_to}
                            onChange={(e) => setDateRange({ ...dateRange, date_to: e.target.value })}
                        />
                    </div>
                    <div>
                        <button
                            onClick={() =>
                                setDateRange({
                                    date_from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                                    date_to: new Date().toISOString().split('T')[0],
                                })
                            }
                            className="btn btn-outline-secondary w-full"
                        >
                            Year to Date
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="panel bg-danger text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg opacity-80">Total Expenses</p>
                            <h2 className="text-3xl font-bold mt-2">{formatCurrency(data?.total_expenses || 0)}</h2>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="panel bg-info text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg opacity-80">Total Records</p>
                            <h2 className="text-3xl font-bold mt-2">{data?.expense_count || 0}</h2>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" />
                                <path d="M8 21h8M12 17v4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="panel bg-warning text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg opacity-80">Average Expense</p>
                            <h2 className="text-3xl font-bold mt-2">{formatCurrency(data?.average_expense || 0)}</h2>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 3v18h18" />
                                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Expenses by Category */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Expenses by Category</h5>
                    {data?.by_category && data.by_category.length > 0 ? (
                        <div className="space-y-4">
                            {data.by_category.map((cat, index) => {
                                const percentage = data.total_expenses > 0 ? (cat.total / data.total_expenses) * 100 : 0;
                                const colors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info', 'bg-secondary'];
                                return (
                                    <div key={cat.category_id || index}>
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium dark:text-white-light">{cat.category_name}</span>
                                            <span className="text-gray-500">
                                                {formatCurrency(cat.total)} ({cat.count} items)
                                            </span>
                                        </div>
                                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-right text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">No expense data available for this period</div>
                    )}
                </div>

                {/* Monthly Trend */}
                <div className="panel">
                    <h5 className="text-lg font-semibold mb-5 dark:text-white-light">Monthly Trend (Last 12 Months)</h5>
                    {data?.monthly_breakdown && data.monthly_breakdown.length > 0 ? (
                        <div className="flex items-end gap-2 h-64">
                            {data.monthly_breakdown.map((month, index) => {
                                const height = maxMonthlyTotal > 0 ? (month.total / maxMonthlyTotal) * 100 : 0;
                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        <div className="text-xs text-gray-500 mb-1">{formatCurrency(month.total)}</div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t flex-1 flex flex-col justify-end">
                                            <div
                                                className="bg-danger rounded-t transition-all duration-500"
                                                style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {getMonthName(month.month)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">No monthly data available</div>
                    )}
                </div>
            </div>

            {/* Recent Expenses */}
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="text-lg font-semibold dark:text-white-light">Recent Expenses</h5>
                    <Link to="/expenses" className="text-primary hover:underline">
                        View All
                    </Link>
                </div>
                {data?.recent_expenses && data.recent_expenses.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Added By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recent_expenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td className="whitespace-nowrap">{formatDate(expense.expense_date)}</td>
                                        <td>
                                            <span className="badge bg-info">{expense.category?.name || 'Unknown'}</span>
                                        </td>
                                        <td>{expense.description}</td>
                                        <td className="font-semibold text-danger">{formatCurrency(expense.amount)}</td>
                                        <td>{expense.user?.name || 'Unknown'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500">No recent expenses</div>
                )}
            </div>
        </div>
    );
};

export default ExpenseSummary;
