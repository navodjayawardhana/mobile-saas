import { useState } from 'react';
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation, useGetCategoryTreeQuery } from '../../../store/api/inventoryApi';
import type { Category } from '../../../store/api/inventoryApi';
import Modal from '../../../components/Common/Modal';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';

const CategoriesIndex = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const { data, isLoading } = useGetCategoriesQuery({ page, search });
    const { data: treeData } = useGetCategoryTreeQuery();
    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
    const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        parent_id: '',
        sort_order: 0,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormData({ name: '', parent_id: '', sort_order: 0 });
        setImageFile(null);
        setError('');
        setIsModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            parent_id: category.parent_id || '',
            sort_order: category.sort_order,
        });
        setImageFile(null);
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const data = new FormData();
        data.append('name', formData.name);
        if (formData.parent_id) data.append('parent_id', formData.parent_id);
        data.append('sort_order', formData.sort_order.toString());
        if (imageFile) data.append('image', imageFile);

        try {
            if (editingCategory) {
                await updateCategory({ id: editingCategory.id, data }).unwrap();
            } else {
                await createCategory(data).unwrap();
            }
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err?.data?.message || 'An error occurred');
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteCategory(deletingId).unwrap();
            setIsDeleteOpen(false);
            setDeletingId(null);
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot delete category');
        }
    };

    // Flatten tree for parent selection (exclude current category and its descendants)
    const getParentOptions = (categories: Category[] = [], level = 0, excludeId?: string): { id: string; name: string; level: number }[] => {
        let options: { id: string; name: string; level: number }[] = [];
        for (const cat of categories) {
            if (cat.id === excludeId) continue;
            options.push({ id: cat.id, name: cat.name, level });
            if (cat.children) {
                options = [...options, ...getParentOptions(cat.children, level + 1, excludeId)];
            }
        }
        return options;
    };

    const parentOptions = getParentOptions(treeData?.categories, 0, editingCategory?.id);

    if (isLoading) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="panel">
            <div className="flex flex-col md:flex-row items-center justify-between mb-5 gap-4">
                <h5 className="text-lg font-semibold dark:text-white-light">Categories</h5>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        className="form-input w-auto"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                    <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                        <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Category
                    </button>
                </div>
            </div>

            {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Parent</th>
                            <th>Products</th>
                            <th>Sort Order</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.categories.map((category) => (
                            <tr key={category.id}>
                                <td>
                                    <div className="flex items-center">
                                        {category.image ? (
                                            <img src={`/storage/${category.image}`} alt="" className="w-8 h-8 rounded object-cover mr-2" />
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                </svg>
                                            </div>
                                        )}
                                        <span className="font-semibold">{category.name}</span>
                                    </div>
                                </td>
                                <td>{category.parent?.name || '-'}</td>
                                <td>{category.products_count || 0}</td>
                                <td>{category.sort_order}</td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => openEditModal(category)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => {
                                                setDeletingId(category.id);
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
                        {Array.from({ length: data.meta.last_page }, (_, i) => i + 1).map((p) => (
                            <li key={p}>
                                <button
                                    type="button"
                                    className={`flex justify-center font-semibold px-3.5 py-2 rounded transition ${
                                        p === page
                                            ? 'bg-primary text-white'
                                            : 'bg-white-light text-dark hover:text-white hover:bg-primary dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary'
                                    }`}
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </button>
                            </li>
                        ))}
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

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Add Category'}>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name">Category Name *</label>
                            <input
                                id="name"
                                type="text"
                                className="form-input"
                                placeholder="Enter category name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="parent_id">Parent Category</label>
                            <select
                                id="parent_id"
                                className="form-select"
                                value={formData.parent_id}
                                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                            >
                                <option value="">None (Root Category)</option>
                                {parentOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                        {'—'.repeat(opt.level)} {opt.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="sort_order">Sort Order</label>
                            <input
                                id="sort_order"
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.sort_order}
                                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label htmlFor="image">Image</label>
                            <input
                                id="image"
                                type="file"
                                className="form-input file:py-2 file:px-4 file:border-0 file:font-semibold p-0 file:bg-primary/90 file:text-white file:hover:bg-primary"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isCreating || isUpdating}>
                            {(isCreating || isUpdating) && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            {editingCategory ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Category"
                message="Are you sure you want to delete this category? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default CategoriesIndex;
