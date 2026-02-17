import type { AuditLogDTO } from '@/dto/frontend/responses'
import { apiFetch } from '../http'

export type AuditLogCreate = Omit<AuditLogDTO, 'id'> & { id?: string } & Record<string, unknown>

function isLikelyNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  const message = String((error as { message?: string })?.message || error || '').toLowerCase()
  return (
    message.includes('networkerror') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed')
  )
}

/**
 * Récupère les 10 derniers logs d'audit (triés par date décroissante)
 * @returns Array des logs d'audit
 */
export async function listAuditLogs(): Promise<AuditLogDTO[]> {
  try {
    return await apiFetch<AuditLogDTO[]>('/audit_logs?_sort=createdAt&_order=desc')
  } catch (error) {
    if (isLikelyNetworkError(error)) return []
    throw error
  }
}

export async function createAuditLog(entry: AuditLogCreate): Promise<void> {
  const payload = {
    id: entry.id || `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: entry.createdAt || new Date().toISOString(),
    ...entry,
  }
  await apiFetch<void>('/audit_logs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteAuditLog(id: string | number): Promise<void> {
  await apiFetch<void>(`/audit_logs/${id}`, {
    method: 'DELETE',
  })
}

export async function deleteAuditLogs(ids: Array<string | number>): Promise<void> {
  if (ids.length === 0) return
  await Promise.all(ids.map((id) => deleteAuditLog(id)))
}
