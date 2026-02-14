import { AdminStatus } from '../responses/AdminDTO'

export interface AdminRequestCreateDTO {
  id: string
  name: string
  email?: string
  phone: string
  entrepriseName?: string
  username?: string
  password?: string
  status: AdminStatus
  createdAt?: string
}
