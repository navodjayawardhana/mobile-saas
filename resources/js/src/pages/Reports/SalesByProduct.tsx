import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSalesByProductQuery } from '../../store/api/reportsApi';
import { useGetCategoriesQuery, useGetBrandsQuery } from '../../store/api/inventoryApi';
import { useCurrency } from '../../hooks/useCurrency';

const SalesByProduct = () => {
    const [dateRange, setDateRange] = useState({
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
    });
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    const { data: categories } = useGetCategoriesQuery({});
    const { data: brands } = useGetBrandsQuery({});

    const { data, isLoading } = useGetSalesByProductQuery({
        ...dateRange,
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
            const params = new URLSearchParams({
                date_from: dateRange.date_from,
                date_to: dateRange.date_to,
            });
            if (categoryId) params.append('category_id', categoryId);
            if (brandId) params.append('brand_id', brandId);

            const response = await fetch(`/api/v1/reports/sales/by-product/export-pdf?${params}`, {
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
            a.download = `sales_by_product_${dateRange.date_from}_to_${dateRange.date_to}.pdf`;
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
        setPage(1);
    };

    const resetFilters = () => {
        setCategoryId('');
        setBrandId('');
        setPage(1);
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
            {/* Header */}
            <div className="panel">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h5 className="text-lg font-semibold dark:text-white-light">Sales by Product</h5>
                        <p className="text-gray-500">Product performance analysis</p>
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
                <div className="flex flex-wrap items-end gap-4">
                    {/* Date Range */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">From:</label>
                        <input
                            type="date"
                            className="form-input w-auto"
                            value={dateRange.date_from}
                            onChange={(e) => {
                                setDateRange({ ...dateRange, date_from: e.target.value });
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">To:</label>
                        <input
                            type="date"
                            className="form-input w-auto"
                            value={dateRange.date_to}
                            onChange={(e) => {
                                setDateRange({ ...dateRange, date_to: e.target.value });
                                setPage(1);
                            }}
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Category:</label>
                        <select
                            className="form-select w-auto"
                            value={categoryId}
                            onChange={(e) => {
                                setCategoryId(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All Categories</option>
                            {categories?.data?.map((cat: any) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Brand Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Brand:</label>
                        <select
                            className="form-select w-auto"
                            value={brandId}
                            onChange={(e) => {
                                setBrandId(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All Brands</option>
                            {brands?.data?.map((brand: any) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {(categoryId || brandId) && (
                        <button onClick={resetFilters} className="btn btn-sm btn-outline-danger">
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Preset Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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

            {/* Products Table */}
            <div className="panel">
                <div className="table-responsive">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Category</th>
                                <th>Brand</th>
                                <th className="text-center">Qty Sold</th>
                                <th className="text-right">Avg Price</th>
                                <th className="text-right">Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.data && data.data.length > 0 ? (
                                data.data.map((product, index) => (
                                    <tr key={product.id}>
                                        <td>{(page - 1) * 20 + index + 1}</td>
                                        <td className="font-medium">{product.name}</td>
                                        <td className="text-gray-500">{product.sku || '-'}</td>
                                        <td>{product.category_name || '-'}</td>
                                        <td>{product.brand_name || '-'}</td>
                                        <td className="text-center">
                                            <span className="badge bg-primary">{product.total_qty}</span>
                                        </td>
                                        <td className="text-right">{formatCurrency(product.avg_price)}</td>
                                        <td className="text-right font-semibold text-success">{formatCurrency(product.total_revenue)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-gray-500">
                                        No sales data for this period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-between mt-5">
                        <div className="text-sm text-gray-500">
                            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} products
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className="btn btn-sm btn-outline-primary disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="btn btn-sm btn-primary pointer-events-none">
                                {page} / {data.last_page}
                            </span>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page === data.last_page}
                                className="btn btn-sm btn-outline-primary disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesByProduct;
