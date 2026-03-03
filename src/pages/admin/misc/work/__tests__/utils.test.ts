import { describe, expect, it } from 'vitest'
import { detectWorkItems, mergeWorkItems, sortWorkItems, toggleWorkStatus } from '../utils'
import type { Client } from '@/lib/types'
import type { WorkItem } from '../types'

const now = new Date('2026-03-03T00:00:00.000Z')
const clients = [
  {
    id: 'c1',
    firstName: '',
    lastName: 'Diop',
    rentals: [],
  },
  {
    id: 'c2',
    firstName: 'Awa',
    lastName: 'Diop',
    rentals: [
      {
        id: 'r1',
        propertyName: 'Non renseigné',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        deposit: { total: 200000, paid: 0, payments: [] },
        payments: [
          {
            id: 'p1',
            dueDate: new Date('2025-12-01T00:00:00.000Z'),
            status: 'unpaid',
          },
        ],
        documents: [],
      },
    ],
  },
]

describe('work utils', () => {
  it('detectWorkItems generates urgent tasks from data and import errors', () => {
    const tasks = detectWorkItems(clients as unknown as Client[], {
      now,
      importRuns: [{ errors: [{}, {}], ignored: false }],
      subscriptionStatus: {
        blocked: true,
        overdueMonth: '2026-02',
        requiredMonth: '2026-02',
        dueAt: '2026-02-05T00:00:00.000Z',
        currentMonth: '2026-03',
        subscriptionMode: 'monthly',
      },
    })
    const taskIds = new Set(tasks.map((task) => task.id))

    expect(taskIds.has('invalid-clients')).toBe(true)
    expect(taskIds.has('clients-without-rentals')).toBe(true)
    expect(taskIds.has('overdue-payments')).toBe(true)
    expect(taskIds.has('critical-overdue-payments')).toBe(true)
    expect(taskIds.has('incomplete-rentals')).toBe(true)
    expect(taskIds.has('missing-contracts')).toBe(true)
    expect(taskIds.has('unpaid-deposits')).toBe(true)
    expect(taskIds.has('overdue-deposits')).toBe(true)
    expect(taskIds.has('import-errors-open')).toBe(true)
    expect(taskIds.has('admin-subscription-overdue')).toBe(true)
  })

  it('mergeWorkItems keeps manual tasks and refreshes auto-detected tasks', () => {
    const saved: WorkItem[] = [
      {
        id: 'manual-1',
        title: 'Appeler client',
        description: '',
        priority: 'low',
        status: 'pending',
        createdAt: now.toISOString(),
        autoDetected: false,
      },
      {
        id: 'old-auto-task',
        title: 'Ancien auto',
        description: '',
        priority: 'high',
        status: 'completed',
        createdAt: now.toISOString(),
        autoDetected: true,
      },
    ]
    const detected: WorkItem[] = [
      {
        id: 'overdue-payments',
        title: 'Retards',
        description: '',
        priority: 'high',
        status: 'pending',
        createdAt: now.toISOString(),
        autoDetected: true,
      },
    ]

    const merged = mergeWorkItems(saved, detected)
    expect(merged.some((item) => item.id === 'manual-1')).toBe(true)
    expect(merged.some((item) => item.id === 'overdue-payments')).toBe(true)
    expect(merged.some((item) => item.id === 'old-auto-task')).toBe(false)
  })

  it('sortWorkItems ranks pending high-priority tasks first', () => {
    const items: WorkItem[] = [
      {
        id: 'done-high',
        title: 'done',
        description: '',
        priority: 'high',
        status: 'completed',
        createdAt: now.toISOString(),
      },
      {
        id: 'pending-medium',
        title: 'medium',
        description: '',
        priority: 'medium',
        status: 'pending',
        createdAt: now.toISOString(),
      },
      {
        id: 'pending-high',
        title: 'high',
        description: '',
        priority: 'high',
        status: 'pending',
        createdAt: now.toISOString(),
      },
    ]
    const sorted = sortWorkItems(items)
    expect(sorted[0].id).toBe('pending-high')
    expect(sorted[1].id).toBe('pending-medium')
  })

  it('toggleWorkStatus toggles completed to pending', () => {
    expect(toggleWorkStatus('completed')).toBe('pending')
  })
})
