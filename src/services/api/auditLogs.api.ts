import type { AuditLogDTO } from '@/dto/frontend/responses'
import { apiFetch } from '../http'

/**
 * Récupère les 10 derniers logs d'audit (triés par date décroissante)
 * @returns Array des logs d'audit
 */
export async function listAuditLogs(): Promise<AuditLogDTO[]> {
  return apiFetch<AuditLogDTO[]>('/audit_logs?_sort=createdAt&_order=desc')
}
