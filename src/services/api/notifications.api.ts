import { apiFetch } from '../http'

export type NotificationDTO = {
  id: string | number
  user_id: string
  type?: string
  message: string
  is_read?: boolean
  created_at?: string
}

export async function listNotifications(userId: string): Promise<NotificationDTO[]> {
  if (!userId) return []
  return apiFetch<NotificationDTO[]>(`/notifications?user_id=${userId}&_sort=created_at&_order=desc`)
}

export async function listAllNotifications(): Promise<NotificationDTO[]> {
  return apiFetch<NotificationDTO[]>(`/notifications?_sort=created_at&_order=desc`)
}

export async function markNotificationRead(id: string | number): Promise<NotificationDTO> {
  return apiFetch<NotificationDTO>(`/notifications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_read: true }),
  })
}
