import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useGetStockMovementsQuery, useGetMovementTypesQuery, useGetProductsQuery } from '../../../store/api/inventoryApi';

const StockIndex = () => {
    const [searchParams] = useSearchParams();
    const initialProductId = searchParams.get('product_id') || '';

    const [page, setPage] = useState(1);
    const [productId, setProductId] = useState(initialProductId);
    const [type, setType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { data, isLoading } = useGetStockMovementsQuery({
        page,
        product_id: productId || undefined,
        type: type || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
    });

    const { data: typesData } = useGetMovementTypesQuery();
    const { data: productsData } = useGetProductsQuery({ per_page: 100 });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getMovementTypeLabel = (t: string) => {
        switch (t) {
            case 'purchase': return { label: 'Purchase', class: 'bg-success', sign: '+' };
            case 'sale': return { label: 'Sale', class: 'bg-info', sign: '-' };
            case 'adjustment_in': return { label: 'Adjustment In', class: 'bg-primary', sign: '+' };
            case 'adjustment_out': return { label: 'Adjustment Out', class: 'bg-warning', sign: '-' };
            case 'return_in': return { label: 'Return (In)', class: 'bg-secondary', sign: '+' };
            case 'return_out': return { label: 'Return (Out)', class: 'bg-secondary', sign: '-' };
            case 'damage': return { label: 'Damage', class: 'bg-danger', sign: '-' };
            default: return { label: t, class: 'bg-dark', sign: '' };
        }
    };

    const clearFilters = () => {
        setProductId('');
        setType('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="panel">
            <div className="flex flex-col md:flex-row items-center justify-between mb-5 gap-4">
                <h5 className="text-lg font-semibold dark:text-white-light">Stock Movements</h5>
                <div className="flex gap-2">
                    <Link to="/inventory/stock/low-stock" className="btn btn-outline-warning">
                        Low Stock Alerts
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
                <select
                    className="form-select"
                    value={productId}
                    onChange={(e) => {
                        setProductId(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Products</option>
                    {productsData?.products.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                        </option>
                    ))}
                </select>
                <select
                    className="form-select"
                    value={type}
                    onChange={(e) => {
                        setType(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Types</option>
                    {typesData?.types.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
                <input
                    type="date"
                    className="form-input"
                    value={dateFrom}
                    onChange={(e) => {
                        setDateFrom(e.target.value);
                        setPage(1);
                    }}
                    placeholder="From Date"
                />
                <input
                    type="date"
                    className="form-input"
                    value={dateTo}
                    onChange={(e) => {
                        setDateTo(e.target.value);
                        setPage(1);
                    }}
                    placeholder="To Date"
                />
                <button type="button" className="btn btn-outline-dark" onClick={clearFilters}>
                    Clear Filters
                </button>
            </div>

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>User</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.movements.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-gray-500 py-10">
                                    No stock movements found
                                </td>
                            </tr>
                        ) : (
                            data?.movements.map((movement) => {
                                const typeInfo = getMovementTypeLabel(movement.type);
                                return (
                                    <tr key={movement.id}>
                                        <td className="whitespace-nowrap">{formatDate(movement.created_at)}</td>
                                        <td>
                                            <Link
                                                to={`/inventory/products/${movement.product_id}`}
                                                className="text-primary hover:underline font-medium"
                                            >
                                                {movement.product?.name}
                                            </Link>
                                            <p className="text-xs text-gray-500">{movement.product?.sku}</p>
                                        </td>
                                        <td>
                                            <span className={`badge ${typeInfo.class}`}>{typeInfo.label}</span>
                                        </td>
                                        <td>
                                            <span className={`font-bold ${typeInfo.sign === '+' ? 'text-success' : 'text-danger'}`}>
                                                {typeInfo.sign}{movement.quantity}
                                            </span>
                                        </td>
                                        <td>{movement.user?.name || '-'}</td>
                                        <td className="max-w-xs truncate">{movement.notes || '-'}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {data?.meta && data.meta.last_page > 1 && (
                <div className="flex justify-center mt-5">
                    <ul className="inline-flex items-center space-x-1 rtl:space-x-reverse">
                        <li>
                            <button
                                type="button"
                                className="flex justify-center font-semibold px-3.5 py-2 rounded transition bg-white-light text-dark hover:text-white hover:bg-primary dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary disabled:opacity-50"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Prev
                            </button>
                        </li>
                        {Array.from({ length: Math.min(data.meta.last_page, 5) }, (_, i) => {
                            let pageNum;
                            if (data.meta.last_page <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= data.meta.last_page - 2) {
                                pageNum = data.meta.last_page - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }
                            return (
                                <li key={pageNum}>
                                    <button
                                        type="button"
                                        className={`flex justify-center font-semibold px-3.5 py-2 rounded transition ${
                                            pageNum === page
                                                ? 'bg-primary text-white'
                                                : 'bg-white-light text-dark hover:text-white hover:bg-primary dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary'
                                        }`}
                                        onClick={() => setPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                </li>
                            );
                        })}
                        <li>
                            <button
                                type="button"
                                className="flex justify-center font-semibold px-3.5 py-2 rounded transition bg-white-light text-dark hover:text-white hover:bg-primary dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary disabled:opacity-50"
                                disabled={page === data.meta.last_page}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default StockIndex;
