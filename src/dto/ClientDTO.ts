export interface DocumentDTO {
  id: string
  name: string
  type: 'contract' | 'receipt' | 'other'
  url: string
  uploadedAt: string // ISO date
  signed: boolean
}

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
    payments: any[]
  }
  payments: any[]
  documents: DocumentDTO[]
}

export interface ClientDTO {
  id: string
  firstName: string
  lastName: string
  phone: string
  cni?: string
  status: string
  createdAt: string // ISO date
  rentals: RentalDTO[]
}
