import type { Rental } from '@/lib/types'

export type ViewMode = 'cards' | 'list'

export type RentalFilters = {
  search: string
  propertyTypeFilter: string
  statusFilter: 'all' | 'active' | 'completed'
}

export type RentalRow = Rental & {
  clientName: string
  clientId: string
}
