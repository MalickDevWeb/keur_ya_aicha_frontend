import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/layouts/MainLayout'
import { AdminsDashboard } from './AdminsDashboard'
import { AdminsLogin } from './AdminsLogin'
import { ForbiddenMessage } from './ForbiddenMessage'

export default function AdminsPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  if (!user) return <AdminsLogin />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <AdminsDashboard />
    </MainLayout>
  )
}
