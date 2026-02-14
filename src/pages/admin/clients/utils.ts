import type { ClientDTO } from '@/dto/backend/responses'
import type { ClientFilters, ClientRow } from './types'
import { calculateClientPaymentStatus } from '@/lib/types'

export const getPropertyTypes = (client: ClientDTO) => {
  return client.rentals
    .map((rental) => rental.propertyType)
    .filter((value, index, array) => array.indexOf(value) === index)
}

export const buildClientRows = (clients: ClientDTO[]): ClientRow[] => {
  return clients.map((client) => ({
    client,
    status: calculateClientPaymentStatus(client),
    propertyTypes: getPropertyTypes(client),
  }))
}

export const filterClientRows = (rows: ClientRow[], filters: ClientFilters) => {
  const needle = filters.search.trim().toLowerCase()

  return rows.filter(({ client, status, propertyTypes }) => {
    if (client.status !== 'active') return false

    const matchesSearch =
      !needle ||
      client.firstName.toLowerCase().includes(needle) ||
      client.lastName.toLowerCase().includes(needle) ||
      client.phone.includes(filters.search) ||
      client.cni.includes(filters.search)

    const matchesStatus = filters.statusFilter === 'all' || status === filters.statusFilter

    const matchesType =
      filters.typeFilter === 'all' || propertyTypes.some((type) => type === filters.typeFilter)

    return matchesSearch && matchesStatus && matchesType
  })
}
