import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetCustomerDuesReportQuery } from '../../store/api/reportsApi';
import { useCurrency } from '../../hooks/useCurrency';

const CustomerDues = () => {
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    const { data, isLoading } = useGetCustomerDuesReportQuery({ page, per_page: 20 });
    const { formatCurrency } = useCurrency();

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/v1/reports/dues/customers/export-pdf', {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
            });
            if (!response.ok) throw new Error('Failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `customer_dues_${new Date().toISOString().split('T')[0]}.pdf`;
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
                        <h5 className="text-lg font-semibold dark:text-white-light">Customer Dues</h5>
                        <p className="text-gray-500">Outstanding amounts from customers</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportPdf} className="btn btn-dark" disabled={isExporting}>
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </button>
                        <Link to="/reports" className="btn btn-outline-primary">All Reports</Link>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="panel bg-danger text-white">
                    <p className="text-sm opacity-80">Total Outstanding</p>
                    <h2 className="text-2xl font-bold">{formatCurrency(data?.summary?.total_due || 0)}</h2>
                </div>
                <div className="panel bg-warning text-white">
                    <p className="text-sm opacity-80">Customers with Due</p>
                    <h2 className="text-2xl font-bold">{data?.summary?.customers_with_due || 0}</h2>
                </div>
            </div>

            {/* Table */}
            <div className="panel">
                <div className="table-responsive">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th className="text-center">Invoices</th>
                                <th className="text-right">Total Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.customers?.data?.map((c: any, i: number) => (
                                <tr key={c.id}>
                                    <td>{(page - 1) * 20 + i + 1}</td>
                                    <td className="font-medium">{c.name}</td>
                                    <td>{c.phone || '-'}</td>
                                    <td className="text-center">
                                        <span className="badge bg-warning">{c.unpaid_invoices || c.invoice_count}</span>
                                    </td>
                                    <td className="text-right text-danger font-semibold">{formatCurrency(c.total_due)}</td>
                                </tr>
                            ))}
                            {(!data?.customers?.data || data.customers.data.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">No outstanding dues</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {data?.customers && data.customers.last_page > 1 && (
                    <div className="flex items-center justify-between mt-5">
                        <div className="text-sm text-gray-500">Page {page} of {data.customers.last_page}</div>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn btn-sm btn-outline-primary disabled:opacity-50">Previous</button>
                            <button onClick={() => setPage(page + 1)} disabled={page === data.customers.last_page} className="btn btn-sm btn-outline-primary disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDues;
