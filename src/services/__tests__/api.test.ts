import {
  fetchClients,
  fetchClientById,
  createClient,
  updateClient,
  deleteClient,
  fetchDocuments,
  postDocument as postDocumentAPI,
  deleteDocument,
  fetchPayments,
  postPaymentRecord,
  updatePayment,
  fetchDeposits,
  postDepositPayment,
  updateDeposit,
} from '@/services/api'
import { vi } from 'vitest'

/**
 * Test API CRUD operations
 * Run with: npm test src/services/__tests__/api.test.ts
 */

const useIntegration = process.env.VITE_RUN_INTEGRATION === 'true'
const describeIf = describe

type DbEntity = { id?: string; [key: string]: unknown }
type Db = {
  clients: DbEntity[]
  documents: DbEntity[]
  payments: DbEntity[]
  deposits: DbEntity[]
}

const initialDb: Db = {
  clients: [
    {
      id: 'client-1',
      firstName: 'Test',
      lastName: 'Client',
      phone: '+221 77 000 00 00',
      rentals: [
        {
          id: 'rental-1',
          payments: [
            { id: 'payment-1', amount: 200000, paidAmount: 0, status: 'pending', payments: [] },
          ],
          deposit: { total: 300000, paid: 0, payments: [] },
        },
        {
          id: 'rental-test',
          payments: [
            { id: 'payment-test', amount: 100000, paidAmount: 0, status: 'pending', payments: [] },
          ],
          deposit: { total: 100000, paid: 0, payments: [] },
        },
        {
          id: 'rental-update-test',
          payments: [
            { id: 'payment-update', amount: 100000, paidAmount: 0, status: 'pending', payments: [] },
          ],
          deposit: { total: 250000, paid: 0, payments: [] },
        },
      ],
    },
  ],
  documents: [],
  payments: [],
  deposits: [],
}

let db: Db = structuredClone(initialDb)

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const parseBody = (init?: RequestInit): unknown => {
  if (!init?.body) return null
  try {
    return JSON.parse(init.body as string)
  } catch {
    return null
  }
}

const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString()
  const method = (init?.method || 'GET').toUpperCase()
  const { pathname } = new URL(url, 'http://localhost')

  // Clients
  if (pathname === '/clients' && method === 'GET') {
    return jsonResponse(db.clients)
  }
  if (pathname.startsWith('/clients/') && method === 'GET') {
    const id = pathname.split('/')[2]
    const client = db.clients.find((c) => c.id === id)
    if (!client) return jsonResponse({ message: 'Not found' }, 404)
    return jsonResponse(client)
  }
  if (pathname === '/clients' && method === 'POST') {
    const body = (parseBody(init) || {}) as DbEntity
    const created = { id: body.id || `client-${Date.now()}`, ...body }
    db.clients.push(created)
    return jsonResponse(created, 201)
  }
  if (pathname.startsWith('/clients/') && method === 'PUT') {
    const id = pathname.split('/')[2]
    const body = (parseBody(init) || {}) as DbEntity
    const idx = db.clients.findIndex((c) => c.id === id)
    if (idx === -1) return jsonResponse({ message: 'Not found' }, 404)
    db.clients[idx] = { ...body }
    return jsonResponse(db.clients[idx])
  }
  if (pathname.startsWith('/clients/') && method === 'DELETE') {
    const id = pathname.split('/')[2]
    const idx = db.clients.findIndex((c) => c.id === id)
    if (idx === -1) return jsonResponse({ message: 'Not found' }, 404)
    db.clients.splice(idx, 1)
    return jsonResponse({})
  }

  // Documents
  if (pathname === '/documents' && method === 'GET') {
    return jsonResponse(db.documents)
  }
  if (pathname === '/documents' && method === 'POST') {
    const body = (parseBody(init) || {}) as DbEntity
    const created = { id: body.id || `doc-${Date.now()}`, ...body }
    db.documents.push(created)
    return jsonResponse(created, 201)
  }
  if (pathname.startsWith('/documents/') && method === 'DELETE') {
    const id = pathname.split('/')[2]
    const idx = db.documents.findIndex((d) => d.id === id)
    if (idx === -1) return jsonResponse({ message: 'Not found' }, 404)
    db.documents.splice(idx, 1)
    return jsonResponse({})
  }

  // Payments
  if (pathname === '/payments' && method === 'GET') {
    return jsonResponse(db.payments)
  }
  if (pathname === '/payments' && method === 'POST') {
    const body = (parseBody(init) || {}) as DbEntity
    const created = {
      id: body.receiptId || body.id || `pay-${Date.now()}`,
      ...body,
    }
    db.payments.push(created)
    return jsonResponse(created, 201)
  }
  if (pathname.startsWith('/payments/') && method === 'PUT') {
    const id = pathname.split('/')[2]
    const body = (parseBody(init) || {}) as DbEntity
    const idx = db.payments.findIndex((p) => p.id === id)
    if (idx === -1) return jsonResponse({ message: 'Not found' }, 404)
    db.payments[idx] = { ...db.payments[idx], ...body }
    return jsonResponse(db.payments[idx])
  }
  if (pathname.startsWith('/payments/') && method === 'DELETE') {
    const id = pathname.split('/')[2]
    const idx = db.payments.findIndex((p) => p.id === id)
    if (idx === -1) return jsonResponse({ message: 'Not found' }, 404)
    db.payments.splice(idx, 1)
    return jsonResponse({})
  }

  // Deposits
  if (pathname === '/deposits' && method === 'GET') {
    return jsonResponse(db.deposits)
  }
  if (pathname === '/deposits' && method === 'POST') {
    const body = (parseBody(init) || {}) as DbEntity
    const created = {
      id: body.receiptId || body.id || `dep-${Date.now()}`,
      ...body,
    }
    db.deposits.push(created)
    return jsonResponse(created, 201)
  }
  if (pathname.startsWith('/deposits/') && method === 'PUT') {
    const id = pathname.split('/')[2]
    const body = (parseBody(init) || {}) as DbEntity
    const idx = db.deposits.findIndex((d) => d.id === id)
    if (idx === -1) return jsonResponse({ message: 'Not found' }, 404)
    db.deposits[idx] = { ...db.deposits[idx], ...body }
    return jsonResponse(db.deposits[idx])
  }
  if (pathname.startsWith('/deposits/') && method === 'DELETE') {
    const id = pathname.split('/')[2]
    const idx = db.deposits.findIndex((d) => d.id === id)
    if (idx === -1) return jsonResponse({ message: 'Not found' }, 404)
    db.deposits.splice(idx, 1)
    return jsonResponse({})
  }

  return jsonResponse({ message: 'Not implemented' }, 501)
})

beforeAll(() => {
  if (!useIntegration) {
    db = structuredClone(initialDb)
    vi.stubGlobal('fetch', mockFetch)
  }
})

beforeEach(() => {
  if (!useIntegration) {
    db = structuredClone(initialDb)
    mockFetch.mockClear()
  }
})

afterAll(() => {
  if (!useIntegration) {
    vi.unstubAllGlobals()
  }
})

describeIf('API CRUD Operations', () => {
  describe('Client Operations', () => {
    test('fetchClients - should fetch all clients', async () => {
      const clients = await fetchClients()
      expect(Array.isArray(clients)).toBe(true)
      expect(clients.length).toBeGreaterThan(0)
    })

    test('fetchClientById - should fetch single client', async () => {
      const client = await fetchClientById('client-1')
      expect(client).toBeDefined()
      expect(client.id).toBe('client-1')
    })

    test('createClient - should create new client', async () => {
      const newClient = {
        firstName: 'Test',
        lastName: 'User',
        phone: '+221 77 000 00 00',
        cni: '0000000000000',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        rentals: [],
      }
      const created = await createClient(newClient)
      expect(created.id).toBeDefined()
      expect(created.firstName).toBe('Test')
    })

    test('updateClient - should update client', async () => {
      const updated = await updateClient('client-1', {
        firstName: 'Updated',
      })
      expect(updated).toBeDefined()
    })

    test('deleteClient - should delete client', async () => {
      // Note: json-server requires client to exist
      await expect(deleteClient('non-existent-id')).rejects.toThrow()
    })
  })

  describe('Document Operations', () => {
    test('fetchDocuments - should fetch all documents', async () => {
      const docs = await fetchDocuments()
      expect(Array.isArray(docs)).toBe(true)
    })

    test('postDocument - should create document', async () => {
      const doc = await postDocumentAPI({
        name: 'Test Doc',
        type: 'contract',
        url: 'http://example.com/doc.pdf',
        uploadedAt: new Date().toISOString(),
        signed: false,
      })
      expect(doc.id).toBeDefined()
    })

    test('deleteDocument - should delete document', async () => {
      // Create doc first
      const doc = await postDocumentAPI({
        name: 'To Delete',
        type: 'receipt',
        url: 'http://example.com/delete.pdf',
        uploadedAt: new Date().toISOString(),
        signed: false,
      })

      // Then delete it
      await deleteDocument(doc.id)
    })
  })

  describe('Payment Operations', () => {
    test('fetchPayments - should fetch all payments', async () => {
      const payments = await fetchPayments()
      expect(Array.isArray(payments)).toBe(true)
    })

    test('postPaymentRecord - should create payment', async () => {
      const payment = await postPaymentRecord('rental-1', 'payment-1', 150000)
      expect(payment).toBeDefined()
    })

    test('updatePayment - should update payment', async () => {
      // First create a payment
      const payment = await postPaymentRecord('rental-test', 'payment-test', 100000)

      // Then update it
      const updated = await updatePayment(payment.receipt.id, {
        amount: 120000,
      })
      expect(updated).toBeDefined()
    })
  })

  describe('Deposit Operations', () => {
    test('fetchDeposits - should fetch all deposits', async () => {
      const deposits = await fetchDeposits()
      expect(Array.isArray(deposits)).toBe(true)
    })

    test('postDepositPayment - should create deposit', async () => {
      const deposit = await postDepositPayment('rental-1', 300000)
      expect(deposit).toBeDefined()
    })

    test('updateDeposit - should update deposit', async () => {
      const deposit = await postDepositPayment('rental-update-test', 250000)
      const updated = await updateDeposit(deposit.receipt.id, {
        amount: 350000,
      })
      expect(updated).toBeDefined()
    })
  })
})
