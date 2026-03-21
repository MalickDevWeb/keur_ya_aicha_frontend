import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  createAdminRequest,
  fetchAdminRequests,
  fetchAdmins,
  fetchAuditLogs,
  fetchAdminPayments,
  fetchClients,
  fetchEntreprises,
  updateAdminRequest,
} from '@/services/api'
import type { AdminRequestDTO } from '@/dto/frontend/responses'
import type { CreatedAdmin } from './types'
import { buildCredentialsMessage, createEntityId, formatPhoneForWhatsapp, normalize, normalizePhone } from './utils'

function isSecondAuthRequiredError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || error || '').toLowerCase()
  return message.includes('seconde authentification super admin requise')
}

function getFulfilledValue<T>(result: PromiseSettledResult<T>): T | null {
  if (result.status !== 'fulfilled') return null
  return result.value
}

const REQUESTS_BOOT_TIMEOUT_MS = 4_500
const BACKGROUND_REQUEST_TIMEOUT_MS = 8_000

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  try {
    return await new Promise<T>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Timeout ${label} après ${timeoutMs}ms`))
      }, timeoutMs)

      promise
        .then((value) => resolve(value))
        .catch((error) => reject(error))
    })
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export function useSuperAdminDashboard() {
  const { user, impersonation } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const hasImpersonation = Boolean(impersonation?.adminId)
  const canReadAdminScopedData = !isSuperAdmin || hasImpersonation
  const requiresSecondAuth = role === 'SUPER_ADMIN' && user?.superAdminSecondAuthRequired !== false
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
    adminPayments: [],
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

  const markSecondAuthRequired = () => {
    window.dispatchEvent(new CustomEvent('super-admin-second-auth-required'))
  }

  const refresh = async () => {
    if (requiresSecondAuth) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    setState((prev) => ({ ...prev, loading: true }))
    const requestsResult = await Promise.allSettled([
      withTimeout(fetchAdminRequests(), REQUESTS_BOOT_TIMEOUT_MS, 'admin_requests'),
    ])
    const requestFailure =
      requestsResult[0].status === 'rejected' ? requestsResult[0].reason : null
    if (requestFailure && isSecondAuthRequiredError(requestFailure)) {
      markSecondAuthRequired()
    }
    const requests = getFulfilledValue(requestsResult[0])

    // Débloque rapidement l'UI sur la section principale "Demandes en attente".
    setState((prev) => ({
      ...prev,
      requests: requests ?? prev.requests,
      loading: false,
    }))

    const coreResults = await Promise.allSettled([
      withTimeout(fetchAdmins(), BACKGROUND_REQUEST_TIMEOUT_MS, 'admins'),
      withTimeout(fetchEntreprises(), BACKGROUND_REQUEST_TIMEOUT_MS, 'entreprises'),
    ])

    const coreFailures = coreResults
      .filter((result) => result.status === 'rejected')
      .map((result) => (result as PromiseRejectedResult).reason)
    if (coreFailures.some((error) => isSecondAuthRequiredError(error))) {
      markSecondAuthRequired()
    }

    const admins = getFulfilledValue(coreResults[0])
    const entreprises = getFulfilledValue(coreResults[1])

    if (!canReadAdminScopedData) {
      setState((prev) => ({
        ...prev,
        admins: admins ?? prev.admins,
        entreprises: entreprises ?? prev.entreprises,
        auditLogs: [],
        adminPayments: [],
        paymentStats: { paid: 0, unpaid: 0, partial: 0 },
      }))
      return
    }

    const scopedResults = await Promise.allSettled([
      withTimeout(fetchClients(), BACKGROUND_REQUEST_TIMEOUT_MS, 'clients'),
      withTimeout(fetchAuditLogs(), BACKGROUND_REQUEST_TIMEOUT_MS, 'audit_logs'),
      withTimeout(fetchAdminPayments(), BACKGROUND_REQUEST_TIMEOUT_MS, 'admin_payments'),
    ])

    const scopedFailures = scopedResults
      .filter((result) => result.status === 'rejected')
      .map((result) => (result as PromiseRejectedResult).reason)

    if (scopedFailures.some((error) => isSecondAuthRequiredError(error))) {
      markSecondAuthRequired()
    }

    const clients = getFulfilledValue(scopedResults[0]) || []
    const logs = getFulfilledValue(scopedResults[1]) || []
    const adminPayments = getFulfilledValue(scopedResults[2]) || []
    const paymentStats = calculatePaymentStats(clients)

    setState((prev) => ({
      ...prev,
      admins: admins ?? prev.admins,
      entreprises: entreprises ?? prev.entreprises,
      auditLogs: logs,
      adminPayments,
      paymentStats,
    }))
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
    void refresh()
  }, [canReadAdminScopedData, requiresSecondAuth])

  const handleCreateAdmin = async () => {
    const { newAdmin } = state
    if (!newAdmin.name || !newAdmin.entreprise) {
      setState((prev) => ({ ...prev, createError: 'Nom et entreprise requis.' }))
      return
    }
    const normalizedPhone = normalizePhone(newAdmin.phone || '')
    if (!normalizedPhone) {
      setState((prev) => ({ ...prev, createError: 'Téléphone requis.' }))
      return
    }
    setState((prev) => ({ ...prev, creating: true, createError: '' }))
    try {
      const createdAt = new Date().toISOString()
      const requestId = createEntityId('admin-request')
      const generatedUsername =
        newAdmin.username?.trim() ||
        normalizedPhone ||
        normalize(newAdmin.name).replace(/\s+/g, '') ||
        createEntityId('admin')
      const safePassword = newAdmin.password || 'admin123'

      const createdRequest = await createAdminRequest({
        id: requestId,
        name: newAdmin.name,
        email: newAdmin.email || undefined,
        phone: normalizedPhone,
        entrepriseName: newAdmin.entreprise || '',
        username: generatedUsername,
        password: safePassword,
        status: 'EN_ATTENTE',
        createdAt,
      })

      await updateAdminRequest(createdRequest.id, {
        status: 'ACTIF',
        username: generatedUsername,
        password: safePassword,
        email: newAdmin.email || undefined,
        phone: normalizedPhone,
        entrepriseName: newAdmin.entreprise || '',
        paid: true,
        paidAt: createdAt,
      })

      setState((prev) => ({
        ...prev,
        createdAdmin: {
          ...newAdmin,
          username: generatedUsername,
          createdAt,
          passwordManagedByAdmin: false,
        },
        newAdmin: {
          username: '',
          name: '',
          email: '',
          entreprise: '',
          password: '',
          phone: '',
        },
      }))
      if (typeof navigator === 'undefined' || navigator.onLine !== false) {
        refresh()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const normalized = String(message || '').toLowerCase()
      if (normalized.includes('seconde authentification super admin requise')) {
        markSecondAuthRequired()
        setState((prev) => ({
          ...prev,
          createError:
            'Seconde authentification requise. Veuillez valider la 2e authentification Super Admin puis réessayer.',
        }))
      } else {
        setState((prev) => ({ ...prev, createError: message || "Échec de la création de l'admin." }))
      }
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
      const updated = await updateAdminRequest(req.id, {
        status: 'ACTIF',
        username,
        email: req.email || undefined,
        phone: req.phone || undefined,
        entrepriseName: req.entrepriseName || '',
        paid: true,
        paidAt: new Date().toISOString(),
      })

      const createdAdmin: CreatedAdmin = {
        name: req.name,
        username,
        email: req.email || '',
        entreprise: req.entrepriseName || '',
        phone: req.phone || '',
        createdAt: new Date().toISOString(),
        passwordManagedByAdmin: true,
      }

      setState((prev) => ({
        ...prev,
        requests: prev.requests.map((r) => (r.id === req.id ? updated : r)),
        approveErrors: { ...prev.approveErrors, [req.id]: '' },
        createdAdmin,
        isCreateOpen: true,
      }))

      if (createdAdmin.phone) {
        const phone = formatPhoneForWhatsapp(createdAdmin.phone)
        if (phone) {
          const appUrl = `${window.location.origin}/login`
          const message = encodeURIComponent(buildCredentialsMessage(createdAdmin, appUrl))
          window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer')
        }
      }
      refresh()
    } catch (error) {
      if (isSecondAuthRequiredError(error)) {
        markSecondAuthRequired()
      }
      const message = error instanceof Error ? error.message : ''
      setState((prev) => ({
        ...prev,
        approveErrors: {
          ...prev.approveErrors,
          [req.id]: message || "Échec de validation de la demande.",
        },
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
    adminPayments: state.adminPayments,
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
