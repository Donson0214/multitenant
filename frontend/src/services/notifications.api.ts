import api from './http'
import type { Notification, NotificationResponse } from '../types/notification'

export async function listNotifications(params: {
  page?: number
  pageSize?: number
} = {}): Promise<NotificationResponse> {
  const { data } = await api.get('/api/v1/notifications', { params })
  return data as NotificationResponse
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await api.post(`/api/v1/notifications/${id}/read`)
  return data as Notification
}
