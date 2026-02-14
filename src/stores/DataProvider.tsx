import { useEffect } from 'react'
import { useDataStore } from '@/stores/dataStore'

interface DataProviderProps {
  children: React.ReactNode
}

/**
 * DataProvider - Initializes Zustand store on app startup
 * Fetches initial clients and stats
 * Backward compatible with Context API usage
 */
export function DataProvider({ children }: DataProviderProps) {
  const fetchClients = useDataStore((state) => state.fetchClients)
  const fetchStats = useDataStore((state) => state.fetchStats)

  // Initialize store on mount
  useEffect(() => {
    const initializeStore = async () => {
      try {
        await Promise.all([fetchClients(), fetchStats()])
      } catch {
        // Silently handle initialization errors
        // Error state is available in the store
      }
    }

    initializeStore()
  }, [fetchClients, fetchStats])

  return <>{children}</>
}
