import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import {
  clearImpersonation as clearImpersonationApi,
  createAdminPayment,
  fetchAdminPayments,
  fetchAdmins,
  fetchAdminRequests,
  fetchEntreprises,
  setImpersonation as setImpersonationApi,
  validateAdminPayment,
} from '@/services/api'
import type { AdminDTO, AdminPaymentDTO, AdminRequestDTO, EntrepriseDTO } from '@/dto/frontend/responses'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { EntreprisesListSection } from './sections/EntreprisesListSection'
import { EntreprisesStatsSection } from './sections/EntreprisesStatsSection'
import type { EntrepriseRow, ViewMode } from './types'

export function EntreprisesDashboard() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { user, impersonation, setImpersonation } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const canReadAdminScopedData = role !== 'SUPER_ADMIN' || Boolean(impersonation?.adminId)
  const [entreprises, setEntreprises] = useState<EntrepriseDTO[]>([])
  const [admins, setAdmins] = useState<AdminDTO[]>([])
  const [requests, setRequests] = useState<AdminRequestDTO[]>([])
  const [adminPayments, setAdminPayments] = useState<AdminPaymentDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [enteringId, setEnteringId] = useState<string | null>(null)
  const [payingAdminId, setPayingAdminId] = useState<string | null>(null)
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const [entreprisesResult, adminsResult, requestsResult] = await Promise.allSettled([
          fetchEntreprises(),
          fetchAdmins(),
          fetchAdminRequests(),
        ])
        const adminPaymentsResult = canReadAdminScopedData
          ? await Promise.allSettled([fetchAdminPayments()])
          : null
        if (!active) return
        setEntreprises(entreprisesResult.status === 'fulfilled' ? entreprisesResult.value : [])
        setAdmins(adminsResult.status === 'fulfilled' ? adminsResult.value : [])
        setRequests(requestsResult.status === 'fulfilled' ? requestsResult.value : [])
        setAdminPayments(
          adminPaymentsResult?.[0]?.status === 'fulfilled' ? adminPaymentsResult[0].value : []
        )
      } catch {
        if (!active) return
        setEntreprises([])
        setAdmins([])
        setRequests([])
        setAdminPayments([])
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [canReadAdminScopedData])

  const adminsById = useMemo(() => {
    const map = new Map<string, AdminDTO>()
    admins.forEach((admin) => map.set(admin.id, admin))
    return map
  }, [admins])

  const requestsById = useMemo(() => {
    const map = new Map<string, AdminRequestDTO>()
    requests.forEach((request) => map.set(request.id, request))
    return map
  }, [requests])

  const requestsByEntreprise = useMemo(() => {
    const map = new Map<string, AdminRequestDTO>()
    requests.forEach((request) => {
      const key = String(request.entrepriseName || '').trim().toLowerCase()
      if (key) {
        map.set(key, request)
      }
    })
    return map
  }, [requests])

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), [])

  const isSettledPayment = (payment: AdminPaymentDTO) => {
    const status = String(payment.status || '').trim().toLowerCase()
    return status === 'paid' || status === 'success' || status === 'succeeded'
  }

  const getPaymentTimestamp = (payment: AdminPaymentDTO) =>
    String(payment.createdAt || payment.paidAt || '').trim()

  const resolveLatestPendingPayment = (payments: AdminPaymentDTO[], adminId: string) =>
    [...payments]
      .filter(
        (payment) =>
          payment.adminId === adminId && String(payment.status || '').trim().toLowerCase() === 'pending'
      )
      .sort((left, right) => getPaymentTimestamp(right).localeCompare(getPaymentTimestamp(left)))[0] ||
    null

  const paymentsByAdmin = useMemo(() => {
    const map = new Map<string, AdminPaymentDTO[]>()
    adminPayments.forEach((payment) => {
      const list = map.get(payment.adminId) || []
      list.push(payment)
      map.set(payment.adminId, list)
    })
    map.forEach((list, key) => {
      map.set(
        key,
        [...list].sort((a, b) => String(b.paidAt || '').localeCompare(String(a.paidAt || '')))
      )
    })
    return map
  }, [adminPayments])

  const isAdminPaidThisMonth = (adminId?: string) => {
    if (!adminId) return false
    return (paymentsByAdmin.get(adminId) || []).some(
      (payment) => payment.month === currentMonth && isSettledPayment(payment)
    )
  }

  const getLastPaidAt = (adminId?: string) => {
    if (!adminId) return null
    return (paymentsByAdmin.get(adminId) || []).find((payment) => isSettledPayment(payment))?.paidAt || null
  }

  const rows = useMemo<EntrepriseRow[]>(() => {
    return entreprises.map((entreprise) => ({
      entreprise,
      admin: adminsById.get(entreprise.adminId || ''),
      request:
        requestsById.get(adminsById.get(entreprise.adminId || '')?.adminRequestId || '') ||
        requestsByEntreprise.get(String(entreprise.name || '').trim().toLowerCase()),
    }))
  }, [entreprises, adminsById, requestsById, requestsByEntreprise])

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(({ entreprise, admin }) => {
      const name = String(entreprise.name || '').toLowerCase()
      const id = String(entreprise.id || '').toLowerCase()
      const adminName = String(admin?.name || '').toLowerCase()
      return name.includes(needle) || id.includes(needle) || adminName.includes(needle)
    })
  }, [rows, search])

  const handleEnterAdmin = async (admin?: AdminDTO) => {
    if (!admin) return
    const adminName = admin.name?.trim() || admin.username?.trim() || ''
    if (!admin.id || !adminName) return
    setEnteringId(admin.id)
    try {
      await setImpersonation({ adminId: admin.id, adminName, userId: admin.userId })
      navigate('/dashboard')
    } finally {
      setEnteringId(null)
    }
  }

  const handlePaySubscription = async (admin?: AdminDTO, amount?: number) => {
    if (!admin?.id || !admin.userId) return
    const safeAmount = Math.round(Number(amount) || 0)
    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      addToast({
        type: 'error',
        title: 'Montant invalide',
        message: 'Le montant du paiement doit etre superieur a 0.',
      })
      return
    }

    setPayingAdminId(admin.id)
    try {
      await setImpersonationApi({
        adminId: admin.id,
        adminName: admin.name || admin.username || 'Admin',
        userId: admin.userId,
      })

      const pendingPayment = resolveLatestPendingPayment(await fetchAdminPayments(), admin.id)
      if (pendingPayment?.id) {
        const validatedPayment = await validateAdminPayment(
          pendingPayment.id,
          'Paiement Mobile Money valide par Super Admin depuis la liste entreprises.'
        )

        setAdminPayments((prev) =>
          (prev.some((payment) => payment.id === validatedPayment.id)
            ? prev.map((payment) => (payment.id === validatedPayment.id ? validatedPayment : payment))
            : [validatedPayment, ...prev]
          ).sort((left, right) =>
            String(right.paidAt || right.createdAt || '').localeCompare(
              String(left.paidAt || left.createdAt || '')
            )
          )
        )

        addToast({
          type: 'success',
          title: 'Paiement valide',
          message: `Le paiement en attente de ${admin.name || admin.username} a été validé et appliqué.`,
        })
        return
      }

      const now = new Date().toISOString()
      const payment = await createAdminPayment({
        id: crypto.randomUUID(),
        adminId: admin.id,
        entrepriseId: admin.entrepriseId || '',
        amount: safeAmount,
        method: 'cash',
        provider: 'manual',
        note: 'Paiement direct valide par Super Admin depuis la liste entreprises.',
        paidAt: now,
        createdAt: now,
      })

      setAdminPayments((prev) =>
        [payment, ...prev].sort((a, b) => String(b.paidAt || '').localeCompare(String(a.paidAt || '')))
      )

      addToast({
        type: 'success',
        title: 'Paiement applique',
        message: `L’abonnement de ${admin.name || admin.username} est maintenant a jour.`,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Impossible de valider ce paiement admin.'
      addToast({
        type: 'error',
        title: 'Paiement impossible',
        message,
      })
    } finally {
      try {
        await clearImpersonationApi()
      } catch {
        // best effort cleanup
      }
      setPayingAdminId(null)
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4 animate-fade-in sm:space-y-6 sm:px-4 sm:py-6 lg:px-6">
      <SectionWrapper>
        <SuperAdminHeader />
      </SectionWrapper>

      <SectionWrapper>
        <EntreprisesStatsSection entreprisesCount={entreprises.length} adminsCount={admins.length} />
      </SectionWrapper>

      <SectionWrapper>
        <EntreprisesListSection
          rows={filteredRows}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          enteringId={enteringId}
          onEnterAdmin={handleEnterAdmin}
          isAdminPaidThisMonth={isAdminPaidThisMonth}
          getLastPaidAt={getLastPaidAt}
          payingAdminId={payingAdminId}
          onPaySubscription={handlePaySubscription}
          selectedEntrepriseId={selectedEntrepriseId}
          onSelectEntreprise={setSelectedEntrepriseId}
          noResultsLabel={t('clients.noResults')}
        />
      </SectionWrapper>
    </main>
  )
}
