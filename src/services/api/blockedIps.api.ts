import { apiFetch } from '@/services/http'
import type { BlockedIpDTO } from '@/dto/frontend/responses'

export async function listBlockedIps(): Promise<BlockedIpDTO[]> {
  return apiFetch<BlockedIpDTO[]>('/blocked_ips?_sort=createdAt&_order=desc')
}

export async function unblockIp(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/blocked_ips/${id}`, { method: 'DELETE' })
}
