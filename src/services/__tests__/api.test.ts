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
  deletePayment,
  fetchDeposits,
  postDepositPayment,
  updateDeposit,
  deleteDeposit
} from '@/services/api'

/**
 * Test API CRUD operations
 * Run with: npm test src/services/__tests__/api.test.ts
 */

describe('API CRUD Operations', () => {
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
        firstName: 'Updated' 
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
      const updated = await updatePayment(payment.id, { 
        amount: 120000 
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
      const updated = await updateDeposit(deposit.id, { 
        amount: 350000 
      })
      expect(updated).toBeDefined()
    })
  })
})
