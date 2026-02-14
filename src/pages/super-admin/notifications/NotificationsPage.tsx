import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/layouts/MainLayout'
import { SuperAdminLogin } from '../core/SuperAdminLogin'
import { ForbiddenMessage } from '../core/ForbiddenMessage'
import { NotificationsDashboard } from './NotificationsDashboard'

export default function NotificationsPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  if (!user) return <SuperAdminLogin />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <NotificationsDashboard />
    </MainLayout>
  )
}
