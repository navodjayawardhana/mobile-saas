import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetInventoryValuationQuery } from '../../store/api/reportsApi';
import { useGetCategoriesQuery, useGetBrandsQuery } from '../../store/api/inventoryApi';
import { useCurrency } from '../../hooks/useCurrency';

const InventoryValuation = () => {
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    const { data: categories } = useGetCategoriesQuery({});
    const { data: brands } = useGetBrandsQuery({});
    const { data, isLoading } = useGetInventoryValuationQuery({
        category_id: categoryId || undefined,
        brand_id: brandId || undefined,
        page,
        per_page: 20,
    });
    const { formatCurrency } = useCurrency();

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams();
            if (categoryId) params.append('category_id', categoryId);
            if (brandId) params.append('brand_id', brandId);

            const response = await fetch(`/api/v1/reports/inventory/valuation/export-pdf?${params}`, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
            });
            if (!response.ok) throw new Error('Failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventory_valuation_${new Date().toISOString().split('T')[0]}.pdf`;
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
                        <h5 className="text-lg font-semibold dark:text-white-light">Stock Valuation</h5>
                        <p className="text-gray-500">Detailed stock value analysis</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportPdf} className="btn btn-dark" disabled={isExporting}>
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </button>
                        <Link to="/reports/inventory" className="btn btn-outline-primary">Inventory Report</Link>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="panel">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Category:</label>
                        <select className="form-select w-auto" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
                            <option value="">All Categories</option>
                            {categories?.data?.map((cat: any) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Brand:</label>
                        <select className="form-select w-auto" value={brandId} onChange={(e) => { setBrandId(e.target.value); setPage(1); }}>
                            <option value="">All Brands</option>
                            {brands?.data?.map((brand: any) => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                        </select>
                    </div>
                    {(categoryId || brandId) && (
                        <button onClick={() => { setCategoryId(''); setBrandId(''); setPage(1); }} className="btn btn-sm btn-outline-danger">
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="panel">
                    <p className="text-gray-500">Stock Value (Cost)</p>
                    <h2 className="text-xl font-bold">{formatCurrency(data?.totals?.stock_value || 0)}</h2>
                </div>
                <div className="panel">
                    <p className="text-gray-500">Retail Value</p>
                    <h2 className="text-xl font-bold">{formatCurrency(data?.totals?.retail_value || 0)}</h2>
                </div>
                <div className="panel">
                    <p className="text-gray-500">Potential Profit</p>
                    <h2 className="text-xl font-bold text-success">{formatCurrency(data?.totals?.potential_profit || 0)}</h2>
                </div>
            </div>

            {/* Table */}
            <div className="panel">
                <div className="table-responsive">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>SKU</th>
                                <th className="text-center">Stock</th>
                                <th className="text-right">Cost</th>
                                <th className="text-right">Sell Price</th>
                                <th className="text-right">Stock Value</th>
                                <th className="text-right">Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.products?.data?.map((p: any, i: number) => (
                                <tr key={p.id}>
                                    <td>{(page - 1) * 20 + i + 1}</td>
                                    <td className="font-medium">{p.name}</td>
                                    <td className="text-gray-500">{p.sku || '-'}</td>
                                    <td className="text-center">{p.quantity}</td>
                                    <td className="text-right">{formatCurrency(p.cost_price)}</td>
                                    <td className="text-right">{formatCurrency(p.selling_price)}</td>
                                    <td className="text-right">{formatCurrency(p.stock_value)}</td>
                                    <td className="text-right text-success">{formatCurrency(p.potential_profit)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data?.products && data.products.last_page > 1 && (
                    <div className="flex items-center justify-between mt-5">
                        <div className="text-sm text-gray-500">
                            Page {page} of {data.products.last_page}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn btn-sm btn-outline-primary disabled:opacity-50">Previous</button>
                            <button onClick={() => setPage(page + 1)} disabled={page === data.products.last_page} className="btn btn-sm btn-outline-primary disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryValuation;
