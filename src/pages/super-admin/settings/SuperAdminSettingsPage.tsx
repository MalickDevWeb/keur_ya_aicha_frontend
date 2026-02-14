import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/layouts/MainLayout'
import Settings from '@/pages/admin/Settings'
import { SuperAdminLogin } from '../core/SuperAdminLogin'
import { ForbiddenMessage } from '../core/ForbiddenMessage'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { SectionWrapper } from '@/pages/common/SectionWrapper'

export default function SuperAdminSettingsPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  if (!user) return <SuperAdminLogin />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <main className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6 animate-fade-in">
        <SectionWrapper>
          <SuperAdminHeader />
        </SectionWrapper>
        <Settings />
      </main>
    </MainLayout>
  )
}
