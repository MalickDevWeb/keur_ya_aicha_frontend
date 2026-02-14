export type ArchiveClientStatus = 'archived' | 'blacklisted' | 'active'

export type ArchiveClient = {
  id: string
  firstName?: string
  lastName?: string
  phone?: string
  cni?: string
  status: ArchiveClientStatus
  rentals: Array<{ id: string }>
  createdAt: string
}

export type ArchiveFilterType = 'all' | 'archived' | 'blacklisted'
