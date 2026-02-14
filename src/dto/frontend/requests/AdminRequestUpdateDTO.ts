import { AdminStatus } from '../responses/AdminDTO'

export interface AdminRequestUpdateDTO {
  username?: string
  password?: string
  email?: string
  phone?: string
  entrepriseName?: string
  status?: AdminStatus
  paid?: boolean
  paidAt?: string
}
