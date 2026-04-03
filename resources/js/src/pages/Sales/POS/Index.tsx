import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { showToast } from '../../../utils/toast';
import {
    useLazyPosSearchProductsQuery,
    useLazyPosGetByBarcodeQuery,
    useLazyPosGetInventoryItemsQuery,
    usePosGetQuickProductsQuery,
    usePosCreateSaleMutation,
    usePosHoldSaleMutation,
    usePosGetHeldQuery,
    useLazyPosResumeHeldQuery,
    usePosDeleteHeldMutation,
    useLazySearchCustomersQuery,
    useCreateCustomerMutation,
} from '../../../store/api/salesApi';
import { useGetPaymentMethodsQuery } from '../../../store/api/settingsApi';
import Modal from '../../../components/Common/Modal';
import ThermalReceipt from '../../../components/Sales/ThermalReceipt';
import { useCurrency } from '../../../hooks/useCurrency';

interface CartItem {
    id: string;
    product_id: string;
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    discount: number;
    total: number;
    is_serialized: boolean;
    inventory_item_id?: string;
    serial_number?: string;
}

const PosIndex = () => {
    const [searchProducts, { data: searchResults, isFetching: isSearching }] = useLazyPosSearchProductsQuery();
    const [getByBarcode] = useLazyPosGetByBarcodeQuery();
    const [getInventoryItems] = useLazyPosGetInventoryItemsQuery();
    const [searchCustomers, { data: customerResults }] = useLazySearchCustomersQuery();
    const { data: quickProductsData } = usePosGetQuickProductsQuery();
    const { data: paymentMethodsData } = useGetPaymentMethodsQuery();
    const { data: heldSalesData, refetch: refetchHeld } = usePosGetHeldQuery();
    const [createSale, { isLoading: isCreatingSale }] = usePosCreateSaleMutation();
    const [holdSale] = usePosHoldSaleMutation();
    const [resumeHeld] = useLazyPosResumeHeldQuery();
    const [deleteHeld] = usePosDeleteHeldMutation();
    const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();
    const { formatCurrency } = useCurrency();

    const [searchQuery, setSearchQuery] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; phone?: string } | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
    const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [availableSerials, setAvailableSerials] = useState<any[]>([]);
    const [invoiceData, setInvoiceData] = useState<any>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

    const getProductInitials = (name: string) => {
        if (!name) return 'PR';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getColorsForInitials = (name: string) => {
        const colors = [
            'bg-primary/20 text-primary',
            'bg-secondary/20 text-secondary',
            'bg-success/20 text-success',
            'bg-danger/20 text-danger',
            'bg-warning/20 text-warning',
            'bg-info/20 text-info',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const receiptRef = useRef<HTMLDivElement>(null);
    const customerInputRef = useRef<HTMLInputElement>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
    });

    // Auto print when invoice data is set
    useEffect(() => {
        if (invoiceData) {
            // Small delay to ensure DOM is updated
            const timer = setTimeout(() => {
                handlePrint();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [invoiceData, handlePrint]);

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - discount;

    // Search products
    useEffect(() => {
        if (searchQuery.length >= 2) {
            const timer = setTimeout(() => {
                searchProducts(searchQuery);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchQuery, searchProducts]);

    // Search customers - trigger on focus or when typing
    useEffect(() => {
        if (isCustomerDropdownOpen && !selectedCustomer) {
            const timer = setTimeout(() => {
                searchCustomers(customerSearch);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [customerSearch, searchCustomers, isCustomerDropdownOpen, selectedCustomer]);

    // Handle barcode scan
    const handleBarcodeScan = async () => {
        if (!barcodeInput) return;
        try {
            const result = await getByBarcode(barcodeInput).unwrap();
            if (result.product) {
                addToCart(result.product);
            }
        } catch (err) {
            showToast.error('Product not found');
        }
        setBarcodeInput('');
        barcodeInputRef.current?.focus();
    };

    // Add product to cart
    const addToCart = async (product: any) => {
        const sellingPrice = parseFloat(product.selling_price) || 0;

        if (product.is_serialized) {
            // Need to select serial number
            try {
                const result = await getInventoryItems(product.id).unwrap();
                if (result.inventory_items.length === 0) {
                    showToast.error('No available stock for this product');
                    return;
                }
                setSelectedProduct({ ...product, selling_price: sellingPrice });
                setAvailableSerials(result.inventory_items);
                setIsSerialModalOpen(true);
            } catch (err) {
                showToast.error('Failed to load inventory items');
            }
        } else {
            // Check if already in cart
            const existingIndex = cart.findIndex(item => item.product_id === product.id && !item.inventory_item_id);
            if (existingIndex >= 0) {
                const newCart = [...cart];
                newCart[existingIndex].quantity += 1;
                newCart[existingIndex].total = newCart[existingIndex].quantity * newCart[existingIndex].unit_price - newCart[existingIndex].discount;
                setCart(newCart);
            } else {
                setCart([...cart, {
                    id: `cart_${Date.now()}`,
                    product_id: product.id,
                    name: product.name,
                    sku: product.sku,
                    quantity: 1,
                    unit_price: sellingPrice,
                    discount: 0,
                    total: sellingPrice,
                    is_serialized: false,
                }]);
            }
        }
        setSearchQuery('');
    };

    // Add serialized item to cart
    const addSerializedItem = (serial: any) => {
        if (!selectedProduct) return;
        const sellingPrice = parseFloat(selectedProduct.selling_price) || 0;
        setCart([...cart, {
            id: `cart_${Date.now()}`,
            product_id: selectedProduct.id,
            name: selectedProduct.name,
            sku: selectedProduct.sku,
            quantity: 1,
            unit_price: sellingPrice,
            discount: 0,
            total: sellingPrice,
            is_serialized: true,
            inventory_item_id: serial.id,
            serial_number: serial.serial_number,
        }]);
        setIsSerialModalOpen(false);
        setSelectedProduct(null);
    };

    // Update cart item
    const updateCartItem = (index: number, field: string, value: number) => {
        const newCart = [...cart];
        (newCart[index] as any)[field] = value;
        newCart[index].total = newCart[index].quantity * newCart[index].unit_price - newCart[index].discount;
        setCart(newCart);
    };

    // Remove from cart
    const removeFromCart = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    // Clear cart
    const clearCart = () => {
        setCart([]);
        setSelectedCustomer(null);
        setDiscount(0);
    };

    // Process payment
    const processPayment = async (paymentMethodId: string, paidAmount: number, reference?: string) => {
        if (cart.length === 0) return;

        try {
            const result = await createSale({
                customer_id: selectedCustomer?.id,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    discount_amount: item.discount,
                    inventory_item_id: item.inventory_item_id,
                })),
                discount_amount: discount,
                paid_amount: paidAmount,
                payment_method_id: paymentMethodId,
                payment_reference: reference,
            }).unwrap();

            setInvoiceData(result.invoice);
            setIsPaymentModalOpen(false);
            clearCart();
            showToast.success('Sale completed successfully');
            // Print is triggered automatically by useEffect when invoiceData changes
        } catch (err: any) {
            showToast.error(err?.data?.message || 'Failed to create sale');
        }
    };

    // Hold sale
    const handleHoldSale = async () => {
        if (cart.length === 0) return;

        try {
            await holdSale({
                customer_id: selectedCustomer?.id,
                customer_name: selectedCustomer?.name,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    discount_amount: item.discount,
                    inventory_item_id: item.inventory_item_id,
                })),
                discount_amount: discount,
            }).unwrap();

            clearCart();
            refetchHeld();
            showToast.success('Sale held successfully');
        } catch (err: any) {
            showToast.error(err?.data?.message || 'Failed to hold sale');
        }
    };

    // Resume held sale
    const handleResumeHeld = async (heldId: string) => {
        try {
            const result = await resumeHeld(heldId).unwrap();
            const held = result.held_sale;

            // Restore cart
            const newCart: CartItem[] = held.items.map((item: any, index: number) => {
                const unitPrice = parseFloat(item.unit_price || item.product?.selling_price) || 0;
                const discountAmount = parseFloat(item.discount_amount) || 0;
                const quantity = parseInt(item.quantity) || 1;
                return {
                    id: `cart_${Date.now()}_${index}`,
                    product_id: item.product_id,
                    name: item.product?.name || 'Unknown',
                    sku: item.product?.sku || '',
                    quantity: quantity,
                    unit_price: unitPrice,
                    discount: discountAmount,
                    total: (quantity * unitPrice) - discountAmount,
                    is_serialized: !!item.inventory_item_id,
                    inventory_item_id: item.inventory_item_id,
                };
            });

            setCart(newCart);
            setDiscount(parseFloat(held.discount_amount) || 0);
            if (held.customer_id) {
                setSelectedCustomer({ id: held.customer_id, name: held.customer_name || 'Customer' });
            }
            setIsHeldModalOpen(false);
            refetchHeld();
            showToast.success('Sale resumed');
        } catch (err: any) {
            showToast.error(err?.data?.message || 'Failed to resume sale');
        }
    };

    // Delete held sale
    const handleDeleteHeld = async (heldId: string) => {
        try {
            await deleteHeld(heldId).unwrap();
            refetchHeld();
            showToast.success('Held sale deleted');
        } catch (err) {
            showToast.error('Failed to delete held sale');
        }
    };

    // Create new customer
    const handleCreateCustomer = async () => {
        if (!newCustomer.name.trim()) {
            showToast.error('Customer name is required');
            return;
        }

        try {
            const result = await createCustomer({
                name: newCustomer.name,
                phone: newCustomer.phone || null,
                email: newCustomer.email || null,
                address: newCustomer.address || null,
                customer_type: 'regular',
            }).unwrap();

            // Select the new customer
            setSelectedCustomer({
                id: result.customer.id,
                name: result.customer.name,
                phone: result.customer.phone || undefined,
            });
            setIsCustomerModalOpen(false);
            setNewCustomer({ name: '', phone: '', email: '', address: '' });
            showToast.success('Customer created successfully');
        } catch (err: any) {
            showToast.error(err?.data?.message || 'Failed to create customer');
        }
    };

    return (
        <div className="h-full flex gap-4">
            {/* Left: Products */}
            <div className="flex-1 flex flex-col">
                {/* Search Bar */}
                <div className="panel mb-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                className="form-input pr-10"
                                placeholder="Search products... (min 2 characters)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                </div>
                            )}
                            {/* Search Results Dropdown */}
                            {searchQuery.length >= 2 && (
                                <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#1b2e4b] border border-gray-200 dark:border-gray-700 rounded-b-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                    {isSearching ? (
                                        <div className="px-4 py-3 text-center text-gray-500">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                            Searching...
                                        </div>
                                    ) : searchResults?.products && searchResults.products.length > 0 ? (
                                        searchResults.products.map((product: any) => (
                                            <button
                                                key={product.id}
                                                type="button"
                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-0"
                                                onClick={() => addToCart(product)}
                                            >
                                                <div>
                                                    <p className="font-medium">{product.name}</p>
                                                    <p className="text-xs text-gray-500">{product.sku}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-primary">{formatCurrency(parseFloat(product.selling_price) || 0)}</p>
                                                    <p className="text-xs text-gray-500">Qty: {product.quantity}</p>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-center text-gray-500">
                                            No products found for "{searchQuery}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="w-48">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                className="form-input"
                                placeholder="Scan barcode..."
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()}
                            />
                        </div>
                    </div>
                </div>

                {/* Quick Products Grid */}
                <div className="panel flex-1 overflow-y-auto">
                    <h6 className="font-semibold mb-4">Quick Access</h6>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {quickProductsData?.products.map((product: any) => (
                            <button
                                key={product.id}
                                type="button"
                                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary hover:shadow-md transition text-center"
                                onClick={() => addToCart(product)}
                            >
                                {product.images?.[0] ? (
                                    <img src={`/storage/${product.images[0]}`} alt="" className="w-12 h-12 mx-auto mb-2 object-cover rounded" />
                                ) : (
                                    <div className={`w-12 h-12 mx-auto mb-2 rounded flex items-center justify-center font-bold text-lg ${getColorsForInitials(product.name)}`}>
                                        {getProductInitials(product.name)}
                                    </div>
                                )}
                                <p className="text-xs font-medium truncate">{product.name}</p>
                                <p className="text-xs text-primary font-bold">{formatCurrency(product.selling_price)}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Cart */}
            <div className="w-96 flex flex-col">
                <div className="panel flex-1 flex flex-col">
                    {/* Customer Selection */}
                    <div className="mb-4 flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                ref={customerInputRef}
                                type="text"
                                className="form-input"
                                placeholder="Search or select customer..."
                                value={selectedCustomer ? selectedCustomer.name : customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    setSelectedCustomer(null);
                                    setIsCustomerDropdownOpen(true);
                                }}
                                onFocus={() => {
                                    if (!selectedCustomer) {
                                        setIsCustomerDropdownOpen(true);
                                    }
                                }}
                                onBlur={() => {
                                    // Delay to allow clicking on dropdown items
                                    setTimeout(() => setIsCustomerDropdownOpen(false), 200);
                                }}
                            />
                            {selectedCustomer && (
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-danger"
                                    onClick={() => {
                                        setSelectedCustomer(null);
                                        setIsCustomerDropdownOpen(true);
                                        customerInputRef.current?.focus();
                                    }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            )}
                            {isCustomerDropdownOpen && !selectedCustomer && (
                                <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#1b2e4b] border border-gray-200 dark:border-gray-700 rounded-b-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                    {customerResults?.customers && customerResults.customers.length > 0 ? (
                                        customerResults.customers.map((customer: any) => (
                                            <button
                                                key={customer.id}
                                                type="button"
                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    setSelectedCustomer({ id: customer.id, name: customer.name, phone: customer.phone });
                                                    setCustomerSearch('');
                                                    setIsCustomerDropdownOpen(false);
                                                }}
                                            >
                                                <p className="font-medium">{customer.name}</p>
                                                {customer.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-center text-gray-500">
                                            <p>{customerSearch ? `No customers found for "${customerSearch}"` : 'No customers found'}</p>
                                            <button
                                                type="button"
                                                className="text-primary hover:underline mt-1 text-sm"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    setNewCustomer({ ...newCustomer, name: customerSearch });
                                                    setIsCustomerModalOpen(true);
                                                    setIsCustomerDropdownOpen(false);
                                                }}
                                            >
                                                + Add {customerSearch ? `"${customerSearch}"` : 'new'} customer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary px-3"
                            onClick={() => setIsCustomerModalOpen(true)}
                            title="Add New Customer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                        {cart.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                <p>Cart is empty</p>
                            </div>
                        ) : (
                            cart.map((item, index) => (
                                <div key={item.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.name}</p>
                                            {item.serial_number && (
                                                <p className="text-xs text-gray-500">IMEI: {item.serial_number}</p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="text-danger hover:text-danger-dark"
                                            onClick={() => removeFromCart(index)}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!item.is_serialized && (
                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-dark px-2"
                                                    onClick={() => updateCartItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    className="form-input w-12 text-center mx-1 px-1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateCartItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-dark px-2"
                                                    onClick={() => updateCartItem(index, 'quantity', item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}
                                        <span className="text-sm">x {formatCurrency(item.unit_price)}</span>
                                        <span className="flex-1 text-right font-bold">{formatCurrency(item.total)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Cart Summary */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-semibold">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Discount</span>
                            <input
                                type="number"
                                min="0"
                                className="form-input flex-1 text-right"
                                value={discount}
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total</span>
                            <span className="text-primary">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-warning"
                            onClick={handleHoldSale}
                            disabled={cart.length === 0}
                        >
                            Hold
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-info"
                            onClick={() => setIsHeldModalOpen(true)}
                        >
                            Held ({heldSalesData?.held_sales?.length || 0})
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={clearCart}
                            disabled={cart.length === 0}
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => setIsPaymentModalOpen(true)}
                            disabled={cart.length === 0}
                        >
                            Pay {formatCurrency(total)}
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                total={total}
                paymentMethods={paymentMethodsData?.payment_methods || []}
                onConfirm={processPayment}
                isLoading={isCreatingSale}
            />

            {/* Held Sales Modal */}
            <Modal isOpen={isHeldModalOpen} onClose={() => setIsHeldModalOpen(false)} title="Held Sales">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {heldSalesData?.held_sales?.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No held sales</p>
                    ) : (
                        heldSalesData?.held_sales?.map((held: any) => (
                            <div key={held.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{held.customer_name || 'Walk-in'}</p>
                                    <p className="text-xs text-gray-500">
                                        {held.items.length} items - {new Date(held.held_at).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleResumeHeld(held.id)}
                                    >
                                        Resume
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDeleteHeld(held.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Modal>

            {/* Serial Selection Modal */}
            <Modal isOpen={isSerialModalOpen} onClose={() => setIsSerialModalOpen(false)} title="Select Serial/IMEI">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableSerials.map((serial) => (
                        <button
                            key={serial.id}
                            type="button"
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                            onClick={() => addSerializedItem(serial)}
                        >
                            <p className="font-mono font-medium">{serial.serial_number}</p>
                            <p className="text-xs text-gray-500 capitalize">
                                {serial.condition} - Cost: {formatCurrency(serial.cost_price)}
                            </p>
                        </button>
                    ))}
                </div>
            </Modal>

            {/* Quick Add Customer Modal */}
            <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Add New Customer">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="customer_name">Name *</label>
                        <input
                            id="customer_name"
                            type="text"
                            className="form-input"
                            placeholder="Customer name"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label htmlFor="customer_phone">Phone</label>
                        <input
                            id="customer_phone"
                            type="text"
                            className="form-input"
                            placeholder="Phone number"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label htmlFor="customer_email">Email</label>
                        <input
                            id="customer_email"
                            type="email"
                            className="form-input"
                            placeholder="Email address"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label htmlFor="customer_address">Address</label>
                        <textarea
                            id="customer_address"
                            className="form-textarea"
                            rows={2}
                            placeholder="Address"
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={() => {
                                setIsCustomerModalOpen(false);
                                setNewCustomer({ name: '', phone: '', email: '', address: '' });
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCreateCustomer}
                            disabled={isCreatingCustomer || !newCustomer.name.trim()}
                        >
                            {isCreatingCustomer && (
                                <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>
                            )}
                            Add Customer
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Hidden Receipt for Printing */}
            <div style={{ display: 'none' }}>
                <div ref={receiptRef}>
                    {invoiceData && <ThermalReceipt data={invoiceData} />}
                </div>
            </div>
        </div>
    );
};

// Payment Modal Component
const PaymentModal = ({
    isOpen,
    onClose,
    total,
    paymentMethods,
    onConfirm,
    isLoading,
}: {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    paymentMethods: any[];
    onConfirm: (methodId: string, amount: number, reference?: string) => void;
    isLoading: boolean;
}) => {
    const { formatCurrency } = useCurrency();
    const [selectedMethod, setSelectedMethod] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [reference, setReference] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPaidAmount(total.toString());
            setReference('');
            if (paymentMethods.length > 0) {
                setSelectedMethod(paymentMethods[0].id);
            }
        }
    }, [isOpen, total, paymentMethods]);

    const change = parseFloat(paidAmount) - total;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Payment">
            <div className="space-y-4">
                <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(total)}</p>
                </div>

                <div>
                    <label className="mb-2 block">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.filter(m => m.is_active).map((method) => (
                            <button
                                key={method.id}
                                type="button"
                                className={`p-3 border rounded ${
                                    selectedMethod === method.id
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-primary'
                                }`}
                                onClick={() => setSelectedMethod(method.id)}
                            >
                                {method.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="paid_amount">Amount Received</label>
                    <input
                        id="paid_amount"
                        type="number"
                        step="0.01"
                        className="form-input text-lg font-bold"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                    />
                </div>

                {change > 0 && (
                    <div className="text-center py-2 bg-success-light rounded">
                        <p className="text-sm text-gray-500">Change</p>
                        <p className="text-xl font-bold text-success">{formatCurrency(change)}</p>
                    </div>
                )}

                <div>
                    <label htmlFor="reference">Reference (Optional)</label>
                    <input
                        id="reference"
                        type="text"
                        className="form-input"
                        placeholder="Transaction reference..."
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <button type="button" className="btn btn-outline-dark flex-1" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary flex-1"
                        onClick={() => onConfirm(selectedMethod, parseFloat(paidAmount), reference)}
                        disabled={isLoading || !selectedMethod || parseFloat(paidAmount) < total}
                    >
                        {isLoading && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                        Complete Sale
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PosIndex;
