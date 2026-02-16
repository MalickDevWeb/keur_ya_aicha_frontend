import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const hasNavigableHistory = () => {
  if (typeof window === 'undefined') return false
  const state = window.history.state as { idx?: number } | null
  if (typeof state?.idx === 'number') return state.idx > 0
  return window.history.length > 1
}

export function useGoBack(defaultFallback = '/dashboard') {
  const navigate = useNavigate()

  return useCallback(
    (fallback = defaultFallback) => {
      if (hasNavigableHistory()) {
        navigate(-1)
        return
      }
      navigate(fallback, { replace: true })
    },
    [defaultFallback, navigate]
  )
}
