import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/layouts/MainLayout'
import { EntreprisesDashboard } from './EntreprisesDashboard'
import { EntreprisesLogin } from './EntreprisesLogin'
import { ForbiddenMessage } from './ForbiddenMessage'

export default function EntreprisesPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  if (!user) return <EntreprisesLogin />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <EntreprisesDashboard />
    </MainLayout>
  )
}
