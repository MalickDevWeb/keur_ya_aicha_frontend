import { AdminStatus } from '../responses/AdminDTO'

export interface AdminUpdateDTO {
  status?: AdminStatus
  username?: string
  name?: string
  email?: string
  entrepriseId?: string
}
