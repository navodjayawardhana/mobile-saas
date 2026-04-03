import { useState } from 'react';
import { useGetPaymentMethodsQuery, useCreatePaymentMethodMutation, useUpdatePaymentMethodMutation, useDeletePaymentMethodMutation, useTogglePaymentMethodMutation } from '../../store/api/settingsApi';
import Modal from '../../components/Common/Modal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import type { PaymentMethod } from '../../types/settings';

const PaymentMethods = () => {
    const { data, isLoading } = useGetPaymentMethodsQuery();
    const [createPaymentMethod, { isLoading: isCreating }] = useCreatePaymentMethodMutation();
    const [updatePaymentMethod, { isLoading: isUpdating }] = useUpdatePaymentMethodMutation();
    const [deletePaymentMethod, { isLoading: isDeleting }] = useDeletePaymentMethodMutation();
    const [togglePaymentMethod] = useTogglePaymentMethodMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', is_active: true });
    const [error, setError] = useState('');

    const handleOpenModal = (method?: PaymentMethod) => {
        if (method) {
            setEditingMethod(method);
            setFormData({ name: method.name, is_active: method.is_active });
        } else {
            setEditingMethod(null);
            setFormData({ name: '', is_active: true });
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (editingMethod) {
                await updatePaymentMethod({ id: editingMethod.id, data: formData }).unwrap();
            } else {
                await createPaymentMethod(formData).unwrap();
            }
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err?.data?.message || 'An error occurred');
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deletePaymentMethod(deletingId).unwrap();
            setIsDeleteOpen(false);
            setDeletingId(null);
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot delete payment method');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await togglePaymentMethod(id).unwrap();
        } catch (err: any) {
            console.error(err);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">Payment Methods</h5>
                <button type="button" className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Payment Method
                </button>
            </div>

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.payment_methods.map((method) => (
                            <tr key={method.id}>
                                <td className="font-semibold">{method.name}</td>
                                <td>
                                    <label className="relative h-6 w-12">
                                        <input
                                            type="checkbox"
                                            className="custom_switch peer absolute z-10 h-full w-full cursor-pointer opacity-0"
                                            checked={method.is_active}
                                            onChange={() => handleToggle(method.id)}
                                        />
                                        <span className="block h-full rounded-full bg-[#ebedf2] before:absolute before:bottom-1 before:left-1 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-all before:duration-300 peer-checked:bg-primary peer-checked:before:left-7 dark:bg-dark dark:before:bg-white-dark dark:peer-checked:before:bg-white"></span>
                                    </label>
                                </td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleOpenModal(method)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => {
                                                setDeletingId(method.id);
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="bg-danger-light text-danger p-3 rounded">{error}</div>}
                    <div>
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            type="text"
                            className="form-input"
                            placeholder="Cash, Card, Bank Transfer..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
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
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isCreating || isUpdating}>
                            {(isCreating || isUpdating) && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            {editingMethod ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Payment Method"
                message="Are you sure you want to delete this payment method? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default PaymentMethods;
