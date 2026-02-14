import { describe, expect, it } from 'vitest'
import { buildPriorityClients } from '../utils'
import type { Client } from '@/lib/types'

const clients = [
  {
    id: 'c1',
    status: 'active',
    firstName: 'Awa',
    lastName: 'Diop',
    phone: '77',
    rentals: [
      {
        id: 'r1',
        propertyName: 'Villa',
        payments: [
          { id: 'p1', amount: 100, paidAmount: 0, status: 'unpaid', dueDate: new Date().toISOString() },
        ],
      },
    ],
  },
] as unknown as Client[]

describe('dashboard utils', () => {
  it('buildPriorityClients returns unpaid payments', () => {
    const result = buildPriorityClients(clients)
    expect(result).toHaveLength(1)
    expect(result[0].client.id).toBe('c1')
  })
})
