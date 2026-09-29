import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import type { Role } from './roles';

interface ProtectedRouteProps {
  allowedRoles: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { session, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(session.role)) {
    // Redirect based on role
    if (session.role === 'citizen') return <Navigate to="/citizen" replace />;
    if (session.role === 'officer') return <Navigate to="/officer" replace />;
    if (session.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
