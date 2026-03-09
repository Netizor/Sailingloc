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

export const getNotifications = async (
  params: NotificationListParams = {},
): Promise<NotificationListResponse> => {
  const { data } = await api.get<NotificationListResponse>('/notifications', { params })
  return data
}

export const getNotificationById = async (id: number): Promise<Notification> => {
  const { data } = await api.get<Notification>(`/notifications/${id}`)
  return data
}

export const markAsRead = async (id: number): Promise<Notification> => {
  const { data } = await api.patch<Notification>(`/notifications/${id}/read`)
  return data
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
