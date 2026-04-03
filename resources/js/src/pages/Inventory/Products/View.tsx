import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetProductQuery, useGetAvailableItemsQuery, useCreateInventoryItemMutation, useAdjustStockMutation } from '../../../store/api/inventoryApi';
import Modal from '../../../components/Common/Modal';
import { useCurrency } from '../../../hooks/useCurrency';

const ProductsView = () => {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading, refetch } = useGetProductQuery(id!);
    const { data: itemsData, refetch: refetchItems } = useGetAvailableItemsQuery(id!, {
        skip: !data?.product?.is_serialized,
    });

    const [createInventoryItem, { isLoading: isCreatingItem }] = useCreateInventoryItemMutation();
    const [adjustStock, { isLoading: isAdjusting }] = useAdjustStockMutation();

    const [isAddItemModal, setIsAddItemModal] = useState(false);
    const [isAdjustModal, setIsAdjustModal] = useState(false);
    const [error, setError] = useState('');

    const [itemForm, setItemForm] = useState({
        serial_number: '',
        cost_price: '',
        condition: 'new',
    });

    const [adjustForm, setAdjustForm] = useState({
        new_quantity: '',
        reason: '',
    });

    const { formatCurrency } = useCurrency();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await createInventoryItem({
                product_id: id!,
                serial_number: itemForm.serial_number,
                cost_price: parseFloat(itemForm.cost_price),
                condition: itemForm.condition,
            }).unwrap();

            setIsAddItemModal(false);
            setItemForm({ serial_number: '', cost_price: '', condition: 'new' });
            refetch();
            refetchItems();
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to add item');
        }
    };

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await adjustStock({
                product_id: id!,
                new_quantity: parseInt(adjustForm.new_quantity),
                reason: adjustForm.reason,
            }).unwrap();

            setIsAdjustModal(false);
            setAdjustForm({ new_quantity: '', reason: '' });
            refetch();
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to adjust stock');
        }
    };

    const getTypeLabel = (t: string) => {
        switch (t) {
            case 'phone': return 'Phone';
            case 'accessory': return 'Accessory';
            case 'spare_part': return 'Spare Part';
            default: return t;
        }
    };

    const getMovementTypeLabel = (t: string) => {
        switch (t) {
            case 'purchase': return { label: 'Purchase', class: 'bg-success' };
            case 'sale': return { label: 'Sale', class: 'bg-info' };
            case 'adjustment_in': return { label: 'Adjustment In', class: 'bg-primary' };
            case 'adjustment_out': return { label: 'Adjustment Out', class: 'bg-warning' };
            case 'return_in': return { label: 'Return (In)', class: 'bg-secondary' };
            case 'return_out': return { label: 'Return (Out)', class: 'bg-secondary' };
            case 'damage': return { label: 'Damage', class: 'bg-danger' };
            default: return { label: t, class: 'bg-dark' };
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    const product = data?.product;
    const movements = data?.recent_movements || [];

    if (!product) {
        return <div className="panel">Product not found</div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">Product Details</h5>
                <div className="flex gap-2">
                    <Link to="/inventory/products" className="btn btn-outline-dark">
                        Back to Products
                    </Link>
                    <Link to={`/inventory/products/${id}/edit`} className="btn btn-primary">
                        Edit Product
                    </Link>
                </div>
            </div>

            {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product Info */}
                <div className="lg:col-span-2">
                    <div className="panel">
                        <div className="flex items-start gap-4 mb-6">
                            {product.images && product.images[0] ? (
                                <img src={`/storage/${product.images[0]}`} alt="" className="w-24 h-24 rounded object-cover" />
                            ) : (
                                <div className="w-24 h-24 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                    </svg>
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-xl font-bold">{product.name}</h3>
                                <p className="text-gray-500">SKU: {product.sku}</p>
                                {product.barcode && <p className="text-gray-500">Barcode: {product.barcode}</p>}
                                <div className="flex gap-2 mt-2">
                                    <span className={`badge ${product.is_active ? 'bg-success' : 'bg-danger'}`}>
                                        {product.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="badge bg-primary">{getTypeLabel(product.type)}</span>
                                    {product.is_serialized && <span className="badge bg-dark">IMEI Tracked</span>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                                <p className="text-xs text-gray-500 uppercase">Cost Price</p>
                                <p className="text-lg font-bold">{formatCurrency(product.cost_price)}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                                <p className="text-xs text-gray-500 uppercase">Selling Price</p>
                                <p className="text-lg font-bold">{formatCurrency(product.selling_price)}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                                <p className="text-xs text-gray-500 uppercase">Profit Margin</p>
                                <p className="text-lg font-bold text-success">
                                    {formatCurrency(product.selling_price - product.cost_price)}
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                                <p className="text-xs text-gray-500 uppercase">In Stock</p>
                                <p className={`text-lg font-bold ${
                                    product.quantity <= 0 ? 'text-danger' :
                                    product.quantity <= product.min_stock_alert ? 'text-warning' : 'text-success'
                                }`}>
                                    {product.quantity}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <p className="text-sm text-gray-500">Category</p>
                                <p className="font-medium">{product.category?.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Brand</p>
                                <p className="font-medium">{product.brand?.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Condition</p>
                                <p className="font-medium capitalize">{product.condition}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Warranty</p>
                                <p className="font-medium">{product.warranty_months ? `${product.warranty_months} months` : '-'}</p>
                            </div>
                        </div>

                        {product.description && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-500">Description</p>
                                <p className="mt-1">{product.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Stock Actions */}
                    <div className="panel mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h6 className="font-semibold">Stock Management</h6>
                            {product.is_serialized ? (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => {
                                        setItemForm({ ...itemForm, cost_price: product.cost_price.toString() });
                                        setIsAddItemModal(true);
                                    }}
                                >
                                    Add IMEI/Serial
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => {
                                        setAdjustForm({ new_quantity: product.quantity.toString(), reason: '' });
                                        setIsAdjustModal(true);
                                    }}
                                >
                                    Adjust Stock
                                </button>
                            )}
                        </div>

                        {product.is_serialized && itemsData?.inventory_items && (
                            <div className="table-responsive">
                                <table className="table-striped">
                                    <thead>
                                        <tr>
                                            <th>Serial/IMEI</th>
                                            <th>Condition</th>
                                            <th>Cost</th>
                                            <th>Warranty Expires</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsData.inventory_items.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center text-gray-500">
                                                    No items in stock
                                                </td>
                                            </tr>
                                        ) : (
                                            itemsData.inventory_items.map((item) => (
                                                <tr key={item.id}>
                                                    <td><code>{item.serial_number}</code></td>
                                                    <td className="capitalize">{item.condition}</td>
                                                    <td>{formatCurrency(item.cost_price)}</td>
                                                    <td>{item.warranty_expires_at ? new Date(item.warranty_expires_at).toLocaleDateString() : '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Movements */}
                <div className="panel h-fit">
                    <h6 className="font-semibold mb-4">Recent Stock Movements</h6>
                    {movements.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No movements yet</p>
                    ) : (
                        <div className="space-y-4">
                            {movements.map((movement) => {
                                const typeInfo = getMovementTypeLabel(movement.type);
                                return (
                                    <div key={movement.id} className="border-l-4 border-primary pl-3 py-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`badge ${typeInfo.class}`}>{typeInfo.label}</span>
                                            <span className="font-bold">
                                                {movement.type.includes('out') || movement.type === 'sale' || movement.type === 'damage' ? '-' : '+'}
                                                {movement.quantity}
                                            </span>
                                        </div>
                                        {movement.notes && <p className="text-sm text-gray-500 mt-1">{movement.notes}</p>}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {movement.user?.name} - {formatDate(movement.created_at)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <Link to={`/inventory/stock?product_id=${id}`} className="btn btn-outline-primary btn-sm w-full mt-4">
                        View All Movements
                    </Link>
                </div>
            </div>

            {/* Add Inventory Item Modal */}
            <Modal isOpen={isAddItemModal} onClose={() => setIsAddItemModal(false)} title="Add Inventory Item">
                <form onSubmit={handleAddItem}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="serial_number">Serial Number / IMEI *</label>
                            <input
                                id="serial_number"
                                type="text"
                                className="form-input"
                                placeholder="Enter serial number or IMEI"
                                value={itemForm.serial_number}
                                onChange={(e) => setItemForm({ ...itemForm, serial_number: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="item_cost_price">Cost Price *</label>
                            <input
                                id="item_cost_price"
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-input"
                                value={itemForm.cost_price}
                                onChange={(e) => setItemForm({ ...itemForm, cost_price: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="item_condition">Condition</label>
                            <select
                                id="item_condition"
                                className="form-select"
                                value={itemForm.condition}
                                onChange={(e) => setItemForm({ ...itemForm, condition: e.target.value })}
                            >
                                <option value="new">New</option>
                                <option value="used">Used</option>
                                <option value="refurbished">Refurbished</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsAddItemModal(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isCreatingItem}>
                            {isCreatingItem && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            Add Item
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Adjust Stock Modal */}
            <Modal isOpen={isAdjustModal} onClose={() => setIsAdjustModal(false)} title="Adjust Stock">
                <form onSubmit={handleAdjustStock}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="new_quantity">New Quantity *</label>
                            <input
                                id="new_quantity"
                                type="number"
                                min="0"
                                className="form-input"
                                value={adjustForm.new_quantity}
                                onChange={(e) => setAdjustForm({ ...adjustForm, new_quantity: e.target.value })}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Current: {product.quantity}</p>
                        </div>
                        <div>
                            <label htmlFor="reason">Reason *</label>
                            <textarea
                                id="reason"
                                className="form-textarea"
                                rows={2}
                                placeholder="Reason for adjustment..."
                                value={adjustForm.reason}
                                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                                required
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsAdjustModal(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isAdjusting}>
                            {isAdjusting && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            Adjust Stock
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProductsView;
