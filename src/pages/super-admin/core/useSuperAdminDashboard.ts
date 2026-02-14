import { useEffect, useMemo, useState } from 'react'
import {
  createAdmin,
  createUser,
  fetchAdminRequests,
  fetchAdmins,
  fetchAuditLogs,
  fetchClients,
  fetchEntreprises,
  fetchUsers,
  updateAdminRequest,
} from '@/services/api'
import type {
  AdminRequestDTO,
} from '@/dto/frontend/responses'
import type { CreatedAdmin } from './types'
import { createEntityId, normalize, normalizePhone } from './utils'

export function useSuperAdminDashboard() {
  const [state, setState] = useState({
    isCreateOpen: false,
    creating: false,
    createError: '',
    newAdmin: {
      username: '',
      name: '',
      email: '',
      entreprise: '',
      password: '',
      phone: '',
    },
    createdAdmin: null,
    admins: [],
    requests: [],
    entreprises: [],
    users: [],
    auditLogs: [],
    logSearch: '',
    logFilter: 'all',
    showAllLogs: false,
    approveErrors: {},
    pendingSearch: '',
    pendingOnlyEntreprise: false,
    showAllPending: false,
    loading: true,
    adminSearch: '',
    paymentStats: { paid: 0, unpaid: 0, partial: 0 },
  })

  const refresh = async () => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const [admins, requests, entreprises, users, clients, logs] = await Promise.all([
        fetchAdmins(),
        fetchAdminRequests(),
        fetchEntreprises(),
        fetchUsers(),
        fetchClients(),
        fetchAuditLogs(),
      ])
      const paymentStats = calculatePaymentStats(clients)
      setState((prev) => ({
        ...prev,
        admins,
        requests,
        entreprises,
        users,
        auditLogs: logs,
        paymentStats,
        loading: false,
      }))
    } catch {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const calculatePaymentStats = (clients) => {
    const stats = { paid: 0, unpaid: 0, partial: 0 }
    clients.forEach((client) => {
      if (['archived', 'blacklisted'].includes(client.status)) return
      client.rentals?.forEach((rental) => {
        rental.payments?.forEach((payment) => {
          if (payment.status === 'paid') stats.paid += 1
          else if (payment.status === 'partial') stats.partial += 1
          else stats.unpaid += 1
        })
      })
    })
    return stats
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleCreateAdmin = async () => {
    const { newAdmin } = state
    if (!newAdmin.username || !newAdmin.name || !newAdmin.entreprise) {
      setState((prev) => ({ ...prev, createError: 'Tous les champs sont obligatoires.' }))
      return
    }
    setState((prev) => ({ ...prev, creating: true, createError: '' }))
    try {
      const createdAt = new Date().toISOString()
      const userId = createEntityId('user')

      await createUser({
        id: userId,
        username: newAdmin.username,
        password: newAdmin.password || 'admin123',
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: 'ADMIN',
        status: 'ACTIF',
        createdAt,
      })

      await createAdmin({
        id: userId,
        userId,
        username: newAdmin.username,
        name: newAdmin.name,
        email: newAdmin.email,
        status: 'ACTIF',
        entrepriseId: newAdmin.entreprise || '',
        createdAt,
      })

      setState((prev) => ({
        ...prev,
        createdAdmin: { ...newAdmin, createdAt },
        newAdmin: {
          username: '',
          name: '',
          email: '',
          entreprise: '',
          password: '',
          phone: '',
        },
      }))
      refresh()
    } catch {
      setState((prev) => ({ ...prev, createError: "Échec de la création de l'admin." }))
    } finally {
      setState((prev) => ({ ...prev, creating: false }))
    }
  }

  const pendingRequests = useMemo(
    () => state.requests.filter((req) => !req.status || req.status === 'EN_ATTENTE'),
    [state.requests]
  )

  const visiblePending = useMemo(() => {
    const needle = normalize(state.pendingSearch)
    const filtered = pendingRequests.filter((req) => {
      if (state.pendingOnlyEntreprise && !req.entrepriseName) return false
      if (!needle) return true
      const haystack = [
        req.name,
        req.email,
        req.phone,
        req.entrepriseName,
        req.username,
      ]
        .map((value) => normalize(value))
        .join(' ')
      return haystack.includes(needle)
    })
    return state.showAllPending ? filtered : filtered.slice(0, 5)
  }, [pendingRequests, state.pendingSearch, state.pendingOnlyEntreprise, state.showAllPending])

  const approveRequest = async (req: AdminRequestDTO) => {
    if (!req?.id) return
    const phoneLogin = normalizePhone(req.phone || '')
    const username = req.username?.trim() || phoneLogin || normalize(req.name).replace(/\s+/g, '')
    if (!username || !req.name) {
      setState((prev) => ({
        ...prev,
        approveErrors: { ...prev.approveErrors, [req.id]: "Nom ou identifiant manquant." },
      }))
      return
    }

    setState((prev) => ({
      ...prev,
      approveErrors: { ...prev.approveErrors, [req.id]: '' },
    }))

    try {
      const password = req.password || 'admin123'
      const updated = await updateAdminRequest(req.id, {
        status: 'ACTIF',
        username,
        paid: true,
        paidAt: new Date().toISOString(),
      })

      setState((prev) => ({
        ...prev,
        requests: prev.requests.map((r) => (r.id === req.id ? updated : r)),
        approveErrors: { ...prev.approveErrors, [req.id]: '' },
        createdAdmin: {
          name: req.name,
          username,
          password,
          email: req.email || '',
          entreprise: req.entrepriseName || '',
          phone: req.phone || '',
          createdAt: new Date().toISOString(),
        },
        isCreateOpen: true,
      }))
      refresh()
    } catch {
      setState((prev) => ({
        ...prev,
        approveErrors: { ...prev.approveErrors, [req.id]: "Échec de validation de la demande." },
      }))
    }
  }

  const paymentDistribution = useMemo(
    () => [
      { name: 'Payés', value: state.paymentStats.paid },
      { name: 'Partiels', value: state.paymentStats.partial },
      { name: 'Impayés', value: state.paymentStats.unpaid },
    ],
    [state.paymentStats]
  )

  const totalPayments = useMemo(
    () => paymentDistribution.reduce((sum, entry) => sum + entry.value, 0),
    [paymentDistribution]
  )

  const setNewAdminField = (field: keyof typeof state.newAdmin, value: string) => {
    setState((prev) => ({ ...prev, newAdmin: { ...prev.newAdmin, [field]: value } }))
  }

  return {
    admins: state.admins,
    entreprises: state.entreprises,
    pendingRequests,
    visiblePending,
    showAllPending: state.showAllPending,
    setShowAllPending: (value: boolean) => setState((prev) => ({ ...prev, showAllPending: value })),
    pendingSearch: state.pendingSearch,
    setPendingSearch: (value: string) => setState((prev) => ({ ...prev, pendingSearch: value })),
    pendingOnlyEntreprise: state.pendingOnlyEntreprise,
    setPendingOnlyEntreprise: (value: boolean) => setState((prev) => ({ ...prev, pendingOnlyEntreprise: value })),
    approveErrors: state.approveErrors,
    approveRequest,
    paymentDistribution,
    totalPayments,
    createAdminDirect: handleCreateAdmin,
    createdAdmin: state.createdAdmin as CreatedAdmin | null,
    setCreatedAdmin: (value: CreatedAdmin | null) => setState((prev) => ({ ...prev, createdAdmin: value })),
    creating: state.creating,
    createError: state.createError,
    setCreateError: (value: string) => setState((prev) => ({ ...prev, createError: value })),
    isCreateOpen: state.isCreateOpen,
    setIsCreateOpen: (value: boolean) => setState((prev) => ({ ...prev, isCreateOpen: value })),
    newUsername: state.newAdmin.username,
    setNewUsername: (value: string) => setNewAdminField('username', value),
    newName: state.newAdmin.name,
    setNewName: (value: string) => setNewAdminField('name', value),
    newEmail: state.newAdmin.email,
    setNewEmail: (value: string) => setNewAdminField('email', value),
    newEntreprise: state.newAdmin.entreprise,
    setNewEntreprise: (value: string) => setNewAdminField('entreprise', value),
    newPassword: state.newAdmin.password,
    setNewPassword: (value: string) => setNewAdminField('password', value),
    newPhone: state.newAdmin.phone,
    setNewPhone: (value: string) => setNewAdminField('phone', value),
    loading: state.loading,
  }
}
