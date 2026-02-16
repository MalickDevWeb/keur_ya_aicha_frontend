import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { MainLayout } from '@/layouts/MainLayout'
import { SuperAdminDashboard } from './SuperAdminDashboard'
import { SuperAdminLogin } from './SuperAdminLogin'
import { ForbiddenMessage } from './ForbiddenMessage'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { SECTION_IDS } from './constants'
import {
  buildSuperAdminSectionSearch,
  extractSuperAdminSectionHash,
  extractSuperAdminSectionSearch,
} from './hash-routing'

export default function SuperAdminPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const role = String(user?.role || '').toUpperCase()
  const needsSecondAuth = role === 'SUPER_ADMIN' && user?.superAdminSecondAuthRequired !== false

  useEffect(() => {
    if (role !== 'SUPER_ADMIN') return
    const sectionInSearch = extractSuperAdminSectionSearch(location.search)
    const legacySection = extractSuperAdminSectionHash(location.hash)
    const section = sectionInSearch || legacySection || SECTION_IDS.pendingRequests
    const nextSearch = buildSuperAdminSectionSearch(location.search, section)

    if (nextSearch !== location.search || (legacySection && !sectionInSearch) || location.hash) {
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch,
          hash: '',
        },
        { replace: true }
      )
    }
  }, [location.hash, location.pathname, location.search, navigate, role])

  if (!user) return <Navigate to="/login" replace />
  if (needsSecondAuth) return <SuperAdminLogin requireSecondAuth />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <SuperAdminDashboard />
    </MainLayout>
  )
}
