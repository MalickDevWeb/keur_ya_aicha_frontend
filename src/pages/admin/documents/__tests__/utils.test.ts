import { describe, expect, it } from 'vitest'
import { buildDocumentsList, filterDocuments, groupDocumentsByType } from '../utils'

const clients = [
  {
    id: 'c1',
    firstName: 'Awa',
    lastName: 'Diop',
    phone: '77 123 45 67',
    rentals: [
      {
        id: 'r1',
        propertyName: 'Villa',
        documents: [
          { id: 'd1', name: 'Contrat Villa', type: 'contract', signed: true, uploadedAt: '2024-01-02' },
          { id: 'd2', name: 'Recu Janvier', type: 'receipt', signed: false, uploadedAt: '2024-01-03' },
        ],
      },
    ],
  },
]

describe('documents utils', () => {
  it('buildDocumentsList flattens docs and sorts by date desc', () => {
    const docs = buildDocumentsList(clients)
    expect(docs).toHaveLength(2)
    expect(docs[0].id).toBe('d2')
  })

  it('filterDocuments searches by client name and doc name', () => {
    const docs = buildDocumentsList(clients)
    const filtered = filterDocuments(docs, clients, 'villa', '')
    expect(filtered).toHaveLength(2)
  })

  it('groupDocumentsByType groups by type', () => {
    const docs = buildDocumentsList(clients)
    const groups = groupDocumentsByType(docs)
    const contracts = groups.find((group) => group.type === 'contract')
    expect(contracts?.items).toHaveLength(1)
  })
})
