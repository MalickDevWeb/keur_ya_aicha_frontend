import { apiFetch } from '../http'

export type UndoActionDTO = {
  id: string
  resource: string
  resourceId?: string | null
  method: string
  actorId?: string | null
  createdAt: string
  expiresAt: string
  path?: string
}

export async function listUndoActions(limit = 10): Promise<UndoActionDTO[]> {
  return apiFetch<UndoActionDTO[]>(`/undo-actions?limit=${Math.max(1, limit)}`)
}

export async function rollbackUndoAction(id: string): Promise<{ ok: boolean; rolledBackId: string }> {
  return apiFetch<{ ok: boolean; rolledBackId: string }>(`/undo-actions/${id}/rollback`, {
    method: 'POST',
  })
}
