import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { createAuditLog } from '@/services/api'

type LogMeta = Record<string, unknown>

export async function logUiAction(payload: {
  actor?: string
  action: string
  targetId?: string
  message?: string
  meta?: LogMeta
}) {
  await createAuditLog({
    actor: payload.actor,
    action: payload.action,
    targetType: 'ui',
    targetId: payload.targetId,
    message: payload.message,
    meta: payload.meta,
  })
}

export function useActionLogger(scope?: string) {
  const { user } = useAuth()
  const location = useLocation()

  return async (action: string, meta?: LogMeta) => {
    try {
      await logUiAction({
        actor: user?.id || 'client',
        action,
        targetId: scope || location.pathname,
        message: meta?.message ? String(meta.message) : undefined,
        meta: {
          role: user?.role,
          name: user?.name,
          ...meta,
        },
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[UI LOG] échec', error)
      }
    }
  }
}
