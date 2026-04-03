import { useState } from 'react';
import { useGetExpenseCategoriesQuery, useCreateExpenseCategoryMutation, useUpdateExpenseCategoryMutation, useDeleteExpenseCategoryMutation } from '../../store/api/settingsApi';
import Modal from '../../components/Common/Modal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import type { ExpenseCategory } from '../../types/settings';

const ExpenseCategories = () => {
    const { data, isLoading } = useGetExpenseCategoriesQuery();
    const [createCategory, { isLoading: isCreating }] = useCreateExpenseCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateExpenseCategoryMutation();
    const [deleteCategory, { isLoading: isDeleting }] = useDeleteExpenseCategoryMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', is_active: true });
    const [error, setError] = useState('');

    const handleOpenModal = (category?: ExpenseCategory) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, description: category.description || '', is_active: category.is_active });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '', is_active: true });
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (editingCategory) {
                await updateCategory({ id: editingCategory.id, data: formData }).unwrap();
            } else {
                await createCategory(formData).unwrap();
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

    if (isLoading) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">Expense Categories</h5>
                <button type="button" className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Category
                </button>
            </div>

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.expense_categories.map((category) => (
                            <tr key={category.id}>
                                <td className="font-semibold">{category.name}</td>
                                <td>{category.description || '-'}</td>
                                <td>
                                    <span className={`badge ${category.is_active ? 'bg-success' : 'bg-danger'}`}>
                                        {category.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleOpenModal(category)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => {
                                                setDeletingId(category.id);
                                                setIsDeleteOpen(true);
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Add Category'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="bg-danger-light text-danger p-3 rounded">{error}</div>}
                    <div>
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            type="text"
                            className="form-input"
                            placeholder="Rent, Utilities, Supplies..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description">Description (Optional)</label>
                        <textarea
                            id="description"
                            className="form-textarea"
                            placeholder="Brief description..."
                            rows={3}
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

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Category"
                message="Are you sure you want to delete this expense category? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default ExpenseCategories;
