import { AdminFeaturePermissions, AdminStatus } from '../responses/AdminDTO'

export interface AdminCreateDTO {
  id: string
  userId: string
  adminRequestId?: string
  username: string
  name: string
  email: string
  phone?: string
  password?: string
  entreprise?: string
  status: AdminStatus
  entrepriseId?: string
  createdAt?: string
  subscriptionMode?: 'monthly' | 'premium' | 'annual'
  subscriptionMonthlyAmount?: number
  subscriptionAnnualAmount?: number
  subscriptionAllowCustomAmount?: boolean
  permissions?: Partial<AdminFeaturePermissions>
}
