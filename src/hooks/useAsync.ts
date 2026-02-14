import { useCallback, useEffect, useState } from 'react'

interface UseAsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * Hook pour gérer les opérations asynchrones
 *
 * @template T - Type des données retournées
 * @param asyncFunction - Fonction asynchrone à exécuter
 * @param immediate - Exécuter immédiatement (défaut: true)
 * @returns État et fonction execute pour relancer
 *
 * @example
 * const { data, loading, error, execute } = useAsync(() => fetchUsers(), true)
 */
export function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null })
    try {
      const response = await asyncFunction()
      setState({ data: response, loading: false, error: null })
      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setState({ data: null, loading: false, error: err })
      throw err
    }
  }, [asyncFunction])

  // Exécuter immédiatement si demandé
  useEffect(() => {
    if (immediate) {
      execute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    ...state,
    execute,
  }
}
