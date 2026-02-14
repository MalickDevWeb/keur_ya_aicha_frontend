import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/layouts/MainLayout'
import { SuperAdminStatsDashboard } from './SuperAdminStatsDashboard'
import { SuperAdminStatsLogin } from './SuperAdminStatsLogin'
import { ForbiddenMessage } from './ForbiddenMessage'

export default function SuperAdminStatsPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  if (!user) return <SuperAdminStatsLogin />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <SuperAdminStatsDashboard />
    </MainLayout>
  )
}
