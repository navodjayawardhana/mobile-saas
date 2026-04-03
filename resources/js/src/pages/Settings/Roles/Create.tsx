import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateRoleMutation } from '../../../store/api/settingsApi';
import PermissionCheckboxes from '../../../components/Settings/PermissionCheckboxes';

const RolesCreate = () => {
    const navigate = useNavigate();
    const [createRole, { isLoading }] = useCreateRoleMutation();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await createRole({
                name: formData.name,
                description: formData.description,
                permissions: selectedPermissions,
            }).unwrap();
            navigate('/settings/roles');
        } catch (err: any) {
            setError(err?.data?.message || 'An error occurred');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">Create Role</h5>
                <Link to="/settings/roles" className="btn btn-outline-dark">
                    Back to Roles
                </Link>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="panel">
                    {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="name">Role Name *</label>
                            <input
                                id="name"
                                type="text"
                                className="form-input"
                                placeholder="Enter role name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="description">Description</label>
                            <input
                                id="description"
                                type="text"
                                className="form-input"
                                placeholder="Brief description of this role"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <PermissionCheckboxes
                        selectedPermissions={selectedPermissions}
                        onChange={setSelectedPermissions}
                    />

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Link to="/settings/roles" className="btn btn-outline-dark">
                            Cancel
                        </Link>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            Create Role
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default RolesCreate;
