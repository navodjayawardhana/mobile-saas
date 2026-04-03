import { useState } from 'react';
import { useGetBrandsQuery, useCreateBrandMutation, useUpdateBrandMutation, useDeleteBrandMutation, useToggleBrandActiveMutation } from '../../../store/api/inventoryApi';
import type { Brand } from '../../../store/api/inventoryApi';
import Modal from '../../../components/Common/Modal';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';

const BrandsIndex = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const { data, isLoading } = useGetBrandsQuery({ page, search });
    const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
    const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();
    const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation();
    const [toggleActive] = useToggleBrandActiveMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        is_active: true,
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const openCreateModal = () => {
        setEditingBrand(null);
        setFormData({ name: '', is_active: true });
        setLogoFile(null);
        setError('');
        setIsModalOpen(true);
    };

    const openEditModal = (brand: Brand) => {
        setEditingBrand(brand);
        setFormData({
            name: brand.name,
            is_active: brand.is_active,
        });
        setLogoFile(null);
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const data = new FormData();
        data.append('name', formData.name);
        data.append('is_active', formData.is_active ? '1' : '0');
        if (logoFile) data.append('logo', logoFile);

        try {
            if (editingBrand) {
                await updateBrand({ id: editingBrand.id, data }).unwrap();
            } else {
                await createBrand(data).unwrap();
            }
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err?.data?.message || 'An error occurred');
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteBrand(deletingId).unwrap();
            setIsDeleteOpen(false);
            setDeletingId(null);
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot delete brand');
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            await toggleActive(id).unwrap();
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot change status');
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="panel">
            <div className="flex flex-col md:flex-row items-center justify-between mb-5 gap-4">
                <h5 className="text-lg font-semibold dark:text-white-light">Brands</h5>
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
                        Add Brand
                    </button>
                </div>
            </div>

            {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Products</th>
                            <th>Status</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.brands.map((brand) => (
                            <tr key={brand.id}>
                                <td>
                                    <div className="flex items-center">
                                        {brand.logo ? (
                                            <img src={`/storage/${brand.logo}`} alt="" className="w-8 h-8 rounded object-contain mr-2 bg-white p-1" />
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                                                <span className="text-xs font-bold text-gray-500">{brand.name.charAt(0)}</span>
                                            </div>
                                        )}
                                        <span className="font-semibold">{brand.name}</span>
                                    </div>
                                </td>
                                <td>{brand.products_count || 0}</td>
                                <td>
                                    <label className="relative h-6 w-12">
                                        <input
                                            type="checkbox"
                                            className="custom_switch peer absolute z-10 h-full w-full cursor-pointer opacity-0"
                                            checked={brand.is_active}
                                            onChange={() => handleToggleActive(brand.id)}
                                        />
                                        <span className="block h-full rounded-full bg-[#ebedf2] before:absolute before:bottom-1 before:left-1 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-all before:duration-300 peer-checked:bg-primary peer-checked:before:left-7 dark:bg-dark dark:before:bg-white-dark dark:peer-checked:before:bg-white"></span>
                                    </label>
                                </td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => openEditModal(brand)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => {
                                                setDeletingId(brand.id);
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
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBrand ? 'Edit Brand' : 'Add Brand'}>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name">Brand Name *</label>
                            <input
                                id="name"
                                type="text"
                                className="form-input"
                                placeholder="Enter brand name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="logo">Logo</label>
                            <input
                                id="logo"
                                type="file"
                                className="form-input file:py-2 file:px-4 file:border-0 file:font-semibold p-0 file:bg-primary/90 file:text-white file:hover:bg-primary"
                                accept="image/*"
                                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                            />
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
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isCreating || isUpdating}>
                            {(isCreating || isUpdating) && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            {editingBrand ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Brand"
                message="Are you sure you want to delete this brand? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default BrandsIndex;
