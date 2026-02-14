import type { ClientDTO } from '@/dto/backend/responses'
import type { PaymentStatus } from '@/lib/types'

export type ViewMode = 'cards' | 'list'

export type ClientFilters = {
  search: string
  statusFilter: PaymentStatus | 'all'
  typeFilter: string
}

export type ClientRow = {
  client: ClientDTO
  status: PaymentStatus
  propertyTypes: string[]
}
