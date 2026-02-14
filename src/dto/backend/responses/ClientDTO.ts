import { DocumentDTO } from './DocumentDTO'
import { MonthlyPaymentDTO, PaymentRecordDTO } from './PaymentDTO'

export interface RentalDTO {
  id: string
  clientId: string
  propertyType: string
  propertyName: string
  monthlyRent: number
  startDate: string // ISO date
  deposit: {
    total: number
    paid: number
    payments: PaymentRecordDTO[]
  }
  payments: MonthlyPaymentDTO[]
  documents: DocumentDTO[]
}

export interface ClientDTO {
  id: string
  adminId?: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  cni?: string
  status: string
  createdAt: string // ISO date
  rentals: RentalDTO[]
}
