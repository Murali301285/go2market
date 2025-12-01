import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { user, userProfile, loading } = useAuth();

    if (loading) {
        return null; // Or a loading spinner, but AuthProvider usually handles initial load
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
        // Redirect to their appropriate dashboard if they try to access unauthorized routes
        const dashboardPath = userProfile.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
        return <Navigate to={dashboardPath} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
