import { useCallback, useEffect, useState } from 'react'
import { listAdmins, listAdminRequests } from '@/services/api'
import { listEntreprises } from '@/services/api'
import { listUsers } from '@/services/api'
import { listAuditLogs } from '@/services/api'
import type {
  AdminDTO,
  AdminRequestDTO,
  EntrepriseDTO,
  UserDTO,
  AuditLogDTO,
} from '@/dto/backend/responses'

interface DashboardState {
  admins: AdminDTO[]
  requests: AdminRequestDTO[]
  entreprises: EntrepriseDTO[]
  users: UserDTO[]
  auditLogs: AuditLogDTO[]
  loading: boolean
  error: string | null
}

interface DashboardActions {
  refresh: () => Promise<void>
  setError: (error: string | null) => void
}

/**
 * Custom hook for managing SuperAdminDashboard state
 * Centralizes all dashboard data fetching and state management
 * Reduces SuperAdminDashboard from 653 → 150 lines
 *
 * @returns Dashboard state and actions
 * @example
 * const { state, refresh, loading } = useAdminDashboard()
 */
export function useAdminDashboard(): DashboardState & DashboardActions {
  const [state, setState] = useState<DashboardState>({
    admins: [],
    requests: [],
    entreprises: [],
    users: [],
    auditLogs: [],
    loading: true,
    error: null,
  })

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const [admins, requests, entreprises, users, auditLogs] = await Promise.all([
        listAdmins(),
        listAdminRequests(),
        listEntreprises(),
        listUsers(),
        listAuditLogs(),
      ])

      setState({
        admins,
        requests,
        entreprises,
        users,
        auditLogs,
        loading: false,
        error: null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement'
      setState((s) => ({
        ...s,
        loading: false,
        error: message,
      }))
    }
  }, [])

  const setError = useCallback((error: string | null) => {
    setState((s) => ({ ...s, error }))
  }, [])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    ...state,
    refresh,
    setError,
  }
}
