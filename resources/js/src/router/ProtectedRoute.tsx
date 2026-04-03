import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectAuthLoading, selectUserPermissions, hasAnyPermission } from '../store/slices/authSlice';
import { useGetMeQuery } from '../store/api/authApi';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    permissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permissions }) => {
    const location = useLocation();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isLoading = useSelector(selectAuthLoading);
    const userPermissions = useSelector(selectUserPermissions);

    // Fetch user data if we have a token but no user data
    const token = localStorage.getItem('auth_token');
    const { isLoading: isFetching } = useGetMeQuery(undefined, {
        skip: !token || !isAuthenticated,
    });

    // Show loading state
    if (isLoading || isFetching) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check permissions if required
    if (permissions && permissions.length > 0) {
        if (!hasAnyPermission(userPermissions, permissions)) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <h1 className="text-2xl font-bold text-danger mb-4">Access Denied</h1>
                    <p className="text-gray-500">You do not have permission to access this page.</p>
                </div>
            );
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
