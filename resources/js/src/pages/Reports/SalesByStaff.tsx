import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSalesByStaffQuery } from '../../store/api/reportsApi';
import { useCurrency } from '../../hooks/useCurrency';

const SalesByStaff = () => {
    const [dateRange, setDateRange] = useState({
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
    });
    const [isExporting, setIsExporting] = useState(false);

    const { data, isLoading } = useGetSalesByStaffQuery(dateRange);
    const { formatCurrency } = useCurrency();

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams({
                date_from: dateRange.date_from,
                date_to: dateRange.date_to,
            });

            const response = await fetch(`/api/v1/reports/sales/by-staff/export-pdf?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/pdf',
                },
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales_by_staff_${dateRange.date_from}_to_${dateRange.date_to}.pdf`;
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

    const totals = {
        transactions: data?.staff?.reduce((sum: number, s: any) => sum + s.transaction_count, 0) || 0,
        sales: data?.staff?.reduce((sum: number, s: any) => sum + s.total_sales, 0) || 0,
        collected: data?.staff?.reduce((sum: number, s: any) => sum + s.total_collected, 0) || 0,
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="panel">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h5 className="text-lg font-semibold dark:text-white-light">Sales by Staff</h5>
                        <p className="text-gray-500">Staff performance analysis</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportPdf} className="btn btn-dark" disabled={isExporting}>
                            {isExporting ? (
                                <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4 inline-block ltr:mr-2 rtl:ml-2"></span>
                            ) : (
                                <svg className="w-4 h-4 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                </svg>
                            )}
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </button>
                        <Link to="/reports/sales" className="btn btn-outline-primary">
                            Sales Report
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filters */}
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

            {/* Staff Table */}
            <div className="panel">
                <div className="table-responsive">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Staff Name</th>
                                <th className="text-center">Transactions</th>
                                <th className="text-right">Total Sales</th>
                                <th className="text-right">Collected</th>
                                <th className="text-right">Avg Sale</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.staff && data.staff.length > 0 ? (
                                <>
                                    {data.staff.map((staff: any, index: number) => (
                                        <tr key={staff.id}>
                                            <td>{index + 1}</td>
                                            <td className="font-medium">{staff.name}</td>
                                            <td className="text-center">
                                                <span className="badge bg-primary">{staff.transaction_count}</span>
                                            </td>
                                            <td className="text-right font-semibold">{formatCurrency(staff.total_sales)}</td>
                                            <td className="text-right text-success">{formatCurrency(staff.total_collected)}</td>
                                            <td className="text-right text-gray-500">{formatCurrency(staff.avg_sale)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                                        <td colSpan={2} className="text-right">Total:</td>
                                        <td className="text-center">{totals.transactions}</td>
                                        <td className="text-right">{formatCurrency(totals.sales)}</td>
                                        <td className="text-right">{formatCurrency(totals.collected)}</td>
                                        <td></td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">
                                        No sales data for this period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesByStaff;
