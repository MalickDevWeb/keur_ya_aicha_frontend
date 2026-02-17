import { apiFetch } from '../http'

export type NotificationDTO = {
  id: string | number
  user_id: string
  type?: string
  message: string
  is_read?: boolean
  created_at?: string
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

export async function listNotifications(userId: string): Promise<NotificationDTO[]> {
  if (!userId) return []
  try {
    return await apiFetch<NotificationDTO[]>(`/notifications?user_id=${userId}&_sort=created_at&_order=desc`)
  } catch (error) {
    if (isLikelyNetworkError(error)) return []
    throw error
  }
}

export async function listAllNotifications(): Promise<NotificationDTO[]> {
  try {
    return await apiFetch<NotificationDTO[]>(`/notifications?_sort=created_at&_order=desc`)
  } catch (error) {
    if (isLikelyNetworkError(error)) return []
    throw error
  }
}

export async function markNotificationRead(id: string | number): Promise<NotificationDTO> {
  return apiFetch<NotificationDTO>(`/notifications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_read: true }),
  })
}
