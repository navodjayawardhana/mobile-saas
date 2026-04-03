import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useGetProductQuery, useUpdateProductMutation, useGetCategoryTreeQuery, useGetAllBrandsQuery } from '../../../store/api/inventoryApi';

const ProductsEdit = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data, isLoading: isFetching } = useGetProductQuery(id!);
    const [updateProduct, { isLoading }] = useUpdateProductMutation();
    const { data: categoriesData } = useGetCategoryTreeQuery();
    const { data: brandsData } = useGetAllBrandsQuery();

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
        min_stock_alert: '5',
        warranty_months: '',
        description: '',
        is_active: true,
    });
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (data?.product) {
            const p = data.product;
            setFormData({
                name: p.name,
                sku: p.sku || '',
                barcode: p.barcode || '',
                category_id: p.category_id || '',
                brand_id: p.brand_id || '',
                type: p.type,
                condition: p.condition,
                cost_price: p.cost_price.toString(),
                selling_price: p.selling_price.toString(),
                min_stock_alert: p.min_stock_alert.toString(),
                warranty_months: p.warranty_months?.toString() || '',
                description: p.description || '',
                is_active: p.is_active,
            });
        }
    }, [data]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validate()) return;

        try {
            const payload = {
                name: formData.name,
                sku: formData.sku || undefined,
                barcode: formData.barcode || undefined,
                category_id: formData.category_id || undefined,
                brand_id: formData.brand_id || undefined,
                type: formData.type,
                condition: formData.condition,
                cost_price: parseFloat(formData.cost_price),
                selling_price: parseFloat(formData.selling_price),
                min_stock_alert: parseInt(formData.min_stock_alert) || 5,
                warranty_months: formData.warranty_months ? parseInt(formData.warranty_months) : null,
                description: formData.description || undefined,
                is_active: formData.is_active,
            };

            await updateProduct({ id: id!, data: payload }).unwrap();
            navigate(`/inventory/products/${id}`);
        } catch (err: any) {
            setError(err?.data?.message || 'An error occurred');
            if (err?.data?.errors) {
                setFormErrors(err.data.errors);
            }
        }
    };

    if (isFetching) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">Edit Product</h5>
                <Link to={`/inventory/products/${id}`} className="btn btn-outline-dark">
                    Back to Product
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
                                                onChange={() => setFormData({ ...formData, type: t })}
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
                                <div>
                                    <label htmlFor="category_id">Category</label>
                                    <select
                                        id="category_id"
                                        className="form-select"
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
                                </div>
                                <div>
                                    <label htmlFor="brand_id">Brand</label>
                                    <select
                                        id="brand_id"
                                        className="form-select"
                                        value={formData.brand_id}
                                        onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                                    >
                                        <option value="">Select Brand</option>
                                        {brandsData?.brands.map((brand) => (
                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Pricing & Stock */}
                        <div className="space-y-4">
                            <h6 className="font-semibold text-base border-b pb-2">Pricing & Settings</h6>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="cost_price">Cost Price *</label>
                                    <input
                                        id="cost_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className={`form-input ${formErrors.cost_price ? 'border-danger' : ''}`}
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
                                        value={formData.selling_price}
                                        onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                                    />
                                    {formErrors.selling_price && <span className="text-danger text-xs">{formErrors.selling_price}</span>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="min_stock_alert">Low Stock Alert Threshold</label>
                                <input
                                    id="min_stock_alert"
                                    type="number"
                                    min="0"
                                    className="form-input"
                                    value={formData.min_stock_alert}
                                    onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                                />
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
                        <Link to={`/inventory/products/${id}`} className="btn btn-outline-dark">
                            Cancel
                        </Link>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            Save Changes
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductsEdit;
