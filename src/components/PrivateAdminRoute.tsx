import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactElement;
}

export default function PrivateAdminRoute({ children }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.username !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}
