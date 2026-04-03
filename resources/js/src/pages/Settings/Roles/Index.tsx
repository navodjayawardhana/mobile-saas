import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetRolesQuery, useDeleteRoleMutation } from '../../../store/api/settingsApi';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';

const RolesIndex = () => {
    const { data, isLoading } = useGetRolesQuery();
    const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteRole(deletingId).unwrap();
            setIsDeleteOpen(false);
            setDeletingId(null);
        } catch (err: any) {
            setError(err?.data?.message || 'Cannot delete role');
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">Roles</h5>
                <Link to="/settings/roles/create" className="btn btn-primary">
                    <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Create Role
                </Link>
            </div>

            {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

            <div className="table-responsive">
                <table className="table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Users</th>
                            <th>Type</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.roles.map((role) => (
                            <tr key={role.id}>
                                <td className="font-semibold">{role.name}</td>
                                <td>{role.description || '-'}</td>
                                <td>{role.users_count}</td>
                                <td>
                                    {role.is_system ? (
                                        <span className="badge bg-info">System</span>
                                    ) : (
                                        <span className="badge bg-secondary">Custom</span>
                                    )}
                                </td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Link
                                            to={`/settings/roles/${role.id}/edit`}
                                            className="btn btn-sm btn-outline-primary"
                                        >
                                            Edit
                                        </Link>
                                        {!role.is_system && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => {
                                                    setDeletingId(role.id);
                                                    setIsDeleteOpen(true);
                                                    setError('');
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

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Role"
                message="Are you sure you want to delete this role? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default RolesIndex;
