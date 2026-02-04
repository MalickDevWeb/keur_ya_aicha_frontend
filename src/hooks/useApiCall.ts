import { useState, useCallback } from 'react'
import { useToast } from '@/contexts/ToastContext'

interface UseApiCallOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  retries?: number
  retryDelay?: number
}

export function useApiCall() {
  const [isLoading, setIsLoading] = useState(false)
  const { addToast } = useToast()

  const call = useCallback(
    async <T>(
      apiFunction: () => Promise<T>,
      options: UseApiCallOptions = {}
    ): Promise<T | null> => {
      const { onSuccess, onError, retries = 2, retryDelay = 1000 } = options
      setIsLoading(true)

      let lastError: Error | null = null

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const result = await apiFunction()
          setIsLoading(false)
          onSuccess?.()
          return result
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))

          // Don't retry on 401 (unauthorized) or 403 (forbidden)
          if (error instanceof Error && error.message.includes('401')) {
            setIsLoading(false)
            addToast({
              type: 'error',
              title: 'Session expirée',
              message: 'Veuillez vous reconnecter',
            })
            onError?.(lastError)
            return null
          }

          // If last attempt or no retries, fail
          if (attempt === retries) {
            setIsLoading(false)
            const errorMsg = lastError?.message || 'Une erreur est survenue'
            addToast({
              type: 'error',
              title: 'Erreur',
              message: errorMsg,
            })
            onError?.(lastError)
            return null
          }

          // Wait before retrying
          if (attempt < retries) {
            console.log(`🔄 Retry attempt ${attempt + 1}/${retries} after ${retryDelay}ms`)
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
          }
        }
      }

      setIsLoading(false)
      return null
    },
    [addToast]
  )

  return { call, isLoading }
}
