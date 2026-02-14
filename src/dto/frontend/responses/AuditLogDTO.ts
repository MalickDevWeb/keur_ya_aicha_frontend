export interface AuditLogDTO {
  id: string
  actor?: string
  action?: string
  targetType?: string
  targetId?: string
  message?: string
  ipAddress?: string
  createdAt?: string
}
