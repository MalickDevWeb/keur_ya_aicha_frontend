import { describe, expect, it } from 'vitest'
import { filterByStatus, getArchiveClients, matchesClientSearch } from '../utils'
import type { ArchiveClient } from '../types'

const clients: ArchiveClient[] = [
  {
    id: 'c1',
    firstName: 'Awa',
    lastName: 'Diop',
    phone: '77 123 45 67',
    cni: 'A123',
    status: 'archived',
    rentals: [{ id: 'r1' }],
    createdAt: '2024-01-02',
  },
  {
    id: 'c2',
    firstName: 'Moussa',
    lastName: 'Ba',
    phone: '76 777 00 11',
    cni: 'B456',
    status: 'blacklisted',
    rentals: [{ id: 'r2' }],
    createdAt: '2024-01-03',
  },
  {
    id: 'c3',
    firstName: 'Fatou',
    lastName: 'Ndiaye',
    phone: '70 000 00 00',
    cni: 'C789',
    status: 'active',
    rentals: [{ id: 'r3' }],
    createdAt: '2024-01-04',
  },
]

describe('archive utils', () => {
  it('getArchiveClients keeps archived and blacklisted', () => {
    const archived = getArchiveClients(clients)
    expect(archived).toHaveLength(2)
  })

  it('filterByStatus filters by archived', () => {
    const filtered = filterByStatus(clients, 'archived')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('c1')
  })

  it('matchesClientSearch matches by phone digits', () => {
    const match = matchesClientSearch(clients[0], '771234')
    expect(match).toBe(true)
  })
})
