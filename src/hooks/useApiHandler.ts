import { useToast } from '@/contexts/ToastContext'
import { useCallback } from 'react'

export function useApiHandler() {
  const { addToast } = useToast()

  const handleSuccess = useCallback(
    (message: string) => {
      addToast({
        type: 'success',
        title: 'Succès',
        message,
        duration: 2000,
      })
    },
    [addToast]
  )

  const handleError = useCallback(
    (error: unknown, defaultMessage: string = 'Une erreur est survenue') => {
      const message = error instanceof Error ? error.message : defaultMessage
      addToast({
        type: 'error',
        title: 'Erreur',
        message,
        duration: 4000,
      })
    },
    [addToast]
  )

  const handleInfo = useCallback(
    (message: string) => {
      addToast({
        type: 'info',
        title: 'Information',
        message,
        duration: 3000,
      })
    },
    [addToast]
  )

  return { handleSuccess, handleError, handleInfo }
}
