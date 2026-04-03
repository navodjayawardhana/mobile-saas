import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    useGetSuppliersQuery,
    useDeleteSupplierMutation,
    useCreateSupplierMutation,
    useUpdateSupplierMutation,
    useToggleSupplierActiveMutation,
} from '../../store/api/suppliersApi';
import type { Supplier } from '../../store/api/suppliersApi';
import Modal from '../../components/Common/Modal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { useCurrency } from '../../hooks/useCurrency';

const SuppliersIndex = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [isActive, setIsActive] = useState<string>('');
    const [hasDues, setHasDues] = useState(false);

    const { data, isLoading } = useGetSuppliersQuery({
        page,
        search,
        is_active: isActive === '' ? undefined : isActive === 'true',
        has_dues: hasDues || undefined,
    });
    const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
    const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
    const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation();
    const [toggleActive] = useToggleSupplierActiveMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        payment_terms: '',
        is_active: true,
    });

    const { formatCurrency } = useCurrency();

    const openCreateModal = () => {
        setEditingSupplier(null);
        setFormData({
            name: '',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
            payment_terms: '',
            is_active: true,
        });
        setError('');
        setIsModalOpen(true);
    };

    const openEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contact_person: supplier.contact_person || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            payment_terms: supplier.payment_terms || '',
            is_active: supplier.is_active,
        });
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const payload = {
            name: formData.name,
            contact_person: formData.contact_person || undefined,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            address: formData.address || undefined,
            payment_terms: formData.payment_terms || undefined,
            is_active: formData.is_active,
        };

        try {
            if (editingSupplier) {
                await updateSupplier({ id: editingSupplier.id, data: payload }).unwrap();
            } else {
                await createSupplier(payload).unwrap();
            }
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err?.data?.message || 'An error occurred');
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteSupplier(deletingId).unwrap();
            setIsDeleteOpen(false);
            setDeletingId(null);
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot delete supplier');
        }
    };

    const handleToggleActive = async (supplier: Supplier) => {
        try {
            await toggleActive(supplier.id).unwrap();
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to update status');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="panel">
            <div className="flex flex-col md:flex-row items-center justify-between mb-5 gap-4">
                <h5 className="text-lg font-semibold dark:text-white-light">Suppliers</h5>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                    <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Supplier
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search name, contact, phone..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
                <select
                    className="form-select"
                    value={isActive}
                    onChange={(e) => {
                        setIsActive(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={hasDues}
                        onChange={(e) => {
                            setHasDues(e.target.checked);
                            setPage(1);
                        }}
                    />
                    <span className="ml-2">Has Outstanding Dues</span>
                </label>
                <Link to="/suppliers/dues" className="btn btn-outline-warning">
                    <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    View All Dues
                </Link>
            </div>

            {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>Supplier</th>
                            <th>Contact Person</th>
                            <th>Contact Info</th>
                            <th>Total Purchases</th>
                            <th>Outstanding Dues</th>
                            <th>Status</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.suppliers.map((supplier) => (
                            <tr key={supplier.id}>
                                <td>
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center mr-3 text-sm font-bold">
                                            {supplier.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-semibold">{supplier.name}</span>
                                    </div>
                                </td>
                                <td>{supplier.contact_person || '-'}</td>
                                <td>
                                    {supplier.phone && <p>{supplier.phone}</p>}
                                    {supplier.email && <p className="text-xs text-gray-500">{supplier.email}</p>}
                                </td>
                                <td className="font-semibold">{formatCurrency(supplier.total_purchases)}</td>
                                <td>
                                    <span className={supplier.total_due > 0 ? 'text-danger font-bold' : 'text-success'}>
                                        {formatCurrency(supplier.total_due)}
                                    </span>
                                </td>
                                <td>
                                    <label className="w-12 h-6 relative">
                                        <input
                                            type="checkbox"
                                            className="custom_switch absolute w-full h-full opacity-0 z-10 cursor-pointer peer"
                                            checked={supplier.is_active}
                                            onChange={() => handleToggleActive(supplier)}
                                        />
                                        <span className="bg-[#ebedf2] dark:bg-dark block h-full rounded-full before:absolute before:left-1 before:bg-white dark:before:bg-white-dark dark:peer-checked:before:bg-white before:bottom-1 before:w-4 before:h-4 before:rounded-full peer-checked:before:left-7 peer-checked:bg-primary before:transition-all before:duration-300"></span>
                                    </label>
                                </td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Link to={`/suppliers/${supplier.id}`} className="btn btn-sm btn-outline-info">
                                            View
                                        </Link>
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(supplier)}>
                                            Edit
                                        </button>
                                        {supplier.total_due > 0 && (
                                            <Link to={`/suppliers/${supplier.id}/pay`} className="btn btn-sm btn-outline-success">
                                                Pay
                                            </Link>
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => {
                                                setDeletingId(supplier.id);
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

            {data?.suppliers.length === 0 && <div className="text-center py-10 text-gray-500">No suppliers found.</div>}

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
                        {Array.from({ length: Math.min(data.meta.last_page, 5) }, (_, i) => i + 1).map((p) => (
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
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name">Supplier Name *</label>
                            <input
                                id="name"
                                type="text"
                                className="form-input"
                                placeholder="Company/Supplier name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="contact_person">Contact Person</label>
                            <input
                                id="contact_person"
                                type="text"
                                className="form-input"
                                placeholder="Contact person name"
                                value={formData.contact_person}
                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="phone">Phone</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    className="form-input"
                                    placeholder="Phone number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="Email address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="address">Address</label>
                            <textarea
                                id="address"
                                className="form-textarea"
                                rows={2}
                                placeholder="Address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="payment_terms">Payment Terms</label>
                            <input
                                id="payment_terms"
                                type="text"
                                className="form-input"
                                placeholder="e.g., Net 30, COD, etc."
                                value={formData.payment_terms}
                                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
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
                            {(isCreating || isUpdating) && (
                                <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>
                            )}
                            {editingSupplier ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Supplier"
                message="Are you sure you want to delete this supplier? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default SuppliersIndex;
