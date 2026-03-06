import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/layouts/MainLayout'
import Settings from '@/pages/admin/Settings'
import { ForbiddenMessage } from '../core/ForbiddenMessage'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { Navigate } from 'react-router-dom'

export default function SuperAdminSettingsPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const needsSecondAuth = role === 'SUPER_ADMIN' && user?.superAdminSecondAuthRequired !== false

  if (!user) return <Navigate to="/login" replace />
  if (needsSecondAuth) return <Navigate to="/pmt/admin" replace />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <main className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4 animate-fade-in sm:space-y-6 sm:px-4 sm:py-6 lg:px-6">
        <SectionWrapper>
          <SuperAdminHeader />
        </SectionWrapper>
        <Settings />
      </main>
    </MainLayout>
  )
}
