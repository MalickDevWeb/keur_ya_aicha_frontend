import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { MainLayout } from '@/layouts/MainLayout'
import { SuperAdminDashboard } from './SuperAdminDashboard'
import { SuperAdminLogin } from './SuperAdminLogin'
import { ForbiddenMessage } from './ForbiddenMessage'
import { Navigate } from 'react-router-dom'
import { SECTION_IDS } from './constants'
import { buildSuperAdminSectionHash, extractSuperAdminSectionHash } from './hash-routing'

export default function SuperAdminPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const needsSecondAuth = role === 'SUPER_ADMIN' && sessionStorage.getItem('superadminSecondAuth') !== 'true'

  useEffect(() => {
    if (role !== 'SUPER_ADMIN') return
    if (extractSuperAdminSectionHash(window.location.hash)) return
    const nextHash = buildSuperAdminSectionHash(window.location.hash, SECTION_IDS.pendingRequests)
    if (nextHash && nextHash !== window.location.hash) {
      window.location.hash = nextHash
    }
  }, [role])

  if (!user) return <Navigate to="/login" replace />
  if (needsSecondAuth) return <SuperAdminLogin requireSecondAuth />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <SuperAdminDashboard />
    </MainLayout>
  )
}
