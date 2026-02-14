import { RentalDTO } from '../responses/ClientDTO'

export interface ClientCreateDTO {
  id?: string
  adminId?: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  cni?: string
  status?: string
  createdAt?: string
  rentals?: RentalDTO[]
}
