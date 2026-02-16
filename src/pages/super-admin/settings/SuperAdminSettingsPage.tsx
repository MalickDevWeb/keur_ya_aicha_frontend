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
  const needsSecondAuth = role === 'SUPER_ADMIN' && sessionStorage.getItem('superadminSecondAuth') !== 'true'

  if (!user) return <Navigate to="/login" replace />
  if (needsSecondAuth) return <Navigate to="/pmt/admin" replace />
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
