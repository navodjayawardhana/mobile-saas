import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetUsersQuery, useDeleteUserMutation, useToggleUserStatusMutation, useGetRolesQuery } from '../../../store/api/settingsApi';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';

const UsersIndex = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const { data, isLoading } = useGetUsersQuery({ page, search, role_id: roleFilter || undefined });
    const { data: rolesData } = useGetRolesQuery();
    const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
    const [toggleStatus] = useToggleUserStatusMutation();

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteUser(deletingId).unwrap();
            setIsDeleteOpen(false);
            setDeletingId(null);
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot delete user');
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await toggleStatus(id).unwrap();
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot change user status');
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="panel">
            <div className="flex flex-col md:flex-row items-center justify-between mb-5 gap-4">
                <h5 className="text-lg font-semibold dark:text-white-light">Users</h5>
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
                    <select
                        className="form-select w-auto"
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All Roles</option>
                        {rolesData?.roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                    <Link to="/settings/users/create" className="btn btn-primary">
                        <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add User
                    </Link>
                </div>
            </div>

            {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.users.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div className="flex items-center">
                                        {user.avatar ? (
                                            <img src={`/storage/${user.avatar}`} alt="" className="w-8 h-8 rounded-full object-cover mr-2" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-2 text-sm">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="font-semibold">{user.name}</span>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>{user.phone || '-'}</td>
                                <td>{user.role?.name || '-'}</td>
                                <td>
                                    <label className="relative h-6 w-12">
                                        <input
                                            type="checkbox"
                                            className="custom_switch peer absolute z-10 h-full w-full cursor-pointer opacity-0"
                                            checked={user.is_active}
                                            onChange={() => handleToggleStatus(user.id)}
                                        />
                                        <span className="block h-full rounded-full bg-[#ebedf2] before:absolute before:bottom-1 before:left-1 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-all before:duration-300 peer-checked:bg-primary peer-checked:before:left-7 dark:bg-dark dark:before:bg-white-dark dark:peer-checked:before:bg-white"></span>
                                    </label>
                                </td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Link
                                            to={`/settings/users/${user.id}/edit`}
                                            className="btn btn-sm btn-outline-primary"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => {
                                                setDeletingId(user.id);
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

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default UsersIndex;
