import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../lib/api';

export const RequireProfileComplete: React.FC = () => {
  const location = useLocation();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => fetchWithAuth('/users/me'),
  });

  if (isLoading) return <div className="p-8 text-center">Loading Profile...</div>;

  const isRegisterRoute = location.pathname.startsWith('/citizen/register');
  const isSuccessRoute = location.pathname.startsWith('/citizen/success');

  if (profile && !profile.profile_complete && !isRegisterRoute && !isSuccessRoute) {
    return <Navigate to="/citizen/register" replace />;
  }

  return <Outlet />;
};
