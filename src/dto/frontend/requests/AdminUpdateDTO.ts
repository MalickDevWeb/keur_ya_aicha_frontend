import { AdminFeaturePermissions, AdminStatus } from '../responses/AdminDTO'

export interface AdminUpdateDTO {
  status?: AdminStatus
  username?: string
  name?: string
  email?: string
  entrepriseId?: string
  subscriptionMode?: 'monthly' | 'premium' | 'annual'
  subscriptionMonthlyAmount?: number
  subscriptionAnnualAmount?: number
  subscriptionAllowCustomAmount?: boolean
  notifyClientsOverdue?: boolean
  notifyAdminOverdue?: boolean
  permissions?: Partial<AdminFeaturePermissions>
}
