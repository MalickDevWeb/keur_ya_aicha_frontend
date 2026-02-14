import type { RentalRow, RentalFilters } from './types'
import type { ClientDTO } from '@/dto/backend/responses'
import { calculateDepositStatus } from '@/lib/types'

export const buildRentalRows = (clients: ClientDTO[]): RentalRow[] => {
  const rows: RentalRow[] = []

  clients.forEach((client) => {
    const clientName = `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim()
    if (!clientName) return

    client.rentals.forEach((rental) => {
      if (!rental.propertyName) return
      rows.push({
        ...rental,
        clientName,
        clientId: client.id,
      })
    })
  })

  return rows.filter((rental) => rental.clientName && rental.propertyName && rental.clientId)
}

export const filterRentalRows = (rows: RentalRow[], filters: RentalFilters) => {
  const needle = filters.search.trim().toLowerCase()

  return rows.filter((rental) => {
    const matchesSearch =
      !needle ||
      rental.clientName.toLowerCase().includes(needle) ||
      rental.propertyName.toLowerCase().includes(needle) ||
      rental.propertyType.toLowerCase().includes(needle)

    const matchesType =
      filters.propertyTypeFilter === 'all' || rental.propertyType === filters.propertyTypeFilter

    const depositStatus = calculateDepositStatus(rental.deposit)
    const matchesStatus =
      filters.statusFilter === 'all'
        ? true
        : filters.statusFilter === 'active'
          ? depositStatus !== 'paid' || rental.deposit.paid < rental.deposit.total
          : depositStatus === 'paid' && rental.deposit.paid >= rental.deposit.total

    return matchesSearch && matchesType && matchesStatus
  })
}

export const getPropertyTypeLabel = (type: string) => {
  switch (type) {
    case 'apartment':
      return 'Appartement'
    case 'studio':
      return 'Studio'
    case 'room':
      return 'Chambre'
    case 'villa':
      return 'Villa'
    case 'house':
      return 'Maison'
    case 'shop':
      return 'Commerce'
    case 'office':
      return 'Bureau'
    case 'other':
      return 'Autre'
    default:
      return type
  }
}

export const getPropertyTypeColor = (type: string) => {
  switch (type) {
    case 'apartment':
      return 'bg-blue-600'
    case 'studio':
      return 'bg-purple-600'
    case 'room':
      return 'bg-pink-600'
    case 'villa':
      return 'bg-emerald-600'
    case 'house':
      return 'bg-amber-600'
    case 'shop':
      return 'bg-orange-600'
    case 'office':
      return 'bg-cyan-600'
    case 'other':
      return 'bg-slate-600'
    default:
      return 'bg-blue-600'
  }
}
