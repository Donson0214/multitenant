export type Notification = {
  id: string
  title: string
  body: string
  type: 'IN_APP' | 'EMAIL' | 'WEBHOOK'
  readAt?: string | null
  createdAt: string
}

export type NotificationResponse = {
  data: Notification[]
  page: number
  pageSize: number
}
