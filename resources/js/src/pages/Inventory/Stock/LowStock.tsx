import { Link } from 'react-router-dom';
import { useGetLowStockQuery, useGetOutOfStockQuery } from '../../../store/api/inventoryApi';
import { useCurrency } from '../../../hooks/useCurrency';

const LowStock = () => {
    const { data: lowStockData, isLoading: isLoadingLow } = useGetLowStockQuery();
    const { data: outOfStockData, isLoading: isLoadingOut } = useGetOutOfStockQuery();
    const { formatCurrency } = useCurrency();

    if (isLoadingLow || isLoadingOut) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">Stock Alerts</h5>
                <Link to="/inventory/stock" className="btn btn-outline-dark">
                    View All Movements
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="panel bg-danger text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white text-sm opacity-80">Out of Stock</p>
                            <p className="text-white text-3xl font-bold">{outOfStockData?.count || 0}</p>
                            <p className="text-white text-xs opacity-60 mt-1">Products need restocking</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-3">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="panel bg-warning text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white text-sm opacity-80">Low Stock</p>
                            <p className="text-white text-3xl font-bold">{lowStockData?.count || 0}</p>
                            <p className="text-white text-xs opacity-60 mt-1">Products below threshold</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-3">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Out of Stock Products */}
            <div className="panel mb-6">
                <h6 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-danger"></span>
                    Out of Stock Products
                </h6>
                {outOfStockData?.products.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No out of stock products</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Category</th>
                                    <th>Cost Price</th>
                                    <th>Selling Price</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outOfStockData?.products.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div>
                                                <p className="font-semibold">{product.name}</p>
                                                {product.brand && <p className="text-xs text-gray-500">{product.brand.name}</p>}
                                            </div>
                                        </td>
                                        <td><code className="text-xs">{product.sku}</code></td>
                                        <td>{product.category?.name || '-'}</td>
                                        <td>{formatCurrency(product.cost_price)}</td>
                                        <td>{formatCurrency(product.selling_price)}</td>
                                        <td className="text-center">
                                            <Link
                                                to={`/inventory/products/${product.id}`}
                                                className="btn btn-sm btn-primary"
                                            >
                                                Manage Stock
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Low Stock Products */}
            <div className="panel">
                <h6 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning"></span>
                    Low Stock Products
                </h6>
                {lowStockData?.products.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No low stock products</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Category</th>
                                    <th>Current Stock</th>
                                    <th>Alert Threshold</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStockData?.products.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div>
                                                <p className="font-semibold">{product.name}</p>
                                                {product.brand && <p className="text-xs text-gray-500">{product.brand.name}</p>}
                                            </div>
                                        </td>
                                        <td><code className="text-xs">{product.sku}</code></td>
                                        <td>{product.category?.name || '-'}</td>
                                        <td>
                                            <span className="text-warning font-bold">{product.quantity}</span>
                                        </td>
                                        <td>{product.min_stock_alert}</td>
                                        <td className="text-center">
                                            <Link
                                                to={`/inventory/products/${product.id}`}
                                                className="btn btn-sm btn-primary"
                                            >
                                                Manage Stock
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LowStock;
