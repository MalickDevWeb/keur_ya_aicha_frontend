import { AdminStatus } from '../responses/AdminDTO'

export interface AdminCreateDTO {
  id: string
  userId: string
  adminRequestId?: string
  username: string
  name: string
  email: string
  status: AdminStatus
  entrepriseId?: string
  createdAt?: string
}
