import type { AuditLogDTO } from '@/dto/frontend/responses'
import { handleResponse, apiFetch } from '../http'
import { ensureRuntimeConfigLoaded, getApiBaseUrl } from '../runtimeConfig'

export type AuditLogCreate = Omit<AuditLogDTO, 'id'> & { id?: string } & Record<string, unknown>
export type AuditAutoExportStatus = {
  enabled: boolean
  format: 'csv' | 'json'
  intervalHours: number
  cronSecretConfigured: boolean
  endpointPath: string
  headerName: string
  due: boolean
  nextDueAt: string | null
  lastExport: {
    generatedAt: string
    count: number
    adminAuditCount: number
    securityAuditCount: number
    format: 'csv' | 'json'
    fileName: string
    checksumSha256: string
    modeExecution: 'CRON_SECRET' | 'AUTH_SUPER_ADMIN'
  } | null
}

function isLikelyNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  const message = String((error as { message?: string })?.message || error || '').toLowerCase()
  return (
    message.includes('networkerror') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed')
  )
}

export async function listAuditLogs(options?: { limit?: number }): Promise<AuditLogDTO[]> {
  try {
    const params = new URLSearchParams({
      _sort: 'createdAt',
      _order: 'desc',
    })
    if (typeof options?.limit === 'number' && Number.isFinite(options.limit) && options.limit > 0) {
      params.set('_limit', String(Math.floor(options.limit)))
    }
    return await apiFetch<AuditLogDTO[]>(`/audit_logs?${params.toString()}`)
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

export async function applyAuditLogsRetention(): Promise<{
  ok: true
  deletedCount: number
  retentionDays: number
}> {
  return apiFetch('/audit_logs/retention', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function downloadAuditLogsExport(format: 'csv' | 'json'): Promise<{
  blob: Blob
  fileName: string
}> {
  await ensureRuntimeConfigLoaded()
  const apiBase = getApiBaseUrl()
  const reponse = await fetch(`${apiBase}/audit_logs/export?format=${encodeURIComponent(format)}`, {
    credentials: 'include',
  })

  if (!reponse.ok) {
    await handleResponse<never>(reponse)
    throw new Error("Impossible d'exporter les logs.")
  }

  const contentDisposition = reponse.headers.get('content-disposition') || ''
  const nomFichier =
    /filename="([^"]+)"/i.exec(contentDisposition)?.[1] ||
    /filename=([^;]+)/i.exec(contentDisposition)?.[1] ||
    `audit_logs.${format}`

  return {
    blob: await reponse.blob(),
    fileName: nomFichier.trim(),
  }
}

export async function fetchAuditAutoExportStatus(): Promise<AuditAutoExportStatus> {
  return apiFetch<AuditAutoExportStatus>('/audit_logs/auto-export/status')
}

export async function triggerAuditAutoExportNow(force = true): Promise<{
  ok: true
  enabled: boolean
  executed: boolean
  modeExecution: 'CRON_SECRET' | 'AUTH_SUPER_ADMIN'
  skippedReason?: string
  nextDueAt?: string | null
  lastExport?: AuditAutoExportStatus['lastExport']
  export?: AuditAutoExportStatus['lastExport']
}> {
  const params = new URLSearchParams()
  if (force) params.set('force', 'true')
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return apiFetch(`/audit_logs/auto-export${suffix}`)
}

export async function downloadLatestAuditAutoExport(): Promise<{
  blob: Blob
  fileName: string
}> {
  await ensureRuntimeConfigLoaded()
  const apiBase = getApiBaseUrl()
  const reponse = await fetch(`${apiBase}/audit_logs/auto-export/latest`, {
    credentials: 'include',
  })

  if (!reponse.ok) {
    await handleResponse<never>(reponse)
    throw new Error("Impossible de télécharger le dernier auto-export.")
  }

  const contentDisposition = reponse.headers.get('content-disposition') || ''
  const nomFichier =
    /filename="([^"]+)"/i.exec(contentDisposition)?.[1] ||
    /filename=([^;]+)/i.exec(contentDisposition)?.[1] ||
    'audit_logs_auto_export'

  return {
    blob: await reponse.blob(),
    fileName: nomFichier.trim(),
  }
}
