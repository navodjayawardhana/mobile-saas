import { useState, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { useCreateProductMutation, useGetCategoryTreeQuery, useGetAllBrandsQuery, useCreateCategoryMutation, useCreateBrandMutation } from '../../../store/api/inventoryApi';
import Swal from 'sweetalert2';

const ProductsCreate = () => {
    const navigate = useNavigate();
    const [createProduct, { isLoading }] = useCreateProductMutation();
    const { data: categoriesData, refetch: refetchCategories } = useGetCategoryTreeQuery();
    const { data: brandsData, refetch: refetchBrands } = useGetAllBrandsQuery();
    const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();
    const [createBrand, { isLoading: isCreatingBrand }] = useCreateBrandMutation();

    // Modal states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryParent, setNewCategoryParent] = useState('');
    const [newBrandName, setNewBrandName] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        barcode: '',
        category_id: '',
        brand_id: '',
        type: 'phone' as 'phone' | 'accessory' | 'spare_part',
        condition: 'new' as 'new' | 'used' | 'refurbished',
        cost_price: '',
        selling_price: '',
        quantity: '0',
        min_stock_alert: '5',
        is_serialized: true,
        warranty_months: '',
        description: '',
        is_active: true,
    });
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!formData.name) errors.name = 'Name is required';
        if (!formData.cost_price || parseFloat(formData.cost_price) < 0) errors.cost_price = 'Valid cost price is required';
        if (!formData.selling_price || parseFloat(formData.selling_price) < 0) errors.selling_price = 'Valid selling price is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleTypeChange = (type: 'phone' | 'accessory' | 'spare_part') => {
        setFormData({
            ...formData,
            type,
            is_serialized: type === 'phone',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validate()) return;

        try {
            const payload = {
                ...formData,
                cost_price: parseFloat(formData.cost_price),
                selling_price: parseFloat(formData.selling_price),
                quantity: parseInt(formData.quantity) || 0,
                min_stock_alert: parseInt(formData.min_stock_alert) || 5,
                warranty_months: formData.warranty_months ? parseInt(formData.warranty_months) : null,
                category_id: formData.category_id || undefined,
                brand_id: formData.brand_id || undefined,
                sku: formData.sku || undefined,
                barcode: formData.barcode || undefined,
                description: formData.description || undefined,
            };

            const result = await createProduct(payload).unwrap();
            navigate(`/inventory/products/${result.product.id}`);
        } catch (err: any) {
            setError(err?.data?.message || 'An error occurred');
            if (err?.data?.errors) {
                setFormErrors(err.data.errors);
            }
        }
    };

    // Quick Add Category
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            Swal.fire('Error', 'Category name is required', 'error');
            return;
        }

        try {
            const formDataObj = new FormData();
            formDataObj.append('name', newCategoryName.trim());
            if (newCategoryParent) {
                formDataObj.append('parent_id', newCategoryParent);
            }

            const result = await createCategory(formDataObj).unwrap();
            setFormData({ ...formData, category_id: result.category.id });
            setShowCategoryModal(false);
            setNewCategoryName('');
            setNewCategoryParent('');
            refetchCategories();
            Swal.fire('Success', 'Category created successfully', 'success');
        } catch (err: any) {
            Swal.fire('Error', err?.data?.message || 'Failed to create category', 'error');
        }
    };

    // Quick Add Brand
    const handleAddBrand = async () => {
        if (!newBrandName.trim()) {
            Swal.fire('Error', 'Brand name is required', 'error');
            return;
        }

        try {
            const formDataObj = new FormData();
            formDataObj.append('name', newBrandName.trim());

            const result = await createBrand(formDataObj).unwrap();
            setFormData({ ...formData, brand_id: result.brand.id });
            setShowBrandModal(false);
            setNewBrandName('');
            refetchBrands();
            Swal.fire('Success', 'Brand created successfully', 'success');
        } catch (err: any) {
            Swal.fire('Error', err?.data?.message || 'Failed to create brand', 'error');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">Add Product</h5>
                <Link to="/inventory/products" className="btn btn-outline-dark">
                    Back to Products
                </Link>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="panel">
                    {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h6 className="font-semibold text-base border-b pb-2">Basic Information</h6>

                            <div>
                                <label htmlFor="name">Product Name *</label>
                                <input
                                    id="name"
                                    type="text"
                                    className={`form-input ${formErrors.name ? 'border-danger' : ''}`}
                                    placeholder="Enter product name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                {formErrors.name && <span className="text-danger text-xs">{formErrors.name}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="sku">SKU</label>
                                    <input
                                        id="sku"
                                        type="text"
                                        className="form-input"
                                        placeholder="Auto-generated if empty"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="barcode">Barcode</label>
                                    <input
                                        id="barcode"
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter barcode"
                                        value={formData.barcode}
                                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="type">Product Type *</label>
                                <div className="flex gap-4 mt-2">
                                    {(['phone', 'accessory', 'spare_part'] as const).map((t) => (
                                        <label key={t} className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                className="form-radio"
                                                checked={formData.type === t}
                                                onChange={() => handleTypeChange(t)}
                                            />
                                            <span className="ml-2 capitalize">{t.replace('_', ' ')}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="condition">Condition</label>
                                <select
                                    id="condition"
                                    className="form-select"
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                                >
                                    <option value="new">New</option>
                                    <option value="used">Used</option>
                                    <option value="refurbished">Refurbished</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Category with Quick Add */}
                                <div>
                                    <label htmlFor="category_id">Category</label>
                                    <div className="flex gap-2">
                                        <select
                                            id="category_id"
                                            className="form-select flex-1"
                                            value={formData.category_id}
                                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        >
                                            <option value="">Select Category</option>
                                            {categoryOptions.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {'—'.repeat(cat.level)} {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-primary px-3"
                                            onClick={() => setShowCategoryModal(true)}
                                            title="Add New Category"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Brand with Quick Add */}
                                <div>
                                    <label htmlFor="brand_id">Brand</label>
                                    <div className="flex gap-2">
                                        <select
                                            id="brand_id"
                                            className="form-select flex-1"
                                            value={formData.brand_id}
                                            onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                                        >
                                            <option value="">Select Brand</option>
                                            {brandsData?.brands.map((brand) => (
                                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-primary px-3"
                                            onClick={() => setShowBrandModal(true)}
                                            title="Add New Brand"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing & Stock */}
                        <div className="space-y-4">
                            <h6 className="font-semibold text-base border-b pb-2">Pricing & Stock</h6>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="cost_price">Cost Price *</label>
                                    <input
                                        id="cost_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className={`form-input ${formErrors.cost_price ? 'border-danger' : ''}`}
                                        placeholder="0.00"
                                        value={formData.cost_price}
                                        onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                    />
                                    {formErrors.cost_price && <span className="text-danger text-xs">{formErrors.cost_price}</span>}
                                </div>
                                <div>
                                    <label htmlFor="selling_price">Selling Price *</label>
                                    <input
                                        id="selling_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className={`form-input ${formErrors.selling_price ? 'border-danger' : ''}`}
                                        placeholder="0.00"
                                        value={formData.selling_price}
                                        onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                                    />
                                    {formErrors.selling_price && <span className="text-danger text-xs">{formErrors.selling_price}</span>}
                                </div>
                            </div>

                            {!formData.is_serialized && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="quantity">Initial Quantity</label>
                                        <input
                                            id="quantity"
                                            type="number"
                                            min="0"
                                            className="form-input"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="min_stock_alert">Low Stock Alert</label>
                                        <input
                                            id="min_stock_alert"
                                            type="number"
                                            min="0"
                                            className="form-input"
                                            value={formData.min_stock_alert}
                                            onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox"
                                        checked={formData.is_serialized}
                                        onChange={(e) => setFormData({ ...formData, is_serialized: e.target.checked })}
                                    />
                                    <span className="ml-2">Serialized (Track by IMEI/Serial Number)</span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1">Enable for phones and items that need individual tracking</p>
                            </div>

                            <div>
                                <label htmlFor="warranty_months">Warranty (Months)</label>
                                <input
                                    id="warranty_months"
                                    type="number"
                                    min="0"
                                    className="form-input"
                                    placeholder="e.g., 12"
                                    value={formData.warranty_months}
                                    onChange={(e) => setFormData({ ...formData, warranty_months: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    className="form-textarea"
                                    rows={3}
                                    placeholder="Product description..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <span className="ml-2">Active</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Link to="/inventory/products" className="btn btn-outline-dark">
                            Cancel
                        </Link>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            Create Product
                        </button>
                    </div>
                </div>
            </form>

            {/* Quick Add Category Modal */}
            <Transition appear show={showCategoryModal} as={Fragment}>
                <Dialog as="div" open={showCategoryModal} onClose={() => setShowCategoryModal(false)} className="relative z-50">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="panel w-full max-w-md overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <h5 className="text-lg font-bold">Add New Category</h5>
                                        <button type="button" onClick={() => setShowCategoryModal(false)} className="text-white-dark hover:text-dark">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="newCategoryName">Category Name *</label>
                                                <input
                                                    id="newCategoryName"
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Enter category name"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="newCategoryParent">Parent Category (Optional)</label>
                                                <select
                                                    id="newCategoryParent"
                                                    className="form-select"
                                                    value={newCategoryParent}
                                                    onChange={(e) => setNewCategoryParent(e.target.value)}
                                                >
                                                    <option value="">No Parent (Root Category)</option>
                                                    {categoryOptions.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {'—'.repeat(cat.level)} {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-8 flex items-center justify-end gap-3">
                                            <button type="button" className="btn btn-outline-dark" onClick={() => setShowCategoryModal(false)}>
                                                Cancel
                                            </button>
                                            <button type="button" className="btn btn-primary" onClick={handleAddCategory} disabled={isCreatingCategory}>
                                                {isCreatingCategory && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                                                Add Category
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Quick Add Brand Modal */}
            <Transition appear show={showBrandModal} as={Fragment}>
                <Dialog as="div" open={showBrandModal} onClose={() => setShowBrandModal(false)} className="relative z-50">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="panel w-full max-w-md overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <h5 className="text-lg font-bold">Add New Brand</h5>
                                        <button type="button" onClick={() => setShowBrandModal(false)} className="text-white-dark hover:text-dark">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="newBrandName">Brand Name *</label>
                                                <input
                                                    id="newBrandName"
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Enter brand name"
                                                    value={newBrandName}
                                                    onChange={(e) => setNewBrandName(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-8 flex items-center justify-end gap-3">
                                            <button type="button" className="btn btn-outline-dark" onClick={() => setShowBrandModal(false)}>
                                                Cancel
                                            </button>
                                            <button type="button" className="btn btn-primary" onClick={handleAddBrand} disabled={isCreatingBrand}>
                                                {isCreatingBrand && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                                                Add Brand
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default ProductsCreate;
