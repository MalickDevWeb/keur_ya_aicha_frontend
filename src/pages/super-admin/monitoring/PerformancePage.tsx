import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/layouts/MainLayout'
import { ForbiddenMessage } from '../core/ForbiddenMessage'
import { PerformanceDashboard } from './PerformanceDashboard'
import { Navigate } from 'react-router-dom'

export default function PerformancePage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const needsSecondAuth = role === 'SUPER_ADMIN' && sessionStorage.getItem('superadminSecondAuth') !== 'true'

  if (!user) return <Navigate to="/login" replace />
  if (needsSecondAuth) return <Navigate to="/pmt/admin" replace />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <PerformanceDashboard />
    </MainLayout>
  )
}
