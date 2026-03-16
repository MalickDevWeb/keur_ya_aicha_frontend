import { apiFetch } from '@/services/http'

export type Signature = {
  id: string
  adminId?: string | null
  type: 'ADMIN' | 'SUPER_ADMIN'
  imageUrl: string
  hash?: string | null
  createdAt?: string
  updatedAt?: string
}

export async function getSignature(): Promise<Signature | null> {
  const res = await apiFetch<Signature | Record<string, never>>('/signatures')
  return (res as Signature)?.id ? (res as Signature) : null
}

export async function saveSignature(dataUrl: string): Promise<Signature> {
  return apiFetch<Signature>('/signatures', {
    method: 'POST',
    body: JSON.stringify({ dataUrl }),
  })
}

export async function deleteSignature(): Promise<void> {
  // Delete = send empty dataUrl; backend delete not implemented, so just overwrite with blank?
  // For now, we overwrite with a 1x1 transparent pixel
  const transparent =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6X2YbUAAAAASUVORK5CYII='
  await saveSignature(transparent)
}
