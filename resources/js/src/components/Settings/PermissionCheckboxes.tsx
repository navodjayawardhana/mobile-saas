import { useGetPermissionsQuery } from '../../store/api/settingsApi';

interface PermissionCheckboxesProps {
    selectedPermissions: string[];
    onChange: (permissions: string[]) => void;
    disabled?: boolean;
}

const PermissionCheckboxes: React.FC<PermissionCheckboxesProps> = ({
    selectedPermissions,
    onChange,
    disabled = false,
}) => {
    const { data, isLoading } = useGetPermissionsQuery();

    const handleTogglePermission = (permissionId: string) => {
        if (disabled) return;

        if (selectedPermissions.includes(permissionId)) {
            onChange(selectedPermissions.filter((id) => id !== permissionId));
        } else {
            onChange([...selectedPermissions, permissionId]);
        }
    };

    const handleToggleGroup = (groupPermissions: { id: string }[]) => {
        if (disabled) return;

        const groupIds = groupPermissions.map((p) => p.id);
        const allSelected = groupIds.every((id) => selectedPermissions.includes(id));

        if (allSelected) {
            onChange(selectedPermissions.filter((id) => !groupIds.includes(id)));
        } else {
            const newPermissions = [...selectedPermissions];
            groupIds.forEach((id) => {
                if (!newPermissions.includes(id)) {
                    newPermissions.push(id);
                }
            });
            onChange(newPermissions);
        }
    };

    const handleSelectAll = () => {
        if (disabled || !data?.permissions) return;

        const allIds = data.permissions.map((p) => p.id);
        const allSelected = allIds.every((id) => selectedPermissions.includes(id));

        if (allSelected) {
            onChange([]);
        } else {
            onChange(allIds);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const allSelected = data?.permissions?.every((p) => selectedPermissions.includes(p.id));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">Permissions</span>
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        disabled={disabled}
                    />
                    <span className="ml-2 text-sm">Select All</span>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.permission_groups.map((group) => {
                    const groupPermissions = group.permissions;
                    const groupAllSelected = groupPermissions.every((p) =>
                        selectedPermissions.includes(p.id)
                    );
                    const groupSomeSelected = groupPermissions.some((p) =>
                        selectedPermissions.includes(p.id)
                    );

                    return (
                        <div key={group.group} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                                <span className="font-semibold text-sm text-primary">{group.group}</span>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox"
                                        checked={groupAllSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = groupSomeSelected && !groupAllSelected;
                                        }}
                                        onChange={() => handleToggleGroup(groupPermissions)}
                                        disabled={disabled}
                                    />
                                    <span className="ml-1 text-xs">All</span>
                                </label>
                            </div>
                            <div className="space-y-2">
                                {groupPermissions.map((permission) => (
                                    <label key={permission.id} className="flex items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox mt-0.5"
                                            checked={selectedPermissions.includes(permission.id)}
                                            onChange={() => handleTogglePermission(permission.id)}
                                            disabled={disabled}
                                        />
                                        <div className="ml-2">
                                            <span className="text-sm block">{permission.name}</span>
                                            {permission.description && (
                                                <span className="text-xs text-gray-500">{permission.description}</span>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PermissionCheckboxes;
