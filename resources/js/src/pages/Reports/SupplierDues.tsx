import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSupplierDuesReportQuery } from '../../store/api/reportsApi';
import { useCurrency } from '../../hooks/useCurrency';

const SupplierDues = () => {
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    const { data, isLoading } = useGetSupplierDuesReportQuery({ page, per_page: 20 });
    const { formatCurrency } = useCurrency();

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/v1/reports/dues/suppliers/export-pdf', {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
            });
            if (!response.ok) throw new Error('Failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `supplier_dues_${new Date().toISOString().split('T')[0]}.pdf`;
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
                        <h5 className="text-lg font-semibold dark:text-white-light">Supplier Dues</h5>
                        <p className="text-gray-500">Outstanding amounts to suppliers</p>
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
                    <p className="text-sm opacity-80">Suppliers with Due</p>
                    <h2 className="text-2xl font-bold">{data?.summary?.suppliers_with_due || 0}</h2>
                </div>
            </div>

            {/* Table */}
            <div className="panel">
                <div className="table-responsive">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Supplier</th>
                                <th>Contact</th>
                                <th>Phone</th>
                                <th className="text-center">Unpaid POs</th>
                                <th className="text-right">Total Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.suppliers?.data?.map((s: any, i: number) => (
                                <tr key={s.id}>
                                    <td>{(page - 1) * 20 + i + 1}</td>
                                    <td className="font-medium">{s.name}</td>
                                    <td>{s.contact_person || '-'}</td>
                                    <td>{s.phone || '-'}</td>
                                    <td className="text-center">
                                        <span className="badge bg-warning">{s.unpaid_pos || s.po_count}</span>
                                    </td>
                                    <td className="text-right text-danger font-semibold">{formatCurrency(s.total_due)}</td>
                                </tr>
                            ))}
                            {(!data?.suppliers?.data || data.suppliers.data.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">No outstanding dues</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {data?.suppliers && data.suppliers.last_page > 1 && (
                    <div className="flex items-center justify-between mt-5">
                        <div className="text-sm text-gray-500">Page {page} of {data.suppliers.last_page}</div>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn btn-sm btn-outline-primary disabled:opacity-50">Previous</button>
                            <button onClick={() => setPage(page + 1)} disabled={page === data.suppliers.last_page} className="btn btn-sm btn-outline-primary disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierDues;
