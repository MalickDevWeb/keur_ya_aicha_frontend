import { useEffect } from 'react'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/contexts/AuthContext'

interface DataProviderProps {
  children: React.ReactNode
}

/**
 * DataProvider - Initializes Zustand store on app startup
 * Fetches initial clients and stats
 * Backward compatible with Context API usage
 */
export function DataProvider({ children }: DataProviderProps) {
  const { isAuthenticated, isLoading, user, impersonation } = useAuth()
  const fetchClients = useDataStore((state) => state.fetchClients)
  const fetchStats = useDataStore((state) => state.fetchStats)
  const resetData = useDataStore((state) => state.resetData)

  // Reload store when auth context changes (login/logout/impersonation)
  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user?.id) {
      resetData()
      return
    }

    const role = String(user.role || '').toUpperCase()
    const requiresSecondAuth = role === 'SUPER_ADMIN' && user.superAdminSecondAuthRequired !== false
    if (requiresSecondAuth) {
      resetData()
      return
    }

    const initializeStore = async () => {
      try {
        await Promise.all([fetchClients(), fetchStats()])
      } catch {
        // Silently handle initialization errors
        // Error state is available in the store
      }
    }

    void initializeStore()
  }, [
    fetchClients,
    fetchStats,
    resetData,
    isAuthenticated,
    isLoading,
    user?.id,
    user?.role,
    user?.superAdminSecondAuthRequired,
    impersonation?.adminId,
  ])

  return <>{children}</>
}
