export type AuditLog = {
  id: string
  actorUserId: string
  action: string
  entityType: string
  entityId?: string | null
  meta?: Record<string, unknown> | null
  createdAt: string
}

export type AuditLogResponse = {
  data: AuditLog[]
  page: number
  pageSize: number
}
