import { useState } from 'react';
import { useGetCurrenciesQuery, useCreateCurrencyMutation, useUpdateCurrencyMutation, useDeleteCurrencyMutation, useSetDefaultCurrencyMutation } from '../../store/api/settingsApi';
import Modal from '../../components/Common/Modal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import type { Currency } from '../../types/settings';

const Currencies = () => {
    const { data, isLoading } = useGetCurrenciesQuery();
    const [createCurrency, { isLoading: isCreating }] = useCreateCurrencyMutation();
    const [updateCurrency, { isLoading: isUpdating }] = useUpdateCurrencyMutation();
    const [deleteCurrency, { isLoading: isDeleting }] = useDeleteCurrencyMutation();
    const [setDefaultCurrency] = useSetDefaultCurrencyMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ code: '', name: '', symbol: '', exchange_rate: '1' });
    const [error, setError] = useState('');

    const handleOpenModal = (currency?: Currency) => {
        if (currency) {
            setEditingCurrency(currency);
            setFormData({
                code: currency.code,
                name: currency.name,
                symbol: currency.symbol,
                exchange_rate: currency.exchange_rate.toString(),
            });
        } else {
            setEditingCurrency(null);
            setFormData({ code: '', name: '', symbol: '', exchange_rate: '1' });
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const payload = {
                code: formData.code,
                name: formData.name,
                symbol: formData.symbol,
                exchange_rate: parseFloat(formData.exchange_rate),
            };

            if (editingCurrency) {
                await updateCurrency({ id: editingCurrency.id, data: payload }).unwrap();
            } else {
                await createCurrency(payload).unwrap();
            }
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err?.data?.message || 'An error occurred');
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteCurrency(deletingId).unwrap();
            setIsDeleteOpen(false);
            setDeletingId(null);
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot delete currency');
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await setDefaultCurrency(id).unwrap();
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
                <h5 className="text-lg font-semibold dark:text-white-light">Currencies</h5>
                <button type="button" className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Currency
                </button>
            </div>

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Symbol</th>
                            <th>Exchange Rate</th>
                            <th>Default</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.currencies.map((currency) => (
                            <tr key={currency.id}>
                                <td className="font-semibold">{currency.code}</td>
                                <td>{currency.name}</td>
                                <td>{currency.symbol}</td>
                                <td>{currency.exchange_rate}</td>
                                <td>
                                    {currency.is_default ? (
                                        <span className="badge bg-success">Default</span>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleSetDefault(currency.id)}
                                        >
                                            Set Default
                                        </button>
                                    )}
                                </td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleOpenModal(currency)}
                                        >
                                            Edit
                                        </button>
                                        {!currency.is_default && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => {
                                                    setDeletingId(currency.id);
                                                    setIsDeleteOpen(true);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCurrency ? 'Edit Currency' : 'Add Currency'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="bg-danger-light text-danger p-3 rounded">{error}</div>}
                    <div>
                        <label htmlFor="code">Currency Code</label>
                        <input
                            id="code"
                            type="text"
                            className="form-input"
                            placeholder="USD"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            required
                            maxLength={10}
                        />
                    </div>
                    <div>
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            type="text"
                            className="form-input"
                            placeholder="US Dollar"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="symbol">Symbol</label>
                        <input
                            id="symbol"
                            type="text"
                            className="form-input"
                            placeholder="$"
                            value={formData.symbol}
                            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                            required
                            maxLength={10}
                        />
                    </div>
                    <div>
                        <label htmlFor="exchange_rate">Exchange Rate</label>
                        <input
                            id="exchange_rate"
                            type="number"
                            step="0.000001"
                            min="0"
                            className="form-input"
                            placeholder="1.00"
                            value={formData.exchange_rate}
                            onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isCreating || isUpdating}>
                            {(isCreating || isUpdating) && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            {editingCurrency ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Currency"
                message="Are you sure you want to delete this currency? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default Currencies;
