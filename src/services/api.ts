import { ClientDTO } from '@/dto/ClientDTO'
import { DocumentDTO } from '@/dto/DocumentDTO'
import { MonthlyPaymentDTO } from '@/dto/PaymentDTO'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function fetchClients(): Promise<ClientDTO[]> {
  const res = await fetch(`${API_BASE}/clients`)
  if (!res.ok) throw new Error('Failed to fetch clients')
  return res.json()
}

export async function fetchDocuments(): Promise<DocumentDTO[]> {
  const res = await fetch(`${API_BASE}/documents`)
  if (!res.ok) throw new Error('Failed to fetch documents')
  return res.json()
}

export async function postDocument(doc: Partial<DocumentDTO>) {
  const res = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  })
  if (!res.ok) throw new Error('Failed to post document')
  return res.json()
}

export async function deleteDocument(id: string) {
  const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete document')
  return res.json()
}

export async function createClient(client: Partial<ClientDTO>) {
  const res = await fetch(`${API_BASE}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  })
  if (!res.ok) throw new Error('Failed to create client')
  return res.json()
}

export async function updateClient(id: string, data: Partial<ClientDTO>) {
  const res = await fetch(`${API_BASE}/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update client')
  return res.json()
}

export async function postPaymentRecord(rentalId: string, paymentId: string, amount: number) {
  const res = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rentalId, paymentId, amount }),
  })
  if (!res.ok) throw new Error('Failed to post payment')
  return res.json()
}

export async function postDepositPayment(rentalId: string, amount: number) {
  const res = await fetch(`${API_BASE}/deposits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rentalId, amount }),
  })
  if (!res.ok) throw new Error('Failed to post deposit')
  return res.json()
}
// Additional CRUD operations

export async function fetchClientById(id: string): Promise<ClientDTO> {
  const res = await fetch(`${API_BASE}/clients/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch client ${id}`)
  return res.json()
}

export async function fetchPayments() {
  const res = await fetch(`${API_BASE}/payments`)
  if (!res.ok) throw new Error('Failed to fetch payments')
  return res.json()
}

export async function fetchDeposits() {
  const res = await fetch(`${API_BASE}/deposits`)
  if (!res.ok) throw new Error('Failed to fetch deposits')
  return res.json()
}

export async function deleteClient(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/clients/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete client')
}

export async function deletePayment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/payments/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete payment')
}

export async function deleteDeposit(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/deposits/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete deposit')
}

export async function updatePayment(id: string, data: any) {
  const res = await fetch(`${API_BASE}/payments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update payment')
  return res.json()
}

export async function updateDeposit(id: string, data: any) {
  const res = await fetch(`${API_BASE}/deposits/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update deposit')
  return res.json()
}