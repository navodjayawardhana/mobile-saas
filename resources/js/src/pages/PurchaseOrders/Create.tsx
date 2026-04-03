import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetAllSuppliersQuery, useCreatePurchaseOrderMutation } from '../../store/api/suppliersApi';
import { useLazySearchProductsQuery } from '../../store/api/inventoryApi';
import { useCurrency } from '../../hooks/useCurrency';

interface CartItem {
    product_id: string;
    product_name: string;
    sku: string;
    quantity_ordered: number;
    unit_cost: number;
    total_cost: number;
}

const PurchaseOrderCreate = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedSupplier = searchParams.get('supplier');

    const { data: suppliersData, isLoading: loadingSuppliers } = useGetAllSuppliersQuery();
    const [createPurchaseOrder, { isLoading: isCreating }] = useCreatePurchaseOrderMutation();

    const [supplierId, setSupplierId] = useState(preselectedSupplier || '');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDate, setExpectedDate] = useState('');
    const [taxAmount, setTaxAmount] = useState('0');
    const [notes, setNotes] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [error, setError] = useState('');

    // Product search
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [searchProducts, { data: productsData, isFetching: isSearching }] = useLazySearchProductsQuery();
    const [hasLoadedProducts, setHasLoadedProducts] = useState(false);

    // New item form
    const [newItem, setNewItem] = useState({
        product_id: '',
        product_name: '',
        sku: '',
        quantity_ordered: 1,
        unit_cost: 0,
    });

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        if (preselectedSupplier) {
            setSupplierId(preselectedSupplier);
        }
    }, [preselectedSupplier]);

    const selectProduct = (product: any) => {
        setNewItem({
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            quantity_ordered: 1,
            unit_cost: product.cost_price || 0,
        });
        setProductSearch('');
        setShowProductDropdown(false);
    };

    const addToCart = () => {
        if (!newItem.product_id) {
            setError('Please select a product');
            return;
        }
        if (newItem.quantity_ordered < 1) {
            setError('Quantity must be at least 1');
            return;
        }
        if (newItem.unit_cost < 0) {
            setError('Unit cost cannot be negative');
            return;
        }

        // Check if product already in cart
        const existingIndex = cart.findIndex((item) => item.product_id === newItem.product_id);
        if (existingIndex >= 0) {
            const updatedCart = [...cart];
            updatedCart[existingIndex].quantity_ordered += newItem.quantity_ordered;
            updatedCart[existingIndex].total_cost = updatedCart[existingIndex].quantity_ordered * updatedCart[existingIndex].unit_cost;
            setCart(updatedCart);
        } else {
            setCart([
                ...cart,
                {
                    ...newItem,
                    total_cost: newItem.quantity_ordered * newItem.unit_cost,
                },
            ]);
        }

        // Reset new item
        setNewItem({
            product_id: '',
            product_name: '',
            sku: '',
            quantity_ordered: 1,
            unit_cost: 0,
        });
        setError('');
    };

    const updateCartItem = (index: number, field: 'quantity_ordered' | 'unit_cost', value: number) => {
        const updatedCart = [...cart];
        updatedCart[index][field] = value;
        updatedCart[index].total_cost = updatedCart[index].quantity_ordered * updatedCart[index].unit_cost;
        setCart(updatedCart);
    };

    const removeFromCart = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const subtotal = cart.reduce((sum, item) => sum + item.total_cost, 0);
    const tax = parseFloat(taxAmount) || 0;
    const total = subtotal + tax;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!supplierId) {
            setError('Please select a supplier');
            return;
        }
        if (cart.length === 0) {
            setError('Please add at least one item');
            return;
        }

        try {
            const result = await createPurchaseOrder({
                supplier_id: supplierId,
                items: cart.map((item) => ({
                    product_id: item.product_id,
                    quantity_ordered: item.quantity_ordered,
                    unit_cost: item.unit_cost,
                })),
                order_date: orderDate,
                expected_date: expectedDate || undefined,
                tax_amount: tax,
                notes: notes || undefined,
            }).unwrap();

            navigate(`/purchase-orders/${result.purchase_order.id}`);
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to create purchase order');
        }
    };

    if (loadingSuppliers) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="text-lg font-semibold dark:text-white-light">Create Purchase Order</h5>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => navigate('/purchase-orders')}>
                        <svg className="w-4 h-4 ltr:mr-1 rtl:ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                </div>

                {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label htmlFor="supplier">Supplier *</label>
                            <select
                                id="supplier"
                                className="form-select"
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                required
                            >
                                <option value="">Select Supplier</option>
                                {suppliersData?.suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="order_date">Order Date *</label>
                            <input
                                id="order_date"
                                type="date"
                                className="form-input"
                                value={orderDate}
                                onChange={(e) => setOrderDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="expected_date">Expected Delivery Date</label>
                            <input
                                id="expected_date"
                                type="date"
                                className="form-input"
                                value={expectedDate}
                                onChange={(e) => setExpectedDate(e.target.value)}
                                min={orderDate}
                            />
                        </div>
                        <div>
                            <label htmlFor="tax">Tax Amount</label>
                            <input
                                id="tax"
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-input"
                                value={taxAmount}
                                onChange={(e) => setTaxAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Add Product */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                        <h6 className="font-semibold mb-4">Add Products</h6>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-5 relative">
                                <label htmlFor="product_search">Product</label>
                                <div className="relative">
                                    <input
                                        id="product_search"
                                        type="text"
                                        className="form-input pr-8"
                                        placeholder="Click to select or type to search..."
                                        value={newItem.product_name || productSearch}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setProductSearch(value);
                                            setNewItem({ ...newItem, product_name: '', product_id: '', sku: '' });
                                            setShowProductDropdown(true);
                                            searchProducts(value);
                                        }}
                                        onFocus={() => {
                                            setShowProductDropdown(true);
                                            if (!hasLoadedProducts) {
                                                searchProducts('');
                                                setHasLoadedProducts(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            setTimeout(() => setShowProductDropdown(false), 200);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => {
                                            setShowProductDropdown(!showProductDropdown);
                                            if (!hasLoadedProducts) {
                                                searchProducts('');
                                                setHasLoadedProducts(true);
                                            }
                                        }}
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </button>
                                </div>
                                {showProductDropdown && (
                                    <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-60 overflow-auto">
                                        {isSearching ? (
                                            <div className="p-3 text-center text-gray-500">
                                                <span className="animate-spin border-2 border-primary border-l-transparent rounded-full w-4 h-4 inline-block align-middle mr-2"></span>
                                                Loading...
                                            </div>
                                        ) : productsData?.products && productsData.products.length > 0 ? (
                                            productsData.products.map((product) => (
                                                <div
                                                    key={product.id}
                                                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                                                    onClick={() => selectProduct(product)}
                                                >
                                                    <div className="font-semibold">{product.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        SKU: {product.sku} | Cost: {formatCurrency(product.cost_price || 0)}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-gray-500">
                                                No products found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="quantity">Quantity</label>
                                <input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    className="form-input"
                                    value={newItem.quantity_ordered}
                                    onChange={(e) => setNewItem({ ...newItem, quantity_ordered: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label htmlFor="unit_cost">Unit Cost</label>
                                <input
                                    id="unit_cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    value={newItem.unit_cost}
                                    onChange={(e) => setNewItem({ ...newItem, unit_cost: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <button type="button" className="btn btn-primary w-full" onClick={addToCart} disabled={!newItem.product_id}>
                                    <svg className="w-5 h-5 ltr:mr-1 rtl:ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="mb-6">
                        <h6 className="font-semibold mb-4">Order Items ({cart.length})</h6>
                        {cart.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table-striped">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>SKU</th>
                                            <th>Quantity</th>
                                            <th>Unit Cost</th>
                                            <th>Total</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map((item, index) => (
                                            <tr key={index}>
                                                <td className="font-semibold">{item.product_name}</td>
                                                <td className="text-gray-500">{item.sku}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="form-input w-24"
                                                        value={item.quantity_ordered}
                                                        onChange={(e) => updateCartItem(index, 'quantity_ordered', parseInt(e.target.value) || 1)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="form-input w-28"
                                                        value={item.unit_cost}
                                                        onChange={(e) => updateCartItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="font-semibold">{formatCurrency(item.total_cost)}</td>
                                                <td className="text-center">
                                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeFromCart(index)}>
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500 border border-dashed rounded-lg">
                                No items added yet. Search and add products above.
                            </div>
                        )}
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-6">
                        <div className="w-full md:w-1/3 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal:</span>
                                <span className="font-semibold">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tax:</span>
                                <span>{formatCurrency(tax)}</span>
                            </div>
                            <hr className="border-gray-300 dark:border-gray-700" />
                            <div className="flex justify-between text-lg">
                                <span className="font-bold">Total:</span>
                                <span className="font-bold text-primary">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <label htmlFor="notes">Notes</label>
                        <textarea
                            id="notes"
                            className="form-textarea"
                            rows={3}
                            placeholder="Additional notes for this purchase order..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button type="button" className="btn btn-outline-dark" onClick={() => navigate('/purchase-orders')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isCreating || cart.length === 0}>
                            {isCreating && (
                                <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>
                            )}
                            Create Purchase Order
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchaseOrderCreate;
