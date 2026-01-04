import api from './http'
import type { AuditLogResponse } from '../types/auditLog'

export async function listAuditLogs(params: {
  action?: string
  page?: number
  pageSize?: number
} = {}): Promise<AuditLogResponse> {
  const { data } = await api.get('/api/v1/audit-logs', { params })
  return data as AuditLogResponse
}
