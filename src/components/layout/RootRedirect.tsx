import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PageLoading from '../common/PageLoading';

const RootRedirect = () => {
    const { userProfile, loading } = useAuth();

    if (loading) {
        return <PageLoading />;
    }

    if (!userProfile) {
        return <Navigate to="/login" replace />;
    }

    // Redirect based on role
    if (userProfile.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
    } else {
        return <Navigate to="/user/dashboard" replace />;
    }
};

export default RootRedirect;
