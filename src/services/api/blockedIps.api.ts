import { apiFetch } from '@/services/http'
import type { BlockedIpDTO } from '@/dto/frontend/responses'

export async function listBlockedIps(): Promise<BlockedIpDTO[]> {
  return apiFetch<BlockedIpDTO[]>('/blocked_ips?_sort=createdAt&_order=desc')
}

export async function blockIp(payload: { ip: string; reason?: string }): Promise<BlockedIpDTO> {
  return apiFetch<BlockedIpDTO>('/blocked_ips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function unblockIp(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/blocked_ips/${id}`, { method: 'DELETE' })
}
