import { format } from 'date-fns'
import type { ArchiveClient, ArchiveFilterType, ArchiveClientStatus } from './types'

export const normalizeSearch = (value: string) => value.trim().toLowerCase()

export const matchesClientSearch = (client: ArchiveClient, query: string) => {
  const needle = normalizeSearch(query)
  if (!needle) return true

  const phone = (client.phone || '').toLowerCase()
  const cni = (client.cni || '').toLowerCase()
  const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase()

  if (fullName.includes(needle)) return true
  if (phone.includes(needle)) return true
  if (cni.includes(needle)) return true

  const digits = needle.replace(/\D/g, '')
  if (!digits) return false
  const phoneDigits = phone.replace(/\D/g, '')
  const cniDigits = cni.replace(/\D/g, '')
  return phoneDigits.includes(digits) || cniDigits.includes(digits)
}

export const filterByStatus = (clients: ArchiveClient[], status: ArchiveFilterType) => {
  if (status === 'all') return clients
  return clients.filter((client) => client.status === status)
}

export const getArchiveClients = (clients: ArchiveClient[]) =>
  clients.filter((client) => client.status === 'archived' || client.status === 'blacklisted')

export const getStatusLabel = (status: ArchiveClientStatus) =>
  status === 'archived' ? 'Archivé' : status === 'blacklisted' ? 'Blacklist' : 'Actif'

export const formatArchiveDate = (date: string | Date) => format(new Date(date), 'dd/MM/yyyy')

export const getArchiveStats = (clients: ArchiveClient[]) => ({
  archived: clients.filter((client) => client.status === 'archived').length,
  blacklisted: clients.filter((client) => client.status === 'blacklisted').length,
})
