import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactElement;
}

export default function PrivateAdminRoute({ children }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const role = String(user.role || '').toUpperCase();
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') return <Navigate to="/dashboard" replace />;

  return children;
}
