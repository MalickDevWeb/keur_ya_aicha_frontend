import type { AdminFeaturePermissions } from './AdminDTO'

export interface AuthUser {
  id: string
  username: string
  name: string
  email: string
  role: string
  status?: string
  subscriptionBlocked?: boolean
  subscriptionOverdueMonth?: string | null
  subscriptionDueAt?: string | null
  subscriptionRequiredMonth?: string | null
  superAdminSecondAuthRequired?: boolean
  permissions?: AdminFeaturePermissions
}

export interface UserDTO extends AuthUser {
  phone?: string
}
