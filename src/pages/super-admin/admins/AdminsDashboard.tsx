import { useEffect, useMemo, useState } from 'react'
import { fetchAdmins, fetchEntreprises, updateAdmin } from '@/services/api'
import type { AdminDTO, EntrepriseDTO } from '@/dto/frontend/responses'
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
  permissions: typeof ADMIN_FEATURE_PERMISSION_DEFAULTS
}

const FEATURE_KEYS = Object.keys(ADMIN_FEATURE_PERMISSION_DEFAULTS) as Array<
  keyof typeof ADMIN_FEATURE_PERMISSION_DEFAULTS
>

const DEFAULT_MONTHLY_AMOUNT = 5000
const DEFAULT_ANNUAL_AMOUNT = 60000

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
    permissions: { ...ADMIN_FEATURE_PERMISSION_DEFAULTS },
  })
  const [savingSubscription, setSavingSubscription] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const [adminsData, entreprisesData] = await Promise.all([fetchAdmins(), fetchEntreprises()])
        if (!active) return
        setAdmins(adminsData)
        setEntreprises(entreprisesData)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

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
    setSubscriptionDraft(buildSubscriptionDraft(admin))
  }

  const closeSubscriptionDialog = () => {
    if (savingSubscription) return
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

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6 animate-fade-in">
      <SectionWrapper>
        <SuperAdminHeader
          onAddAdmin={() => {
            sessionStorage.setItem('superadminOpenCreate', 'true')
            navigate('/pmt/admin')
          }}
        />
      </SectionWrapper>

      <SectionWrapper>
        <div className="rounded-[28px] border border-[#121B53]/15 bg-gradient-to-br from-[#121B53] via-[#1A2A78] to-[#0B153D] px-6 py-5 text-white shadow-[0_28px_70px_rgba(10,16,48,0.45)]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Super Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">Liste des administrateurs</h1>
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
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Configurer abonnement et autorisations</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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

            <label className="flex items-center gap-2 text-sm text-[#121B53]">
              <input
                type="checkbox"
                checked={subscriptionDraft.allowCustomAmount}
                onChange={(event) =>
                  setSubscriptionDraft((prev) => ({
                    ...prev,
                    allowCustomAmount: event.target.checked,
                  }))
                }
              />
              Autoriser cet admin à saisir manuellement un montant différent
            </label>

            <div className="space-y-2 rounded-xl border border-[#121B53]/15 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
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
                  <label key={featureKey} className="flex items-center gap-2 rounded-md border border-[#121B53]/10 px-2 py-1.5 text-sm text-[#121B53]">
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

          <DialogFooter>
            <Button variant="outline" onClick={closeSubscriptionDialog} disabled={savingSubscription}>
              Fermer
            </Button>
            <Button
              onClick={saveSubscriptionConfig}
              disabled={savingSubscription}
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
