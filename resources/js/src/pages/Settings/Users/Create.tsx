import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateUserMutation, useGetRolesQuery } from '../../../store/api/settingsApi';

const UsersCreate = () => {
    const navigate = useNavigate();
    const [createUser, { isLoading }] = useCreateUserMutation();
    const { data: rolesData } = useGetRolesQuery();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        role_id: '',
        is_active: true,
    });
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!formData.name) errors.name = 'Name is required';
        if (!formData.email) errors.email = 'Email is required';
        if (!formData.password) errors.password = 'Password is required';
        if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.password_confirmation) errors.password_confirmation = 'Passwords do not match';
        if (!formData.role_id) errors.role_id = 'Role is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validate()) return;

        try {
            await createUser({
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                password: formData.password,
                role_id: formData.role_id,
                is_active: formData.is_active,
            }).unwrap();
            navigate('/settings/users');
        } catch (err: any) {
            setError(err?.data?.message || 'An error occurred');
            if (err?.data?.errors) {
                setFormErrors(err.data.errors);
            }
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">Add User</h5>
                <Link to="/settings/users" className="btn btn-outline-dark">
                    Back to Users
                </Link>
            </div>

            <div className="panel">
                {error && <div className="bg-danger-light text-danger p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name">Name *</label>
                            <input
                                id="name"
                                type="text"
                                className={`form-input ${formErrors.name ? 'border-danger' : ''}`}
                                placeholder="Enter name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            {formErrors.name && <span className="text-danger text-xs">{formErrors.name}</span>}
                        </div>
                        <div>
                            <label htmlFor="email">Email *</label>
                            <input
                                id="email"
                                type="email"
                                className={`form-input ${formErrors.email ? 'border-danger' : ''}`}
                                placeholder="Enter email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            {formErrors.email && <span className="text-danger text-xs">{formErrors.email}</span>}
                        </div>
                        <div>
                            <label htmlFor="phone">Phone</label>
                            <input
                                id="phone"
                                type="tel"
                                className="form-input"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="role_id">Role *</label>
                            <select
                                id="role_id"
                                className={`form-select ${formErrors.role_id ? 'border-danger' : ''}`}
                                value={formData.role_id}
                                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                            >
                                <option value="">Select Role</option>
                                {rolesData?.roles.map((role) => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                            {formErrors.role_id && <span className="text-danger text-xs">{formErrors.role_id}</span>}
                        </div>
                        <div>
                            <label htmlFor="password">Password *</label>
                            <input
                                id="password"
                                type="password"
                                className={`form-input ${formErrors.password ? 'border-danger' : ''}`}
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            {formErrors.password && <span className="text-danger text-xs">{formErrors.password}</span>}
                        </div>
                        <div>
                            <label htmlFor="password_confirmation">Confirm Password *</label>
                            <input
                                id="password_confirmation"
                                type="password"
                                className={`form-input ${formErrors.password_confirmation ? 'border-danger' : ''}`}
                                placeholder="Confirm password"
                                value={formData.password_confirmation}
                                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                            />
                            {formErrors.password_confirmation && <span className="text-danger text-xs">{formErrors.password_confirmation}</span>}
                        </div>
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

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Link to="/settings/users" className="btn btn-outline-dark">
                            Cancel
                        </Link>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>}
                            Create User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UsersCreate;
