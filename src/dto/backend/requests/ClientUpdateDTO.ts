import { RentalDTO } from '../responses/ClientDTO'

export interface ClientUpdateDTO {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  cni?: string
  status?: string
  rentals?: RentalDTO[]
}
