export type IngestionStatus = 'SUCCESS' | 'FAILED'

export type IngestionLog = {
  id: string
  dataSourceId: string
  status: IngestionStatus
  message?: string | null
  rawPayload?: Record<string, unknown> | null
  createdAt: string
}

export type IngestionLogResponse = {
  data: IngestionLog[]
  page: number
  pageSize: number
}
