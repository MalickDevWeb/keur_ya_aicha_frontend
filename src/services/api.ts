import { ClientDTO } from '@/dto/ClientDTO'
import { DocumentDTO } from '@/dto/DocumentDTO'
import { MonthlyPaymentDTO } from '@/dto/PaymentDTO'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Helper function to handle HTTP errors
async function handleResponse(res: Response) {
  if (!res.ok) {
    // Handle authentication errors
    if (res.status === 401) {
      // Clear session and redirect to login (will be handled by context)
      throw new Error('Unauthorized: Session has expired. Please log in again')
    }
    if (res.status === 403) {
      throw new Error('Access forbidden')
    }
    if (res.status === 404) {
      throw new Error('Resource not found')
    }
    if (res.status >= 500) {
      throw new Error('Server error. Please try again later')
    }
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || `HTTP Error: ${res.status}`)
  }
  return res.json()
}

export async function fetchClients(): Promise<ClientDTO[]> {
  console.log('📡 [API] GET /clients')
  try {
    const res = await fetch(`${API_BASE}/clients`)
    const data = await handleResponse(res)
    console.log(`✅ [API] Fetched ${data.length} clients`)
    return data
  } catch (error) {
    console.error('❌ [API] Error fetching clients:', error)
    throw error
  }
}

export async function fetchDocuments(): Promise<DocumentDTO[]> {
  console.log('📡 [API] GET /documents')
  try {
    const res = await fetch(`${API_BASE}/documents`)
    const data = await handleResponse(res)
    console.log(`✅ [API] Fetched ${data.length} documents`)
    return data
  } catch (error) {
    console.error('❌ [API] Error fetching documents:', error)
    throw error
  }
}

export async function postDocument(doc: Partial<DocumentDTO>) {
  console.log('📡 [API] POST /documents:', doc)
  try {
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    })
    const data = await handleResponse(res)
    console.log('✅ [API] Document posted:', data)
    return data
  } catch (error) {
    console.error('❌ [API] Error posting document:', error)
    throw error
  }
}

export async function deleteDocument(id: string) {
  console.log('📡 [API] DELETE /documents/' + id)
  try {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' })
    const data = await handleResponse(res)
    console.log('✅ [API] Document deleted')
    return data
  } catch (error) {
    console.error('❌ [API] Error deleting document:', error)
    throw error
  }
}

export async function createClient(client: Partial<ClientDTO>) {
  console.log('📡 [API] POST /clients:', client)
  try {
    const res = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    })
    const data = await handleResponse(res)
    console.log('✅ [API] Client created:', data)
    return data
  } catch (error) {
    console.error('❌ [API] Error creating client:', error)
    throw error
  }
}

export async function createImportRun(payload: any) {
  console.log('📡 [API] POST /import_runs:', payload)
  try {
    const res = await fetch(`${API_BASE}/import_runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await handleResponse(res)
    console.log('✅ [API] Import run created:', data)
    return data
  } catch (error) {
    console.error('❌ [API] Error creating import run:', error)
    throw error
  }
}

export async function fetchImportRuns() {
  console.log('📡 [API] GET /import_runs')
  try {
    const res = await fetch(`${API_BASE}/import_runs`)
    const data = await handleResponse(res)
    const sorted = Array.isArray(data)
      ? [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : []
    console.log(`✅ [API] Fetched ${sorted.length} import run(s)`)
    return sorted
  } catch (error) {
    console.error('❌ [API] Error fetching import runs:', error)
    throw error
  }
}

export async function updateImportRun(id: string, payload: any) {
  console.log('📡 [API] PATCH /import_runs/' + id, payload)
  try {
    const res = await fetch(`${API_BASE}/import_runs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await handleResponse(res)
    console.log('✅ [API] Import run updated:', data)
    return data
  } catch (error) {
    console.error('❌ [API] Error updating import run:', error)
    throw error
  }
}

export async function updateClient(id: string, data: Partial<ClientDTO>) {
  console.log('📡 [API] PUT /clients/' + id, data)
  try {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const updatedData = await handleResponse(res)
    console.log('✅ [API] Client updated:', updatedData)
    return updatedData
  } catch (error) {
    console.error('❌ [API] Error updating client:', error)
    throw error
  }
}

export async function postPaymentRecord(rentalId: string, paymentId: string, amount: number) {
  console.log('📡 [API] POST /payments:', { rentalId, paymentId, amount })
  try {
    // First, update the nested payment inside the matching client -> rental -> payments
    const clientsRes = await fetch(`${API_BASE}/clients`)
    const clients = await handleResponse(clientsRes)

    const client = clients.find(
      (c: any) => Array.isArray(c.rentals) && c.rentals.some((r: any) => r.id === rentalId)
    )
    if (!client) throw new Error('Client with rentalId not found')

    const rental = client.rentals.find((r: any) => r.id === rentalId)
    if (!rental) throw new Error('Rental not found on client')

    const payment = rental.payments.find((p: any) => p.id === paymentId)
    if (!payment) throw new Error('Monthly payment entry not found')

    // Create a receipt record
    const receipt = {
      id: Math.random().toString(36).substring(2, 10),
      amount,
      date: new Date().toISOString(),
      receiptNumber: `REC-${Date.now()}`,
    }

    payment.paidAmount = (payment.paidAmount || 0) + amount
    payment.payments = payment.payments || []
    payment.payments.push(receipt)

    if (payment.paidAmount >= payment.amount) {
      payment.paidAmount = payment.amount
      payment.status = 'paid'
    } else if (payment.paidAmount > 0) {
      payment.status = 'partial'
    }

    // Persist updated client back to API (json-server expects full client object)
    const putRes = await fetch(`${API_BASE}/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    })
    const updatedClient = await handleResponse(putRes)
    console.log('✅ [API] Client updated with payment:', { clientId: client.id, paymentId, amount })

    // Also append a flat payment record for audit/history in /payments collection
    try {
      const res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId,
          paymentId,
          amount,
          receiptId: receipt.id,
          date: receipt.date,
        }),
      })
      const paymentRecord = await handleResponse(res)
      console.log('✅ [API] Flat payment record appended')
    } catch (e) {
      console.warn('⚠️ [API] Could not append flat payment record', e)
    }

    return { updatedClient, receipt }
  } catch (error) {
    console.error('❌ [API] Error posting payment:', error)
    throw error
  }
}

export async function updateMonthlyPayment(rentalId: string, paymentId: string, amount: number) {
  console.log('📡 [API] PUT monthly payment:', { rentalId, paymentId, amount })
  try {
    const clientsRes = await fetch(`${API_BASE}/clients`)
    const clients = await handleResponse(clientsRes)

    const client = clients.find(
      (c: any) => Array.isArray(c.rentals) && c.rentals.some((r: any) => r.id === rentalId)
    )
    if (!client) throw new Error('Client with rentalId not found')

    const rental = client.rentals.find((r: any) => r.id === rentalId)
    if (!rental) throw new Error('Rental not found on client')

    const payment = rental.payments.find((p: any) => p.id === paymentId)
    if (!payment) throw new Error('Monthly payment entry not found')

    const safeAmount = Math.max(0, Number(amount) || 0)
    payment.paidAmount = safeAmount
    payment.payments = [{
      id: Math.random().toString(36).substring(2, 10),
      amount: safeAmount,
      date: new Date().toISOString(),
      receiptNumber: `CORR-${Date.now()}`,
      note: 'Correction',
    }]

    if (safeAmount >= payment.amount) {
      payment.paidAmount = payment.amount
      payment.status = 'paid'
    } else if (safeAmount > 0) {
      payment.status = 'partial'
    } else {
      payment.status = 'unpaid'
    }

    const putRes = await fetch(`${API_BASE}/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    })
    const updatedClient = await handleResponse(putRes)
    console.log('✅ [API] Monthly payment corrected:', { clientId: client.id, paymentId })
    return updatedClient
  } catch (error) {
    console.error('❌ [API] Error updating monthly payment:', error)
    throw error
  }
}

export async function postDepositPayment(rentalId: string, amount: number) {
  console.log('📡 [API] POST /deposits:', { rentalId, amount })
  try {
    // First, update the nested deposit inside the matching client -> rental
    const clientsRes = await fetch(`${API_BASE}/clients`)
    if (!clientsRes.ok) throw new Error('Failed to fetch clients for deposit processing')
    const clients = await clientsRes.json()

    const client = clients.find(
      (c: any) => Array.isArray(c.rentals) && c.rentals.some((r: any) => r.id === rentalId)
    )
    if (!client) throw new Error('Client with rentalId not found')

    const rental = client.rentals.find((r: any) => r.id === rentalId)
    if (!rental) throw new Error('Rental not found on client')

    if (!rental.deposit) throw new Error('Deposit not found on rental')

    // Create a receipt record for the deposit
    const receipt = {
      id: Math.random().toString(36).substring(2, 10),
      amount,
      date: new Date().toISOString(),
      receiptNumber: `DEP-${Date.now()}`,
    }

    rental.deposit.paid = (rental.deposit.paid || 0) + amount
    rental.deposit.payments = rental.deposit.payments || []
    rental.deposit.payments.push(receipt)

    // Cap paid amount at total
    if (rental.deposit.paid >= rental.deposit.total) {
      rental.deposit.paid = rental.deposit.total
    }

    // Persist updated client back to API
    const putRes = await fetch(`${API_BASE}/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    })
    if (!putRes.ok) throw new Error('Failed to update client with deposit payment')
    const updatedClient = await putRes.json()
    console.log('✅ [API] Client updated with deposit payment:', {
      clientId: client.id,
      rentalId,
      amount,
    })

    // Also append a flat deposit record for audit/history
    try {
      const res = await fetch(`${API_BASE}/deposits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId,
          amount,
          receiptId: receipt.id,
          date: receipt.date,
        }),
      })
      if (!res.ok) console.warn('⚠️ [API] Warning: failed to append flat deposit record')
      else console.log('✅ [API] Flat deposit record appended')
    } catch (e) {
      console.warn('⚠️ [API] Could not append flat deposit record', e)
    }

    return { updatedClient, receipt }
  } catch (error) {
    console.error('❌ [API] Error posting deposit:', error)
    throw error
  }
}
// Additional CRUD operations

export async function fetchClientById(id: string): Promise<ClientDTO> {
  console.log('📡 [API] GET /clients/' + id)
  try {
    const res = await fetch(`${API_BASE}/clients/${id}`)
    if (!res.ok) throw new Error(`Failed to fetch client ${id}`)
    const data = await res.json()
    console.log('✅ [API] Client fetched:', data)
    return data
  } catch (error) {
    console.error('❌ [API] Error fetching client:', error)
    throw error
  }
}

export async function fetchPayments() {
  console.log('📡 [API] GET /payments')
  try {
    const res = await fetch(`${API_BASE}/payments`)
    if (!res.ok) throw new Error('Failed to fetch payments')
    const data = await res.json()
    console.log(`✅ [API] Fetched ${data.length} payments`)
    return data
  } catch (error) {
    console.error('❌ [API] Error fetching payments:', error)
    throw error
  }
}

export async function fetchDeposits() {
  console.log('📡 [API] GET /deposits')
  try {
    const res = await fetch(`${API_BASE}/deposits`)
    if (!res.ok) throw new Error('Failed to fetch deposits')
    const data = await res.json()
    console.log(`✅ [API] Fetched ${data.length} deposits`)
    return data
  } catch (error) {
    console.error('❌ [API] Error fetching deposits:', error)
    throw error
  }
}

export async function deleteClient(id: string): Promise<void> {
  console.log('📡 [API] DELETE /clients/' + id)
  try {
    const res = await fetch(`${API_BASE}/clients/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete client')
    console.log('✅ [API] Client deleted')
  } catch (error) {
    console.error('❌ [API] Error deleting client:', error)
    throw error
  }
}

export async function deletePayment(id: string): Promise<void> {
  console.log('📡 [API] DELETE /payments/' + id)
  try {
    const res = await fetch(`${API_BASE}/payments/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete payment')
    console.log('✅ [API] Payment deleted')
  } catch (error) {
    console.error('❌ [API] Error deleting payment:', error)
    throw error
  }
}

export async function deleteDeposit(id: string): Promise<void> {
  console.log('📡 [API] DELETE /deposits/' + id)
  try {
    const res = await fetch(`${API_BASE}/deposits/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete deposit')
    console.log('✅ [API] Deposit deleted')
  } catch (error) {
    console.error('❌ [API] Error deleting deposit:', error)
    throw error
  }
}

export async function updatePayment(id: string, data: any) {
  console.log('📡 [API] PUT /payments/' + id, data)
  try {
    const res = await fetch(`${API_BASE}/payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update payment')
    const updatedData = await res.json()
    console.log('✅ [API] Payment updated:', updatedData)
    return updatedData
  } catch (error) {
    console.error('❌ [API] Error updating payment:', error)
    throw error
  }
}

export async function updateDeposit(id: string, data: any) {
  console.log('📡 [API] PUT /deposits/' + id, data)
  try {
    const res = await fetch(`${API_BASE}/deposits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update deposit')
    const updatedData = await res.json()
    console.log('✅ [API] Deposit updated:', updatedData)
    return updatedData
  } catch (error) {
    console.error('❌ [API] Error updating deposit:', error)
    throw error
  }
}

// Upload a File/Blob to Cloudinary (unsigned preset) and return the secure URL
export async function uploadToCloudinary(file: File | Blob): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  const signUrl = import.meta.env.VITE_CLOUDINARY_SIGN_URL // optional: http://localhost:3001/sign

  if (!cloudName) {
    throw new Error('Cloudinary configuration missing: set VITE_CLOUDINARY_CLOUD_NAME')
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`
  const form = new FormData()
  form.append('file', file as any)

  console.log('📡 [API] Uploading file to Cloudinary')
  try {
    if (signUrl) {
      // Request signature from local server
      const sigRes = await fetch(signUrl, { method: 'POST' })
      if (!sigRes.ok) throw new Error('Failed to obtain Cloudinary signature from server')
      const sig = await sigRes.json()
      // sig: { api_key, timestamp, signature }
      form.append('api_key', sig.api_key)
      form.append('timestamp', String(sig.timestamp))
      form.append('signature', sig.signature)
    } else {
      if (!uploadPreset) {
        throw new Error(
          'Cloudinary unsigned preset missing: set VITE_CLOUDINARY_UPLOAD_PRESET or provide VITE_CLOUDINARY_SIGN_URL'
        )
      }
      form.append('upload_preset', uploadPreset)
    }

    const res = await fetch(url, { method: 'POST', body: form })
    if (!res.ok) {
      const txt = await res.text()
      console.error('❌ [API] Cloudinary upload failed:', txt)
      throw new Error('Cloudinary upload failed')
    }
    const data = await res.json()
    const secureUrl = data.secure_url || data.url
    if (!secureUrl) throw new Error('Cloudinary did not return a secure_url')
    console.log('✅ [API] Uploaded to Cloudinary:', secureUrl)
    return secureUrl
  } catch (error) {
    console.error('❌ [API] Error uploading to Cloudinary:', error)
    throw error
  }
}

// Convenience: upload file then persist a document record in json-server
export async function uploadDocumentAndSave(
  file: File | Blob,
  metadata: Partial<DocumentDTO> = {}
) {
  try {
    const fileUrl = await uploadToCloudinary(file)
    const doc = {
      id: metadata.id || Math.random().toString(36).substring(2, 10),
      name: metadata.name || (file instanceof File ? file.name : 'upload'),
      url: fileUrl,
      uploadedAt: new Date().toISOString(),
      ...metadata,
    }
    return await postDocument(doc)
  } catch (error) {
    console.error('❌ [API] Error uploading document and saving:', error)
    throw error
  }
}
// Auth API
export interface AuthUser {
  id: string
  username: string
  name: string
  email: string
  role: string
  status?: string
}

export interface UserDTO extends AuthUser {
  phone?: string
}

export async function loginUser(username: string, password: string): Promise<AuthUser | null> {
  console.log('📡 [API] Login (server session)')
  const safeUsername = String(username || '').trim()
  const safePassword = String(password || '').trim()
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: safeUsername, password: safePassword }),
    })
    if (!res.ok) {
      let message = 'Failed to authenticate user'
      try {
        const err = await res.json()
        if (err?.error) message = err.error
      } catch {
        // ignore
      }
      throw new Error(message)
    }
    const data = await res.json()
    const user = data?.user || data
    if (!user) return null
    console.log('✅ [API] User authenticated:', user.username)
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    }
  } catch (error) {
    console.error('❌ [API] Error logging in:', error)
    throw error
  }
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/session`)
    if (!res.ok) return null
    const data = await res.json()
    const user = data?.user
    return user || null
  } catch {
    return null
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' })
  } catch {
    // ignore
  }
}

export type ImpersonationState = null | { adminId: string; adminName: string; userId?: string | null }

export async function getAuthContext(): Promise<{ user: AuthUser | null; impersonation: ImpersonationState }> {
  const res = await fetch(`${API_BASE}/authContext`)
  if (!res.ok) return { user: null, impersonation: null }
  return res.json()
}

export async function loginAuthContext(username: string, password: string): Promise<{ user: AuthUser | null }> {
  const res = await fetch(`${API_BASE}/authContext/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    let message = 'Failed to authenticate user'
    try {
      const err = await res.json()
      if (err?.error) message = err.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  return res.json()
}

export async function logoutAuthContext(): Promise<void> {
  await fetch(`${API_BASE}/authContext/logout`, { method: 'POST' })
}

export async function setImpersonation(payload: ImpersonationState): Promise<void> {
  if (!payload) return
  await fetch(`${API_BASE}/authContext/impersonate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function clearImpersonation(): Promise<void> {
  await fetch(`${API_BASE}/authContext/clear-impersonation`, { method: 'POST' })
}

// Settings API
export async function getSetting(key: string): Promise<string | null> {
  console.log(`📡 [API] GET /settings?key=${key}`)
  try {
    const res = await fetch(`${API_BASE}/settings?key=${key}`)
    if (!res.ok) throw new Error('Failed to fetch setting')
    const data = await res.json()
    if (data.length === 0) return null
    console.log(`✅ [API] Got setting ${key}:`, data[0].value)
    return data[0].value
  } catch (error) {
    console.error(`❌ [API] Error fetching setting ${key}:`, error)
    throw error
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  console.log(`📡 [API] PATCH /settings (${key}=${value})`)
  try {
    const res = await fetch(`${API_BASE}/settings?key=${key}`)
    if (!res.ok) throw new Error('Failed to fetch existing setting')
    const data = await res.json()
    if (data.length === 0) {
      // Create new setting
      const newRes = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, key, value }),
      })
      if (!newRes.ok) throw new Error('Failed to create setting')
      console.log(`✅ [API] Created setting ${key}:`, value)
    } else {
      // Update existing setting
      const settingId = data[0].id
      const updateRes = await fetch(`${API_BASE}/settings/${settingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      if (!updateRes.ok) throw new Error('Failed to update setting')
      console.log(`✅ [API] Updated setting ${key}:`, value)
    }
  } catch (error) {
    console.error(`❌ [API] Error setting ${key}:`, error)
    throw error
  }
}

// Super Admin APIs
export type AdminStatus =
  | 'EN_ATTENTE'
  | 'ACTIF'
  | 'SUSPENDU'
  | 'BLACKLISTE'
  | 'ARCHIVE'

export const ADMIN_STATUS_LABELS: Record<AdminStatus,
  ADMIN_STATUS_LABELS,
  ADMIN_STATUS_COLORS,
  ADMIN_STATUS_BADGE_COLORS, string> = {
  EN_ATTENTE: 'En attente',
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  BLACKLISTE: 'Blacklisté',
  ARCHIVE: 'Archivé',
}

export const ADMIN_STATUS_COLORS: Record<AdminStatus,
  ADMIN_STATUS_LABELS,
  ADMIN_STATUS_COLORS,
  ADMIN_STATUS_BADGE_COLORS, string> = {
  EN_ATTENTE: 'bg-slate-100 text-slate-700 border-slate-300',
  ACTIF: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  SUSPENDU: 'bg-amber-100 text-amber-700 border-amber-300',
  BLACKLISTE: 'bg-red-100 text-red-700 border-red-300',
  ARCHIVE: 'bg-gray-100 text-gray-700 border-gray-300',
}

export const ADMIN_STATUS_BADGE_COLORS: Record<AdminStatus,
  ADMIN_STATUS_LABELS,
  ADMIN_STATUS_COLORS,
  ADMIN_STATUS_BADGE_COLORS, string> = {
  EN_ATTENTE: 'bg-slate-500',
  ACTIF: 'bg-emerald-500',
  SUSPENDU: 'bg-amber-500',
  BLACKLISTE: 'bg-red-500',
  ARCHIVE: 'bg-gray-500',
}

// Button variant mappings for different statuses
const STATUS_ACTION_VARIANTS: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
  // For ACTIF admin
  Suspendre: 'secondary',
  Blacklister: 'destructive',
  Archiver: 'outline',
  // For SUSPENDU admin
  Activer: 'default',
  // For ARCHIVE admin
}

export interface AdminDTO {
  id: string
  userId: string
  username: string
  name: string
  email: string
  status: AdminStatus
  entrepriseId?: string
  createdAt?: string
}

export interface AdminRequestDTO {
  id: string
  username: string
  name: string
  email?: string
  phone?: string
  entrepriseName?: string
  status: AdminStatus
  createdAt?: string
}

export interface EntrepriseDTO {
  id: string
  name: string
  adminId?: string
  createdAt?: string
}

export interface AuditLogDTO {
  id: string
  actor?: string
  action?: string
  targetType?: string
  targetId?: string
  message?: string
  createdAt?: string
}

export async function fetchAdmins(): Promise<AdminDTO[]> {
  const res = await fetch(`${API_BASE}/admins`)
  if (!res.ok) throw new Error('Failed to fetch admins')
  return res.json()
}

export async function updateAdmin(id: string, payload: Partial<AdminDTO>): Promise<AdminDTO> {
  const res = await fetch(`${API_BASE}/admins/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update admin')
  return res.json()
}

export async function fetchAdminRequests(): Promise<AdminRequestDTO[]> {
  const res = await fetch(`${API_BASE}/admin_requests`)
  if (!res.ok) throw new Error('Failed to fetch admin requests')
  return res.json()
}

export async function updateAdminRequest(id: string, payload: Partial<AdminRequestDTO>): Promise<AdminRequestDTO> {
  const res = await fetch(`${API_BASE}/admin_requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update admin request')
  return res.json()
}

export async function createAdminRequest(payload: AdminRequestDTO): Promise<AdminRequestDTO> {
  const res = await fetch(`${API_BASE}/admin_requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create admin request')
  return res.json()
}

export async function createAdmin(payload: AdminDTO): Promise<AdminDTO> {
  const res = await fetch(`${API_BASE}/admins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function createEntreprise(payload: EntrepriseDTO): Promise<EntrepriseDTO> {
  const res = await fetch(`${API_BASE}/entreprises`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function createUser(payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function fetchUsers(): Promise<UserDTO[]> {
  const res = await fetch(`${API_BASE}/users`)
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function updateUser(id: string, payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update user')
  return res.json()
}

export async function fetchEntreprises(): Promise<EntrepriseDTO[]> {
  const res = await fetch(`${API_BASE}/entreprises`)
  if (!res.ok) throw new Error('Failed to fetch entreprises')
  return res.json()
}

export async function fetchAuditLogs(): Promise<AuditLogDTO[]> {
  const res = await fetch(`${API_BASE}/audit_logs?_sort=createdAt&_order=desc&_limit=10`)
  if (!res.ok) throw new Error('Failed to fetch audit logs')
  return res.json()
}

// Work Items API
export async function getWorkItems() {
  console.log('📡 [API] GET /work_items')
  try {
    const res = await fetch(`${API_BASE}/work_items`)
    if (!res.ok) throw new Error('Failed to fetch work items')
    const data = await res.json()
    console.log(`✅ [API] Fetched ${data.length} work items`)
    return data
  } catch (error) {
    console.error('❌ [API] Error fetching work items:', error)
    throw error
  }
}

export async function postWorkItem(item: any) {
  console.log('📡 [API] POST /work_items:', item)
  try {
    const res = await fetch(`${API_BASE}/work_items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error('Failed to post work item')
    const data = await res.json()
    console.log('✅ [API] Work item posted:', data)
    return data
  } catch (error) {
    console.error('❌ [API] Error posting work item:', error)
    throw error
  }
}

export async function updateWorkItem(id: string, item: any) {
  console.log('📡 [API] PATCH /work_items/' + id, item)
  try {
    const res = await fetch(`${API_BASE}/work_items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error('Failed to update work item')
    const data = await res.json()
    console.log('✅ [API] Work item updated:', data)
    return data
  } catch (error) {
    console.error('❌ [API] Error updating work item:', error)
    throw error
  }
}

export async function deleteWorkItem(id: string) {
  console.log('📡 [API] DELETE /work_items/' + id)
  try {
    const res = await fetch(`${API_BASE}/work_items/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete work item')
    console.log('✅ [API] Work item deleted')
  } catch (error) {
    console.error('❌ [API] Error deleting work item:', error)
    throw error
  }
}
