import api from './http'
import type { IngestionLogResponse, IngestionStatus } from '../types/ingestion'

export async function listIngestionLogs(params: {
  dataSourceId?: string
  status?: IngestionStatus
  page?: number
  pageSize?: number
} = {}): Promise<IngestionLogResponse> {
  const { data } = await api.get('/api/v1/ingestion-logs', { params })
  return data as IngestionLogResponse
}
