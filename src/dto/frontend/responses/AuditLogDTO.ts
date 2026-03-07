export interface AuditLogDTO {
  id: string
  actor?: string
  action?: string
  targetType?: string
  targetId?: string
  message?: string
  ipAddress?: string
  source?: string
  category?: string
  severity?: string
  meta?: Record<string, unknown>
  createdAt?: string
}
