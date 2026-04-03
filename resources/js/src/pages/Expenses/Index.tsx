import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useGetExpensesQuery, useCreateExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation, Expense } from '../../store/api/expensesApi';
import { useGetExpenseCategoriesQuery } from '../../store/api/settingsApi';
import { useCurrency } from '../../hooks/useCurrency';
import Swal from 'sweetalert2';

const ExpensesIndex = () => {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        search: '',
        category_id: '',
        date_from: '',
        date_to: '',
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [formData, setFormData] = useState({
        expense_category_id: '',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const { data, isLoading, refetch } = useGetExpensesQuery({
        page,
        per_page: 15,
        ...filters,
    });

    const { data: categoriesData } = useGetExpenseCategoriesQuery();
    const categories = categoriesData?.expense_categories;
    const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
    const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
    const [deleteExpense] = useDeleteExpenseMutation();

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            category_id: '',
            date_from: '',
            date_to: '',
        });
        setPage(1);
    };

    const openCreateModal = () => {
        setEditingExpense(null);
        setFormData({
            expense_category_id: '',
            description: '',
            amount: '',
            expense_date: new Date().toISOString().split('T')[0],
            notes: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setFormData({
            expense_category_id: expense.expense_category_id,
            description: expense.description,
            amount: expense.amount.toString(),
            expense_date: expense.expense_date.split('T')[0],
            notes: expense.notes || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.expense_category_id || !formData.description || !formData.amount) {
            Swal.fire('Error', 'Please fill in all required fields', 'error');
            return;
        }

        try {
            const submitData = {
                expense_category_id: formData.expense_category_id,
                description: formData.description,
                amount: parseFloat(formData.amount),
                expense_date: formData.expense_date,
                notes: formData.notes || undefined,
            };

            if (editingExpense) {
                await updateExpense({ id: editingExpense.id, data: submitData }).unwrap();
                Swal.fire('Success', 'Expense updated successfully', 'success');
            } else {
                await createExpense(submitData).unwrap();
                Swal.fire('Success', 'Expense created successfully', 'success');
            }
            closeModal();
            refetch();
        } catch (error: any) {
            Swal.fire('Error', error.data?.message || 'An error occurred', 'error');
        }
    };

    const handleDelete = async (expense: Expense) => {
        const result = await Swal.fire({
            title: 'Delete Expense?',
            text: `Are you sure you want to delete this expense: "${expense.description}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Yes, delete it',
        });

        if (result.isConfirmed) {
            try {
                await deleteExpense(expense.id).unwrap();
                Swal.fire('Deleted!', 'Expense has been deleted.', 'success');
                refetch();
            } catch (error: any) {
                Swal.fire('Error', error.data?.message || 'Failed to delete expense', 'error');
            }
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const { formatCurrency } = useCurrency();

    const totalExpenses = data?.data.reduce((sum, exp) => sum + parseFloat(exp.amount as unknown as string), 0) || 0;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="panel">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h5 className="text-lg font-semibold dark:text-white-light">Expenses</h5>
                        <p className="text-gray-500">Manage your business expenses</p>
                    </div>
                    <button onClick={openCreateModal} className="btn btn-primary">
                        <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 4v16m8-8H4" />
                        </svg>
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="panel">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search description..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <div>
                        <select className="form-select" value={filters.category_id} onChange={(e) => handleFilterChange('category_id', e.target.value)}>
                            <option value="">All Categories</option>
                            {categories?.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <input type="date" className="form-input" placeholder="From Date" value={filters.date_from} onChange={(e) => handleFilterChange('date_from', e.target.value)} />
                    </div>
                    <div>
                        <input type="date" className="form-input" placeholder="To Date" value={filters.date_to} onChange={(e) => handleFilterChange('date_to', e.target.value)} />
                    </div>
                    <div>
                        <button onClick={resetFilters} className="btn btn-outline-secondary w-full">
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Card */}
            {data && data.data.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="panel bg-danger text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-lg opacity-80">Total Expenses (This Page)</p>
                                <h2 className="text-2xl font-bold mt-1">{formatCurrency(totalExpenses)}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="panel bg-info text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-lg opacity-80">Total Records</p>
                                <h2 className="text-2xl font-bold mt-1">{data.total}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" />
                                    <path d="M8 21h8M12 17v4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="panel bg-warning text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-lg opacity-80">Categories Used</p>
                                <h2 className="text-2xl font-bold mt-1">{new Set(data.data.map((e) => e.expense_category_id)).size}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <path d="M22 6l-10 7L2 6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Expenses Table */}
            <div className="panel">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : data?.data && data.data.length > 0 ? (
                    <>
                        <div className="table-responsive">
                            <table className="table-striped">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th>Amount</th>
                                        <th>Added By</th>
                                        <th>Receipt</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.data.map((expense) => (
                                        <tr key={expense.id}>
                                            <td className="whitespace-nowrap">{formatDate(expense.expense_date)}</td>
                                            <td>
                                                <span className="badge bg-info">{expense.category?.name || 'Unknown'}</span>
                                            </td>
                                            <td>
                                                <div>
                                                    <span className="font-medium">{expense.description}</span>
                                                    {expense.notes && <p className="text-xs text-gray-500 truncate max-w-xs">{expense.notes}</p>}
                                                </div>
                                            </td>
                                            <td className="font-semibold text-danger">{formatCurrency(expense.amount)}</td>
                                            <td>{expense.user?.name || 'Unknown'}</td>
                                            <td>
                                                {expense.receipt_path ? (
                                                    <a href={`/storage/${expense.receipt_path}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                        View Receipt
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">No receipt</span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openEditModal(expense)} className="btn btn-sm btn-outline-primary">
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(expense)} className="btn btn-sm btn-outline-danger">
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
                        {data.last_page > 1 && (
                            <div className="flex justify-center mt-6">
                                <ul className="inline-flex items-center space-x-1 rtl:space-x-reverse">
                                    <li>
                                        <button
                                            type="button"
                                            className="flex justify-center items-center w-10 h-10 rounded-full transition bg-white-light text-dark hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    </li>
                                    {Array.from({ length: Math.min(5, data.last_page) }, (_, i) => {
                                        let pageNum;
                                        if (data.last_page <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= data.last_page - 2) {
                                            pageNum = data.last_page - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }
                                        return (
                                            <li key={pageNum}>
                                                <button
                                                    type="button"
                                                    className={`flex justify-center items-center w-10 h-10 rounded-full transition ${
                                                        page === pageNum
                                                            ? 'bg-primary text-white'
                                                            : 'bg-white-light text-dark hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary'
                                                    }`}
                                                    onClick={() => setPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    })}
                                    <li>
                                        <button
                                            type="button"
                                            className="flex justify-center items-center w-10 h-10 rounded-full transition bg-white-light text-dark hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
                                            disabled={page === data.last_page}
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-10">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <p className="text-gray-500">No expenses found</p>
                        <button onClick={openCreateModal} className="btn btn-primary mt-4">
                            Add Your First Expense
                        </button>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" open={isModalOpen} onClose={closeModal} className="relative z-50">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
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
                                <Dialog.Panel className="panel w-full max-w-lg overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <h5 className="text-lg font-bold">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h5>
                                        <button onClick={closeModal} className="text-white-dark hover:text-dark">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                        <div>
                                            <label htmlFor="category">
                                                Category <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                id="category"
                                                className="form-select"
                                                value={formData.expense_category_id}
                                                onChange={(e) => setFormData({ ...formData, expense_category_id: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories
                                                    ?.filter((c) => c.is_active)
                                                    .map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="description">
                                                Description <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                id="description"
                                                type="text"
                                                className="form-input"
                                                placeholder="Enter description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="amount">
                                                    Amount <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    id="amount"
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    className="form-input"
                                                    placeholder="0.00"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="expense_date">
                                                    Date <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    id="expense_date"
                                                    type="date"
                                                    className="form-input"
                                                    value={formData.expense_date}
                                                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="notes">Notes</label>
                                            <textarea
                                                id="notes"
                                                className="form-textarea"
                                                rows={3}
                                                placeholder="Additional notes..."
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-4 pt-4">
                                            <button type="button" onClick={closeModal} className="btn btn-outline-danger">
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary" disabled={isCreating || isUpdating}>
                                                {isCreating || isUpdating ? (
                                                    <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block"></span>
                                                ) : editingExpense ? (
                                                    'Update Expense'
                                                ) : (
                                                    'Add Expense'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default ExpensesIndex;
