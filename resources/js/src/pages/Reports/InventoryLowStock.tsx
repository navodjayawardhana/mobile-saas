import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetLowStockReportQuery } from '../../store/api/reportsApi';
import { useCurrency } from '../../hooks/useCurrency';

const InventoryLowStock = () => {
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    const { data, isLoading } = useGetLowStockReportQuery({ page, per_page: 20 });
    const { formatCurrency } = useCurrency();

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/v1/reports/inventory/low-stock/export-pdf', {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
            });
            if (!response.ok) throw new Error('Failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `low_stock_report_${new Date().toISOString().split('T')[0]}.pdf`;
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
                        <h5 className="text-lg font-semibold dark:text-white-light">Low Stock Report</h5>
                        <p className="text-gray-500">Products below minimum stock level</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportPdf} className="btn btn-dark" disabled={isExporting}>
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </button>
                        <Link to="/reports/inventory" className="btn btn-outline-primary">Inventory Report</Link>
                    </div>
                </div>
            </div>

            <div className="panel">
                <div className="table-responsive">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Category</th>
                                <th className="text-center">Current</th>
                                <th className="text-center">Min Level</th>
                                <th className="text-center">Shortage</th>
                                <th className="text-right">Restock Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.data?.map((p: any, i: number) => (
                                <tr key={p.id}>
                                    <td>{(page - 1) * 20 + i + 1}</td>
                                    <td className="font-medium">{p.name}</td>
                                    <td className="text-gray-500">{p.sku || '-'}</td>
                                    <td>{p.category || '-'}</td>
                                    <td className="text-center">
                                        <span className={`badge ${p.quantity === 0 ? 'bg-danger' : 'bg-warning'}`}>
                                            {p.quantity}
                                        </span>
                                    </td>
                                    <td className="text-center">{p.min_stock_alert}</td>
                                    <td className="text-center text-danger">{p.shortage || (p.min_stock_alert - p.quantity)}</td>
                                    <td className="text-right">{formatCurrency(p.restock_value || (p.shortage * p.cost_price))}</td>
                                </tr>
                            ))}
                            {(!data?.data || data.data.length === 0) && (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-gray-500">No low stock items</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-between mt-5">
                        <div className="text-sm text-gray-500">Page {page} of {data.last_page}</div>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn btn-sm btn-outline-primary disabled:opacity-50">Previous</button>
                            <button onClick={() => setPage(page + 1)} disabled={page === data.last_page} className="btn btn-sm btn-outline-primary disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryLowStock;
