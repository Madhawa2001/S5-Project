import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
import { useAuth } from '../contexts/MockAuthContext';
import { UserRole } from '../types';
import { Loading } from './ui/Loading';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.approval_status !== 'approved') {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashboardRoutes = {
      admin: '/admin/dashboard',
      doctor: '/doctor/dashboard',
      lab_assistant: '/lab/dashboard',
    };
    return <Navigate to={dashboardRoutes[user.role]} replace />;
  }

  return <>{children}</>;
}
