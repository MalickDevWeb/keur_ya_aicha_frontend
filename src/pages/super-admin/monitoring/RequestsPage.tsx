import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/layouts/MainLayout'
import { SuperAdminLogin } from '../core/SuperAdminLogin'
import { ForbiddenMessage } from '../core/ForbiddenMessage'
import { RequestsDashboard } from './RequestsDashboard'

export default function RequestsPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  if (!user) return <SuperAdminLogin />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <RequestsDashboard />
    </MainLayout>
  )
}
