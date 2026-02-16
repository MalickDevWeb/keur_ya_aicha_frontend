import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { MainLayout } from '@/layouts/MainLayout'
import { SuperAdminDashboard } from './SuperAdminDashboard'
import { SuperAdminLogin } from './SuperAdminLogin'
import { ForbiddenMessage } from './ForbiddenMessage'
import { Navigate } from 'react-router-dom'

export default function SuperAdminPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const needsSecondAuth = role === 'SUPER_ADMIN' && sessionStorage.getItem('superadminSecondAuth') !== 'true'

  useEffect(() => {
    if (role === 'SUPER_ADMIN' && !window.location.hash) {
      window.location.hash = '#demandes-en-attente'
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
