import api from '../lib/axios'
import type { Notification } from '../types'

export interface NotificationListResponse {
  notifications: Notification[]
  unreadCount: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface NotificationListParams {
  page?: number
  limit?: number
  unreadOnly?: boolean
}

// Backend returns snake_case Supabase columns - map to the frontend camelCase type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotification(raw: any): Notification {
  return {
    id: raw.id,
    userId: raw.user_id,
    type: raw.type,
    title: raw.title,
    body: raw.body,
    isRead: raw.is_read,
    data: raw.data,
    createdAt: raw.created_at,
  }
}

export const getNotifications = async (
  params: NotificationListParams = {},
): Promise<NotificationListResponse> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await api.get<any>('/notifications', { params })
  return {
    ...data,
    notifications: (data.notifications ?? []).map(mapNotification),
  }
}

export const getNotificationById = async (id: number): Promise<Notification> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await api.get<any>(`/notifications/${id}`)
  return mapNotification(data)
}

export const markAsRead = async (id: number): Promise<Notification> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await api.patch<any>(`/notifications/${id}/read`)
  return mapNotification(data)
}

export const markAllAsRead = async (): Promise<{ message: string }> => {
  const { data } = await api.patch<{ message: string }>('/notifications/read-all')
  return data
}

export const getUnreadCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count')
  return data
}

export const deleteNotification = async (id: number): Promise<void> => {
  await api.delete(`/notifications/${id}`)
}
