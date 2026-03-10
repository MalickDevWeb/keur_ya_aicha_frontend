import { useEffect, useMemo, useState } from 'react'
import {
  clearImpersonation as clearImpersonationApi,
  createAdminPayment,
  fetchAdminPayments,
  fetchAdmins,
  fetchEntreprises,
  setImpersonation as setImpersonationApi,
  updateAdmin,
  validateAdminPayment,
} from '@/services/api'
import type { AdminDTO, AdminPaymentDTO, EntrepriseDTO } from '@/dto/frontend/responses'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { useNavigate } from 'react-router-dom'
import { AdminsListSection } from './sections/AdminsListSection'
import { AdminsStatsSection } from './sections/AdminsStatsSection'
import type { AdminRow, ViewMode } from './types'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/contexts/ToastContext'
import {
  ADMIN_FEATURE_LABELS,
  ADMIN_FEATURE_PERMISSION_DEFAULTS,
  normalizeAdminFeaturePermissions,
} from '@/services/adminPermissions'

type AdminSubscriptionMode = 'monthly' | 'premium' | 'annual'

type SubscriptionDraft = {
  mode: AdminSubscriptionMode
  monthlyAmount: string
  annualAmount: string
  allowCustomAmount: boolean
  notifyClientsOverdue: boolean
  notifyAdminOverdue: boolean
  permissions: typeof ADMIN_FEATURE_PERMISSION_DEFAULTS
}

const FEATURE_KEYS = Object.keys(ADMIN_FEATURE_PERMISSION_DEFAULTS) as Array<
  keyof typeof ADMIN_FEATURE_PERMISSION_DEFAULTS
>

const DEFAULT_MONTHLY_AMOUNT = 5000
const DEFAULT_ANNUAL_AMOUNT = 60000

function getPaymentTimestamp(payment: AdminPaymentDTO): string {
  return String(payment.createdAt || payment.paidAt || '').trim()
}

function resolveLatestPendingPayment(
  payments: AdminPaymentDTO[],
  adminId: string
): AdminPaymentDTO | null {
  return (
    [...payments]
      .filter(
        (payment) =>
          payment.adminId === adminId && String(payment.status || '').trim().toLowerCase() === 'pending'
      )
      .sort((left, right) => getPaymentTimestamp(right).localeCompare(getPaymentTimestamp(left)))[0] ||
    null
  )
}

function buildSubscriptionDraft(admin: AdminDTO): SubscriptionDraft {
  const mode = String(admin.subscriptionMode || 'monthly').toLowerCase()
  const resolvedMode: AdminSubscriptionMode =
    mode === 'annual' || mode === 'premium' ? mode : 'monthly'
  const monthlyAmount = Number(admin.subscriptionMonthlyAmount || DEFAULT_MONTHLY_AMOUNT)
  const annualAmount = Number(admin.subscriptionAnnualAmount || DEFAULT_ANNUAL_AMOUNT)
  return {
    mode: resolvedMode,
    monthlyAmount: String(Number.isFinite(monthlyAmount) && monthlyAmount > 0 ? Math.round(monthlyAmount) : DEFAULT_MONTHLY_AMOUNT),
    annualAmount: String(Number.isFinite(annualAmount) && annualAmount > 0 ? Math.round(annualAmount) : DEFAULT_ANNUAL_AMOUNT),
    allowCustomAmount: Boolean(admin.subscriptionAllowCustomAmount),
    notifyClientsOverdue: Boolean(admin.notifyClientsOverdue),
    notifyAdminOverdue: Boolean(admin.notifyAdminOverdue),
    permissions: normalizeAdminFeaturePermissions(admin.permissions),
  }
}

export function AdminsDashboard() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [admins, setAdmins] = useState<AdminDTO[]>([])
  const [entreprises, setEntreprises] = useState<EntrepriseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [subscriptionTarget, setSubscriptionTarget] = useState<AdminDTO | null>(null)
  const [subscriptionDraft, setSubscriptionDraft] = useState<SubscriptionDraft>({
    mode: 'monthly',
    monthlyAmount: String(DEFAULT_MONTHLY_AMOUNT),
    annualAmount: String(DEFAULT_ANNUAL_AMOUNT),
    allowCustomAmount: false,
    notifyClientsOverdue: false,
    notifyAdminOverdue: false,
    permissions: { ...ADMIN_FEATURE_PERMISSION_DEFAULTS },
  })
  const [savingSubscription, setSavingSubscription] = useState(false)
  const [directPaymentAmount, setDirectPaymentAmount] = useState(String(DEFAULT_MONTHLY_AMOUNT))
  const [processingDirectPayment, setProcessingDirectPayment] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const [adminsData, entreprisesData] = await Promise.all([fetchAdmins(), fetchEntreprises()])
        if (!active) return
        setAdmins(adminsData)
        setEntreprises(entreprisesData)
      } catch {
        if (!active) return
        setAdmins([])
        setEntreprises([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!subscriptionTarget || subscriptionDraft.allowCustomAmount) return
    setDirectPaymentAmount(
      subscriptionDraft.mode === 'annual'
        ? subscriptionDraft.annualAmount
        : subscriptionDraft.monthlyAmount
    )
  }, [
    subscriptionDraft.allowCustomAmount,
    subscriptionDraft.annualAmount,
    subscriptionDraft.mode,
    subscriptionDraft.monthlyAmount,
    subscriptionTarget,
  ])

  const entrepriseByAdmin = useMemo(() => {
    const map = new Map<string, EntrepriseDTO[]>()
    entreprises.forEach((ent) => {
      if (!ent.adminId) return
      const list = map.get(ent.adminId) || []
      list.push(ent)
      map.set(ent.adminId, list)
    })
    return map
  }, [entreprises])

  const rows = useMemo<AdminRow[]>(() => {
    return admins.map((admin) => ({
      admin,
      entreprises: entrepriseByAdmin.get(admin.id) || [],
    }))
  }, [admins, entrepriseByAdmin])

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(({ admin, entreprises }) => {
      const name = String(admin.name || '').toLowerCase()
      const email = String(admin.email || '').toLowerCase()
      const status = String(admin.status || '').toLowerCase()
      const entNames = entreprises.map((e) => String(e.name || '').toLowerCase()).join(' ')
      return (
        name.includes(needle) ||
        email.includes(needle) ||
        status.includes(needle) ||
        entNames.includes(needle)
      )
    })
  }, [rows, search])

  const actifsCount = admins.filter((admin) => admin.status === 'ACTIF').length

  const setStatus = async (admin: AdminDTO, status: AdminDTO['status']) => {
    setBusyId(admin.id)
    try {
      const updated = await updateAdmin(admin.id, { status })
      setAdmins((prev) => prev.map((item) => (item.id === admin.id ? updated : item)))
    } finally {
      setBusyId(null)
    }
  }

  const openSubscriptionDialog = (admin: AdminDTO) => {
    setSubscriptionTarget(admin)
    const nextDraft = buildSubscriptionDraft(admin)
    setSubscriptionDraft(nextDraft)
    setDirectPaymentAmount(
      nextDraft.mode === 'annual' ? nextDraft.annualAmount : nextDraft.monthlyAmount
    )
  }

  const closeSubscriptionDialog = () => {
    if (savingSubscription || processingDirectPayment) return
    setSubscriptionTarget(null)
  }

  const saveSubscriptionConfig = async () => {
    if (!subscriptionTarget) return

    const monthlyAmount = Number(subscriptionDraft.monthlyAmount)
    const annualAmount = Number(subscriptionDraft.annualAmount)
    if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0) {
      addToast({
        type: 'error',
        title: 'Montant invalide',
        message: 'Le montant mensuel doit être supérieur à 0.',
      })
      return
    }
    if (!Number.isFinite(annualAmount) || annualAmount <= 0) {
      addToast({
        type: 'error',
        title: 'Montant invalide',
        message: 'Le montant annuel doit être supérieur à 0.',
      })
      return
    }

    setSavingSubscription(true)
    try {
      const updated = await updateAdmin(subscriptionTarget.id, {
        subscriptionMode: subscriptionDraft.mode,
        subscriptionMonthlyAmount: Math.round(monthlyAmount),
        subscriptionAnnualAmount: Math.round(annualAmount),
        subscriptionAllowCustomAmount: subscriptionDraft.allowCustomAmount,
        notifyClientsOverdue: subscriptionDraft.notifyClientsOverdue,
        notifyAdminOverdue: subscriptionDraft.notifyAdminOverdue,
        permissions: subscriptionDraft.permissions,
      })
      setAdmins((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setSubscriptionTarget(updated)
      setSubscriptionDraft(buildSubscriptionDraft(updated))
      addToast({
        type: 'success',
        title: 'Abonnement mis à jour',
        message: `Configuration enregistrée pour ${updated.name || updated.username}.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'enregistrer la configuration d'abonnement."
      addToast({ type: 'error', title: 'Erreur', message })
    } finally {
      setSavingSubscription(false)
    }
  }

  const paySubscriptionDirectly = async () => {
    if (!subscriptionTarget?.id || !subscriptionTarget.userId) return

    const fallbackAmount =
      subscriptionDraft.mode === 'annual'
        ? Number(subscriptionDraft.annualAmount)
        : Number(subscriptionDraft.monthlyAmount)
    const typedAmount = Number(directPaymentAmount)
    const amountToSend = subscriptionDraft.allowCustomAmount
      ? typedAmount
      : fallbackAmount

    if (!Number.isFinite(amountToSend) || amountToSend <= 0) {
      addToast({
        type: 'error',
        title: 'Montant invalide',
        message: 'Le montant du paiement doit être supérieur à 0.',
      })
      return
    }

    setProcessingDirectPayment(true)
    try {
      await setImpersonationApi({
        adminId: subscriptionTarget.id,
        adminName: subscriptionTarget.name || subscriptionTarget.username || 'Admin',
        userId: subscriptionTarget.userId,
      })

      const pendingPayment = resolveLatestPendingPayment(
        await fetchAdminPayments(),
        subscriptionTarget.id
      )

      if (pendingPayment?.id) {
        await validateAdminPayment(
          pendingPayment.id,
          'Paiement Mobile Money valide par Super Admin depuis la supervision.'
        )
        addToast({
          type: 'success',
          title: 'Paiement valide',
          message: `Le paiement en attente de ${subscriptionTarget.name || subscriptionTarget.username} a été validé et appliqué.`,
        })
        return
      }

      const now = new Date().toISOString()
      await createAdminPayment({
        id: crypto.randomUUID(),
        adminId: subscriptionTarget.id,
        entrepriseId: subscriptionTarget.entrepriseId || '',
        amount: Math.round(amountToSend),
        method: 'cash',
        provider: 'manual',
        note: 'Paiement direct valide par Super Admin depuis la supervision.',
        paidAt: now,
        createdAt: now,
      })

      addToast({
        type: 'success',
        title: 'Paiement applique',
        message: `L’abonnement de ${subscriptionTarget.name || subscriptionTarget.username} est maintenant a jour.`,
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
      setProcessingDirectPayment(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4 animate-fade-in sm:space-y-6 sm:px-4 sm:py-6 lg:px-6">
      <SectionWrapper>
        <SuperAdminHeader
          onAddAdmin={() => {
            sessionStorage.setItem('superadminOpenCreate', 'true')
            navigate('/pmt/admin')
          }}
        />
      </SectionWrapper>

      <SectionWrapper>
        <div className="rounded-[24px] border border-[#121B53]/15 bg-[#121B53] px-4 py-4 text-white shadow-[0_28px_70px_rgba(10,16,48,0.45)] sm:rounded-[28px] sm:px-6 sm:py-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Super Admin</p>
          <h1 className="mt-2 text-xl font-semibold sm:text-2xl">Liste des administrateurs</h1>
          <p className="mt-1 text-sm text-white/70">Gérez les statuts, accès et entreprises associées.</p>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <AdminsStatsSection
          adminsCount={admins.length}
          entreprisesCount={entreprises.length}
          actifsCount={actifsCount}
        />
      </SectionWrapper>

      <SectionWrapper>
        <AdminsListSection
          rows={filteredRows}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          busyId={busyId}
          onSetStatus={setStatus}
          onConfigureSubscription={openSubscriptionDialog}
        />
      </SectionWrapper>

      <Dialog open={Boolean(subscriptionTarget)} onOpenChange={(open) => !open && closeSubscriptionDialog()}>
        <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto p-4 sm:max-h-[calc(100dvh-2rem)] sm:max-w-[560px] sm:p-6">
          <DialogHeader>
            <DialogTitle>Configurer abonnement et autorisations</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-xl border border-[#121B53]/15 bg-[#F7F9FF] p-3 text-sm text-[#121B53]">
              <p className="font-semibold">{subscriptionTarget?.name || subscriptionTarget?.username || 'Admin'}</p>
              <p className="text-xs text-[#121B53]/70">Le montant sera prérempli côté admin selon ce plan.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[#121B53]">Mode d’abonnement</label>
              <select
                value={subscriptionDraft.mode}
                onChange={(event) =>
                  setSubscriptionDraft((prev) => ({
                    ...prev,
                    mode: event.target.value as AdminSubscriptionMode,
                  }))
                }
                className="h-10 w-full rounded-md border border-[#121B53]/20 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#121B53]/20"
              >
                <option value="monthly">Mensuel</option>
                <option value="premium">Premium</option>
                <option value="annual">Annuel (total année)</option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#121B53]">Montant mensuel (FCFA)</label>
                <Input
                  value={subscriptionDraft.monthlyAmount}
                  onChange={(event) =>
                    setSubscriptionDraft((prev) => ({
                      ...prev,
                      monthlyAmount: event.target.value.replace(/[^\d]/g, ''),
                    }))
                  }
                  placeholder="Ex: 5000"
                  className="border-[#121B53]/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#121B53]">Montant annuel (FCFA)</label>
                <Input
                  value={subscriptionDraft.annualAmount}
                  onChange={(event) =>
                    setSubscriptionDraft((prev) => ({
                      ...prev,
                      annualAmount: event.target.value.replace(/[^\d]/g, ''),
                    }))
                  }
                  placeholder="Ex: 60000"
                  className="border-[#121B53]/20"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm leading-5 text-[#121B53]">
              <input
                type="checkbox"
                checked={subscriptionDraft.allowCustomAmount}
                onChange={(event) =>
                  setSubscriptionDraft((prev) => ({
                    ...prev,
                    allowCustomAmount: event.target.checked,
                  }))
                }
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              Autoriser cet admin à saisir manuellement un montant différent
            </label>

            <div className="space-y-3 rounded-xl border border-[#121B53]/15 bg-[#F7F9FF] p-3 sm:p-4">
              <div>
                <p className="text-sm font-medium text-[#121B53]">Paiement direct Super Admin</p>
                <p className="text-xs text-[#121B53]/70">
                  Valide immédiatement l’abonnement côté backend et débloque l’application si
                  le compte était en retard.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-[#121B53]">Montant a appliquer (FCFA)</label>
                  <Input
                    value={directPaymentAmount}
                    onChange={(event) => {
                      if (!subscriptionDraft.allowCustomAmount) return
                      setDirectPaymentAmount(event.target.value.replace(/[^\d]/g, ''))
                    }}
                    disabled={!subscriptionDraft.allowCustomAmount || processingDirectPayment}
                    className="border-[#121B53]/20"
                  />
                  <p className="text-xs text-[#121B53]/65">
                    {subscriptionDraft.allowCustomAmount
                      ? 'Le Super Admin peut saisir un montant manuel pour cet admin.'
                      : 'Montant verrouille: la valeur definie par le plan sera appliquee automatiquement.'}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={paySubscriptionDirectly}
                  disabled={processingDirectPayment}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {processingDirectPayment ? 'Paiement...' : 'Payer / Valider'}
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-[#121B53]/15 bg-white p-3 sm:p-4">
              <p className="text-sm font-medium text-[#121B53]">Notifications retards de paiement</p>
              <label className="flex items-start gap-2 text-sm text-[#121B53]">
                <input
                  type="checkbox"
                  checked={subscriptionDraft.notifyClientsOverdue}
                  onChange={(e) =>
                    setSubscriptionDraft((prev) => ({
                      ...prev,
                      notifyClientsOverdue: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                Autoriser l'envoi aux clients de cet admin en cas de retard.
              </label>
              <label className="flex items-start gap-2 text-sm text-[#121B53]">
                <input
                  type="checkbox"
                  checked={subscriptionDraft.notifyAdminOverdue}
                  onChange={(e) =>
                    setSubscriptionDraft((prev) => ({
                      ...prev,
                      notifyAdminOverdue: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                Envoyer aussi à l'admin (rappel interne) en cas de retard client.
              </label>
              <p className="text-xs text-[#121B53]/65">
                Si l'admin est suspendu ou impayé, aucun email client/admin n'est envoyé (super admin restera notifié).
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-[#121B53]/15 bg-white p-3 sm:p-4">
              <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <p className="text-sm font-medium text-[#121B53]">Fonctionnalités autorisées</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSubscriptionDraft((prev) => ({
                        ...prev,
                        permissions: { ...ADMIN_FEATURE_PERMISSION_DEFAULTS },
                      }))
                    }
                  >
                    Tout autoriser
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSubscriptionDraft((prev) => ({
                        ...prev,
                        permissions: FEATURE_KEYS.reduce((acc, key) => {
                          acc[key] = false
                          return acc
                        }, { ...prev.permissions }),
                      }))
                    }
                  >
                    Tout bloquer
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {FEATURE_KEYS.map((featureKey) => (
                  <label
                    key={featureKey}
                    className="flex items-start gap-2 rounded-md border border-[#121B53]/10 px-2 py-1.5 text-sm leading-5 text-[#121B53]"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(subscriptionDraft.permissions[featureKey])}
                      onChange={(event) =>
                        setSubscriptionDraft((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            [featureKey]: event.target.checked,
                          },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    {ADMIN_FEATURE_LABELS[featureKey]}
                  </label>
                ))}
              </div>
              <p className="text-xs text-[#121B53]/65">
                Le Super Admin peut activer/désactiver chaque module: notifications, imports, export PDF, etc.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-[#121B53]/10 pt-3 sm:pt-4">
            <Button
              variant="outline"
              onClick={closeSubscriptionDialog}
              disabled={savingSubscription || processingDirectPayment}
            >
              Fermer
            </Button>
            <Button
              onClick={saveSubscriptionConfig}
              disabled={savingSubscription || processingDirectPayment}
              className="bg-[#121B53] text-white hover:bg-[#0B153D]"
            >
              {savingSubscription ? 'Enregistrement...' : 'Enregistrer la configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
