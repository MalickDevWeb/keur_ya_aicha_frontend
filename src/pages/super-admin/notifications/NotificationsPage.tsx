import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/layouts/MainLayout'
import { ForbiddenMessage } from '../core/ForbiddenMessage'
import { NotificationsDashboard } from './NotificationsDashboard'
import { Navigate } from 'react-router-dom'

export default function NotificationsPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const needsSecondAuth = role === 'SUPER_ADMIN' && user?.superAdminSecondAuthRequired !== false

  if (!user) return <Navigate to="/login" replace />
  if (needsSecondAuth) return <Navigate to="/pmt/admin" replace />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <NotificationsDashboard />
    </MainLayout>
  )
}
