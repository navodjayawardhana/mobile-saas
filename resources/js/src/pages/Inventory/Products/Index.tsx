import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetProductsQuery, useDeleteProductMutation, useToggleProductActiveMutation, useGetCategoryTreeQuery, useGetAllBrandsQuery } from '../../../store/api/inventoryApi';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import { useCurrency } from '../../../hooks/useCurrency';

const ProductsIndex = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [type, setType] = useState('');
    const [stockFilter, setStockFilter] = useState('');

    const { data, isLoading } = useGetProductsQuery({
        page,
        search,
        category_id: categoryId || undefined,
        brand_id: brandId || undefined,
        type: type || undefined,
        low_stock: stockFilter === 'low' || undefined,
        out_of_stock: stockFilter === 'out' || undefined,
    });

    const { data: categoriesData } = useGetCategoryTreeQuery();
    const { data: brandsData } = useGetAllBrandsQuery();
    const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
    const [toggleActive] = useToggleProductActiveMutation();

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteProduct(deletingId).unwrap();
            setIsDeleteOpen(false);
            setDeletingId(null);
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot delete product');
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            await toggleActive(id).unwrap();
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot change status');
        }
    };

    // Flatten categories for select
    const flattenCategories = (categories: any[], level = 0): { id: string; name: string; level: number }[] => {
        let result: { id: string; name: string; level: number }[] = [];
        for (const cat of categories || []) {
            result.push({ id: cat.id, name: cat.name, level });
            if (cat.children) {
                result = [...result, ...flattenCategories(cat.children, level + 1)];
            }
        }
        return result;
    };

    const categoryOptions = flattenCategories(categoriesData?.categories);

    const { formatCurrency } = useCurrency();

    const getTypeLabel = (t: string) => {
        switch (t) {
            case 'phone': return 'Phone';
            case 'accessory': return 'Accessory';
            case 'spare_part': return 'Spare Part';
            default: return t;
        }
    };

    const getTypeBadgeClass = (t: string) => {
        switch (t) {
            case 'phone': return 'badge bg-primary';
            case 'accessory': return 'badge bg-info';
            case 'spare_part': return 'badge bg-warning';
            default: return 'badge bg-dark';
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="panel">
            <div className="flex flex-col md:flex-row items-center justify-between mb-5 gap-4">
                <h5 className="text-lg font-semibold dark:text-white-light">Products</h5>
                <Link to="/inventory/products/create" className="btn btn-primary">
                    <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Product
                </Link>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search name, SKU, barcode..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
                <select
                    className="form-select"
                    value={categoryId}
                    onChange={(e) => {
                        setCategoryId(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Categories</option>
                    {categoryOptions.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {'—'.repeat(cat.level)} {cat.name}
                        </option>
                    ))}
                </select>
                <select
                    className="form-select"
                    value={brandId}
                    onChange={(e) => {
                        setBrandId(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Brands</option>
                    {brandsData?.brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
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
                    <option value="phone">Phone</option>
                    <option value="accessory">Accessory</option>
                    <option value="spare_part">Spare Part</option>
                </select>
                <select
                    className="form-select"
                    value={stockFilter}
                    onChange={(e) => {
                        setStockFilter(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Stock</option>
                    <option value="low">Low Stock</option>
                    <option value="out">Out of Stock</option>
                </select>
            </div>

            {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Type</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.products.map((product) => (
                            <tr key={product.id}>
                                <td>
                                    <div className="flex items-center">
                                        {product.images && product.images[0] ? (
                                            <img src={`/storage/${product.images[0]}`} alt="" className="w-10 h-10 rounded object-cover mr-3" />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                                </svg>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold">{product.name}</p>
                                            {product.brand && <p className="text-xs text-gray-500">{product.brand.name}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td><code className="text-xs">{product.sku}</code></td>
                                <td><span className={getTypeBadgeClass(product.type)}>{getTypeLabel(product.type)}</span></td>
                                <td>{product.category?.name || '-'}</td>
                                <td>
                                    <div>
                                        <p className="font-semibold">{formatCurrency(product.selling_price)}</p>
                                        <p className="text-xs text-gray-500">Cost: {formatCurrency(product.cost_price)}</p>
                                    </div>
                                </td>
                                <td>
                                    <span className={`font-semibold ${
                                        product.quantity <= 0 ? 'text-danger' :
                                        product.quantity <= product.min_stock_alert ? 'text-warning' : 'text-success'
                                    }`}>
                                        {product.quantity}
                                    </span>
                                    {product.is_serialized && <span className="badge bg-dark ml-1 text-xs">IMEI</span>}
                                </td>
                                <td>
                                    <label className="relative h-6 w-12">
                                        <input
                                            type="checkbox"
                                            className="custom_switch peer absolute z-10 h-full w-full cursor-pointer opacity-0"
                                            checked={product.is_active}
                                            onChange={() => handleToggleActive(product.id)}
                                        />
                                        <span className="block h-full rounded-full bg-[#ebedf2] before:absolute before:bottom-1 before:left-1 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-all before:duration-300 peer-checked:bg-primary peer-checked:before:left-7 dark:bg-dark dark:before:bg-white-dark dark:peer-checked:before:bg-white"></span>
                                    </label>
                                </td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Link
                                            to={`/inventory/products/${product.id}`}
                                            className="btn btn-sm btn-outline-info"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            to={`/inventory/products/${product.id}/edit`}
                                            className="btn btn-sm btn-outline-primary"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => {
                                                setDeletingId(product.id);
                                                setIsDeleteOpen(true);
                                                setError('');
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data?.products.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    No products found. Try adjusting your filters.
                </div>
            )}

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

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Product"
                message="Are you sure you want to delete this product? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default ProductsIndex;
