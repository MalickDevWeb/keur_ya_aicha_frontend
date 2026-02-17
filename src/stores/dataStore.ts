import { create } from 'zustand'
import { addDays, addMonths } from 'date-fns'
import type { Client, DashboardStats, MonthlyPayment, Rental } from '@/lib/types'
import type { ClientCreateDTO, ClientUpdateDTO } from '@/dto/backend/requests'
import { enqueueCreateClientAction } from '@/infrastructure/syncQueue'
import {
  fetchClients as fetchClientsAPI,
  createClient,
  updateClient as updateClientAPI,
  deleteClient as deleteClientAPI,
  postPaymentRecord,
  postDepositPayment,
  deleteDocument as deleteDocumentAPI,
  updateMonthlyPayment as updateMonthlyPaymentAPI,
  uploadToCloudinary,
} from '@/services/api'
import { getAuthContext } from '@/services/api/auth.api'
import {
  normalizeEmailForCompare,
  normalizePhoneForCompare,
  validateEmail,
  validateName,
  validateSenegalNumber,
} from '@/validators/frontend'
import { calculateDashboardStats } from '@/services/data/stats'
import { generateId } from '@/services/data/normalizers'
import { serializeClientForApi } from '@/services/data/serialization'
import { transformClientDTO } from '@/services/data/transform'

function isLikelyNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  const message = String((error as { message?: string })?.message || error || '').toLowerCase()
  return (
    message.includes('networkerror') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed')
  )
}

function isBrowserOffline(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.onLine === false
}

export interface DataState {
  // State
  clients: Client[]
  stats: DashboardStats
  isLoading: boolean
  error: string | null

  // Actions
  fetchClients: () => Promise<void>
  fetchStats: () => Promise<void>
  addClient: (
    client: Omit<Client, 'id' | 'createdAt' | 'rentals'> & {
      rental: Omit<Rental, 'id' | 'clientId' | 'payments' | 'documents'>
    }
  ) => Promise<Client>
  updateClient: (id: string, data: Partial<Client>) => Promise<void>
  archiveClient: (id: string) => Promise<void>
  blacklistClient: (id: string) => Promise<void>
  getClient: (id: string) => Client | undefined
  addRental: (clientId: string, rental: Omit<Rental, 'id' | 'clientId' | 'payments' | 'documents'>) => Promise<void>
  deleteClient: (clientId: string) => Promise<void>
  addMonthlyPayment: (
    rentalId: string,
    paymentId: string,
    amount: number,
    options?: { date?: string; receiptNumber?: string; notes?: string }
  ) => Promise<void>
  editMonthlyPayment: (rentalId: string, paymentId: string, amount: number) => Promise<void>
  addDepositPayment: (rentalId: string, amount: number) => Promise<void>
  addDocument: (
    clientId: string,
    rentalId: string,
    doc: { name: string; type: 'contract' | 'receipt' | 'other'; signed?: boolean; file?: File | null }
  ) => Promise<void>
  deleteDocument: (clientId: string, rentalId: string, docId: string) => Promise<void>
  refreshStats: () => Promise<void>
  setError: (error: string | null) => void
  resetData: () => void
}

/**
 * Zustand store for global data state management
 * Replaces Context API for better performance and simplicity
 * Manages clients, stats, and related operations
 */
export const useStore = <T>(selector: (state: DataState) => T) => useDataStore(selector)

export const useDataStore = create<DataState>((set, get) => ({
  // Initial state
  clients: [],
  stats: { total: 0, active: 0, archived: 0, blacklisted: 0, totalDeposits: 0, totalRents: 0 },
  isLoading: false,
  error: null,

  // Fetch clients from API
  fetchClients: async () => {
    try {
      set({ isLoading: true, error: null })
      const [dtos, ctx] = await Promise.all([fetchClientsAPI(), getAuthContext()])
      const activeAdminId =
        ctx?.impersonation?.adminId ||
        (String(ctx?.user?.role || '').toUpperCase() === 'ADMIN' ? ctx?.user?.id || null : null)
      const clients = dtos
        .map((d) => transformClientDTO(d))
        .filter((c) => c.firstName && c.lastName)
        .filter((c) => (activeAdminId ? c.adminId === activeAdminId : true))
      const stats = calculateDashboardStats(clients)
      set({ clients, stats, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch clients'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  // Fetch stats from API (calculated from clients)
  fetchStats: async () => {
    try {
      const [dtos, ctx] = await Promise.all([fetchClientsAPI(), getAuthContext()])
      const activeAdminId =
        ctx?.impersonation?.adminId ||
        (String(ctx?.user?.role || '').toUpperCase() === 'ADMIN' ? ctx?.user?.id || null : null)
      const clients = dtos
        .map((d) => transformClientDTO(d))
        .filter((c) => c.firstName && c.lastName)
        .filter((c) => (activeAdminId ? c.adminId === activeAdminId : true))
      const stats = calculateDashboardStats(clients)
      set({ stats, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch stats'
      set({ error: message })
      throw error
    }
  },

  // Add new client
  addClient: async (clientData) => {
    try {
      set({ error: null })
      const ctx = await getAuthContext()
      const activeAdminId =
        ctx?.impersonation?.adminId ||
        (String(ctx?.user?.role || '').toUpperCase() === 'ADMIN' ? ctx?.user?.id || undefined : undefined)
      const firstName = (clientData.firstName || '').trim()
      const lastName = (clientData.lastName || '').trim()
      const phone = (clientData.phone || '').trim()
      const email = (clientData.email || '').trim()

      if (!firstName || !validateName(firstName)) throw new Error('Prénom invalide')
      if (!lastName || !validateName(lastName)) throw new Error('Nom invalide')
      if (!phone || !validateSenegalNumber(phone)) throw new Error('Numéro de téléphone invalide')
      if (email && !validateEmail(email)) throw new Error('Email invalide')

      const normalizedPhone = normalizePhoneForCompare(phone)
      const normalizedEmail = email ? normalizeEmailForCompare(email) : ''
      if (normalizedPhone) {
        const dup = get().clients.find((c) => normalizePhoneForCompare(c.phone || '') === normalizedPhone)
        if (dup) throw new Error('Client existe déjà avec ce numéro.')
      }
      if (normalizedEmail) {
        const dup = get().clients.find((c) => normalizeEmailForCompare(c.email || '') === normalizedEmail)
        if (dup) throw new Error('Client existe déjà avec cet email.')
      }

      const clientId = generateId()
      const rentalId = generateId()
      const startDate = clientData.rental.startDate
      const monthlyRent = clientData.rental.monthlyRent

      const initialPayment: MonthlyPayment = {
        id: generateId(),
        rentalId,
        periodStart: startDate,
        periodEnd: addDays(addMonths(startDate, 1), -1),
        dueDate: addDays(addMonths(startDate, 1), 4),
        amount: monthlyRent,
        paidAmount: 0,
        status: 'unpaid',
        payments: [],
      }

      const rental: Rental = {
        id: rentalId,
        clientId,
        propertyType: clientData.rental.propertyType,
        propertyName: clientData.rental.propertyName,
        monthlyRent,
        startDate: clientData.rental.startDate,
        deposit: clientData.rental.deposit,
        payments: [initialPayment],
        documents: [],
      }

      const newClient: Client = {
        id: clientId,
        adminId: activeAdminId,
        firstName,
        lastName,
        phone,
        email,
        cni: clientData.cni,
        status: clientData.status,
        createdAt: new Date(),
        rentals: [rental],
      }

      const payload = serializeClientForApi({ ...newClient, createdAt: newClient.createdAt })
      const createPayload = payload as ClientCreateDTO

      const applyClientOptimistically = () => {
        set((state) => {
          const clients = [...state.clients, newClient]
          return {
            clients,
            stats: calculateDashboardStats(clients),
            error: null,
          }
        })
      }

      if (isBrowserOffline()) {
        await enqueueCreateClientAction(createPayload)
        applyClientOptimistically()
        return newClient
      }

      try {
        await createClient(createPayload)
        await get().fetchClients()
      } catch (error) {
        if (!isLikelyNetworkError(error)) {
          throw error
        }
        await enqueueCreateClientAction(createPayload)
        applyClientOptimistically()
      }

      return newClient
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add client'
      set({ error: message })
      throw error
    }
  },

  // Update client
  updateClient: async (id, data) => {
    try {
      set({ error: null })
      const payload = serializeClientForApi(data)
      await updateClientAPI(id, payload as ClientUpdateDTO)
      await get().fetchClients()
      await get().refreshStats()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update client'
      set({ error: message })
      throw error
    }
  },

  // Get client by ID
  getClient: (id) => {
    return get().clients.find((c) => c.id === id)
  },

  // Archive client
  archiveClient: async (id) => {
    await get().updateClient(id, { status: 'archived' })
  },

  // Blacklist client
  blacklistClient: async (id) => {
    await get().updateClient(id, { status: 'blacklisted' })
  },

  // Add rental
  addRental: async (clientId, rentalData) => {
    try {
      set({ error: null })
      const rentalId = generateId()
      const initialPayment: MonthlyPayment = {
        id: generateId(),
        rentalId,
        periodStart: rentalData.startDate,
        periodEnd: addDays(addMonths(rentalData.startDate, 1), -1),
        dueDate: addDays(addMonths(rentalData.startDate, 1), 4),
        amount: rentalData.monthlyRent,
        paidAmount: 0,
        status: 'unpaid',
        payments: [],
      }

      const rental: Rental = {
        id: rentalId,
        clientId,
        ...rentalData,
        payments: [initialPayment],
        documents: [],
      }

      const client = get().clients.find((c) => c.id === clientId)
      const newRentals = client ? [...client.rentals, rental] : [rental]
      await get().updateClient(clientId, { rentals: newRentals })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add rental'
      set({ error: message })
      throw error
    }
  },

  // Add monthly payment
  addMonthlyPayment: async (rentalId, paymentId, amount, options) => {
    try {
      set({ error: null })
      await postPaymentRecord(rentalId, paymentId, amount, options)
      await get().fetchClients()
      await get().refreshStats()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add payment'
      set({ error: message })
      throw error
    }
  },

  // Edit monthly payment
  editMonthlyPayment: async (rentalId, paymentId, amount) => {
    try {
      set({ error: null })
      await updateMonthlyPaymentAPI(rentalId, paymentId, amount)
      await get().fetchClients()
      await get().refreshStats()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to edit payment'
      set({ error: message })
      throw error
    }
  },

  // Add deposit payment
  addDepositPayment: async (rentalId, amount) => {
    try {
      set({ error: null })
      await postDepositPayment(rentalId, amount)
      await get().fetchClients()
      await get().refreshStats()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add deposit payment'
      set({ error: message })
      throw error
    }
  },

  // Add document
  addDocument: async (clientId, rentalId, doc) => {
    try {
      set({ error: null })
      let fileUrl = ''
      if (doc.file) {
        fileUrl = await uploadToCloudinary(doc.file)
      }

      const newDoc = {
        id: generateId(),
        name: doc.name,
        type: doc.type,
        url: fileUrl,
        signed: !!doc.signed,
        uploadedAt: new Date().toISOString(),
      }

      const client = get().clients.find((c) => c.id === clientId)
      if (!client) throw new Error('Client not found')

      const updatedRentals = client.rentals.map((r) => {
        if (r.id !== rentalId) return r
        return { ...r, documents: [...(r.documents || []), newDoc] }
      })

      await get().updateClient(clientId, { rentals: updatedRentals })
      await get().fetchClients()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add document'
      set({ error: message })
      throw error
    }
  },

  // Delete document
  deleteDocument: async (_clientId, _rentalId, docId) => {
    try {
      set({ error: null })
      await deleteDocumentAPI(docId)
      await get().fetchClients()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete document'
      set({ error: message })
      throw error
    }
  },

  // Delete client
  deleteClient: async (clientId) => {
    try {
      set({ error: null })
      await deleteClientAPI(clientId)
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== clientId),
      }))
      await get().refreshStats()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete client'
      set({ error: message })
      throw error
    }
  },

  // Refresh stats
  refreshStats: async () => {
    await get().fetchStats()
  },

  // Set error
  setError: (error) => {
    set({ error })
  },

  // Reset store data (used on logout/account switch to avoid cross-account leakage)
  resetData: () => {
    set({
      clients: [],
      stats: { total: 0, active: 0, archived: 0, blacklisted: 0, totalDeposits: 0, totalRents: 0 },
      isLoading: false,
      error: null,
    })
  },
}))
