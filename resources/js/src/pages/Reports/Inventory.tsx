import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetInventoryReportQuery } from '../../store/api/reportsApi';
import { useCurrency } from '../../hooks/useCurrency';

const InventoryReport = () => {
    const [isExporting, setIsExporting] = useState(false);
    const { data, isLoading } = useGetInventoryReportQuery({});
    const { formatCurrency } = useCurrency();

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/v1/reports/inventory/export-pdf', {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
            });
            if (!response.ok) throw new Error('Failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.pdf`;
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
                        <h5 className="text-lg font-semibold dark:text-white-light">Inventory Report</h5>
                        <p className="text-gray-500">Stock overview and analysis</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportPdf} className="btn btn-dark" disabled={isExporting}>
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </button>
                        <Link to="/reports" className="btn btn-outline-primary">All Reports</Link>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="panel bg-primary text-white">
                    <p className="text-sm opacity-80">Total Products</p>
                    <h2 className="text-2xl font-bold">{data?.summary?.total_products || 0}</h2>
                </div>
                <div className="panel bg-success text-white">
                    <p className="text-sm opacity-80">Active Products</p>
                    <h2 className="text-2xl font-bold">{data?.summary?.active_products || 0}</h2>
                </div>
                <div className="panel bg-warning text-white">
                    <p className="text-sm opacity-80">Low Stock</p>
                    <h2 className="text-2xl font-bold">{data?.summary?.low_stock || 0}</h2>
                </div>
                <div className="panel bg-danger text-white">
                    <p className="text-sm opacity-80">Out of Stock</p>
                    <h2 className="text-2xl font-bold">{data?.summary?.out_of_stock || 0}</h2>
                </div>
            </div>

            {/* Value Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="panel">
                    <p className="text-gray-500">Stock Value (Cost)</p>
                    <h2 className="text-xl font-bold">{formatCurrency(data?.summary?.total_stock_value || 0)}</h2>
                </div>
                <div className="panel">
                    <p className="text-gray-500">Retail Value</p>
                    <h2 className="text-xl font-bold">{formatCurrency(data?.summary?.total_retail_value || 0)}</h2>
                </div>
                <div className="panel">
                    <p className="text-gray-500 ">Potential Profit</p>
                    <h2 className="text-xl font-bold text-success">{formatCurrency(data?.summary?.potential_profit || 0)}</h2>
                </div>
            </div>

            {/* By Category */}
            <div className="panel">
                <h5 className="text-lg font-semibold mb-4 dark:text-white-light">By Category</h5>
                <div className="table-responsive">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th className="text-center">Products</th>
                                <th className="text-center">Total Stock</th>
                                <th className="text-right">Stock Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.by_category?.map((cat: any) => (
                                <tr key={cat.id}>
                                    <td className="font-medium">{cat.name || 'Uncategorized'}</td>
                                    <td className="text-center">{cat.product_count}</td>
                                    <td className="text-center">{cat.total_stock}</td>
                                    <td className="text-right">{formatCurrency(cat.stock_value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* By Brand */}
            <div className="panel">
                <h5 className="text-lg font-semibold mb-4 dark:text-white-light">By Brand</h5>
                <div className="table-responsive">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>Brand</th>
                                <th className="text-center">Products</th>
                                <th className="text-center">Total Stock</th>
                                <th className="text-right">Stock Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.by_brand?.map((brand: any) => (
                                <tr key={brand.id}>
                                    <td className="font-medium">{brand.name || 'No Brand'}</td>
                                    <td className="text-center">{brand.product_count}</td>
                                    <td className="text-center">{brand.total_stock}</td>
                                    <td className="text-right">{formatCurrency(brand.stock_value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryReport;
