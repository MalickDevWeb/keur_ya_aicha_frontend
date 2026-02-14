import { describe, expect, it } from 'vitest'
import { detectWorkItems, toggleWorkStatus } from '../utils'
import type { Client } from '@/lib/types'

const clients = [
  { id: 'c1', firstName: '', lastName: 'Diop', rentals: [] },
  { id: 'c2', firstName: 'Awa', lastName: 'Diop', rentals: [{ id: 'r1', documents: [] }] },
]

describe('work utils', () => {
  it('detectWorkItems generates tasks', () => {
    const tasks = detectWorkItems(clients as unknown as Client[])
    expect(tasks.length).toBeGreaterThan(0)
  })

  it('toggleWorkStatus toggles completed to pending', () => {
    expect(toggleWorkStatus('completed')).toBe('pending')
  })
})
