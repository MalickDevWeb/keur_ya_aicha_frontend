import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createAdminPayment, fetchAdminPayments, getAdmin, getAdminPaymentStatus, listUndoActions, rollbackUndoAction } from '@/services/api'
import type { AdminDTO, AdminPaymentDTO, AdminPaymentStatusDTO } from '@/dto/frontend/responses'
import { formatCurrency } from '@/lib/types'
import { Banknote, Landmark, Loader2, RotateCcw, Smartphone } from 'lucide-react'

const getMonthKey = (value: Date | string) => String(value).slice(0, 7)
const UNDO_RESOURCE = 'admin_payments'

type UndoEventDetail = {
  id?: string
  expiresAt?: string | null
  resource?: string
}

const PAYMENT_METHOD_OPTIONS: Array<{
  id: AdminPaymentDTO['method']
  label: string
  hint: string
  icon: typeof Smartphone
  badge: string
  selectedClass: string
  unselectedClass: string
  iconClass: string
  badgeClass: string
  titleClass: string
  hintClass: string
}> = [
  {
    id: 'wave',
    label: 'Wave',
    hint: 'Paiement mobile instantané',
    icon: Smartphone,
    badge: 'WAVE',
    selectedClass: 'border-[#00AEEF] bg-gradient-to-r from-[#E7F9FF] via-[#D8F4FF] to-[#CBEEFF] shadow-[0_10px_24px_rgba(0,174,239,0.22)]',
    unselectedClass: 'border-[#00AEEF]/25 bg-white hover:border-[#00AEEF]/55 hover:bg-[#F4FCFF]',
    iconClass: 'bg-[#00AEEF]/12 text-[#008BC2]',
    badgeClass: 'bg-[#00AEEF] text-white',
    titleClass: 'text-[#006E9A]',
    hintClass: 'text-[#2C7D9F]',
  },
  {
    id: 'orange_money',
    label: 'Orange Money',
    hint: 'Paiement via OM',
    icon: Landmark,
    badge: 'OM',
    selectedClass: 'border-[#FF7900] bg-gradient-to-r from-[#FFF2E7] via-[#FFE8D1] to-[#FFDFBF] shadow-[0_10px_24px_rgba(255,121,0,0.2)]',
    unselectedClass: 'border-[#FF7900]/25 bg-white hover:border-[#FF7900]/55 hover:bg-[#FFF8F1]',
    iconClass: 'bg-[#FF7900]/12 text-[#D16300]',
    badgeClass: 'bg-[#FF7900] text-black',
    titleClass: 'text-[#B85600]',
    hintClass: 'text-[#B56A2C]',
  },
  {
    id: 'cash',
    label: 'Espèces',
    hint: 'Validation manuelle Super Admin',
    icon: Banknote,
    badge: 'CASH',
    selectedClass: 'border-[#121B53] bg-gradient-to-r from-[#EEF2FF] via-[#E6ECFF] to-[#DEE7FF] shadow-[0_10px_24px_rgba(18,27,83,0.2)]',
    unselectedClass: 'border-[#121B53]/15 bg-white hover:border-[#121B53]/40 hover:bg-[#F8FAFF]',
    iconClass: 'bg-[#121B53]/10 text-[#121B53]',
    badgeClass: 'bg-[#121B53] text-white',
    titleClass: 'text-[#121B53]',
    hintClass: 'text-[#50619A]',
  },
]

export default function AdminSubscriptionPayments() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [admin, setAdmin] = useState<AdminDTO | null>(null)
  const [payments, setPayments] = useState<AdminPaymentDTO[]>([])
  const [subscriptionStatus, setSubscriptionStatus] = useState<AdminPaymentStatusDTO | null>(null)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<AdminPaymentDTO['method']>('wave')
  const [payerPhone, setPayerPhone] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [latestUndoId, setLatestUndoId] = useState<string | null>(null)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const userRole = String(user?.role || '').toUpperCase()
  const canValidateCash = userRole === 'SUPER_ADMIN'
  const visiblePaymentMethods = useMemo(
    () =>
      canValidateCash
        ? PAYMENT_METHOD_OPTIONS.filter((method) => method.id === 'cash')
        : PAYMENT_METHOD_OPTIONS,
    [canValidateCash]
  )

  const currentMonth = useMemo(() => getMonthKey(new Date().toISOString()), [])

  const resolveLatestUndoId = async () => {
    const actions = await listUndoActions(20)
    const latest = actions.find(
      (entry) =>
        entry.resource === UNDO_RESOURCE &&
        new Date(entry.expiresAt).getTime() > Date.now()
    )
    return latest?.id || null
  }

  const refreshUndoAvailability = async () => {
    try {
      const undoId = await resolveLatestUndoId()
      setLatestUndoId(undoId)
    } catch {
      setLatestUndoId(null)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!user?.id) return
      setLoading(true)
      try {
        const [adminData, paymentsData, statusData, undoId] = await Promise.all([
          getAdmin(user.id),
          fetchAdminPayments(),
          getAdminPaymentStatus(),
          resolveLatestUndoId(),
        ])
        if (!active) return
        const sorted = [...paymentsData].sort((a, b) => String(b.paidAt || '').localeCompare(String(a.paidAt || '')))
        setAdmin(adminData)
        setPayments(sorted)
        setSubscriptionStatus(statusData)
        setLatestUndoId(undoId)
        setAmount((prev) => prev || (sorted[0]?.amount ? String(sorted[0].amount) : prev))
      } catch {
        if (!active) return
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [user?.id])

  useEffect(() => {
    const onUndoAvailable = (event: Event) => {
      const detail = (event as CustomEvent<UndoEventDetail>).detail
      if (!detail?.id) return
      if (detail.expiresAt && new Date(detail.expiresAt).getTime() <= Date.now()) return
      if (detail.resource === UNDO_RESOURCE) {
        setLatestUndoId(detail.id)
      }
    }

    window.addEventListener('api-undo-available', onUndoAvailable)
    return () => {
      window.removeEventListener('api-undo-available', onUndoAvailable)
    }
  }, [])

  const requiredMonth = subscriptionStatus?.requiredMonth || currentMonth
  const paidRequiredMonth = payments.some((payment) => payment.month === requiredMonth)
  const blockedBySystem = Boolean(subscriptionStatus?.blocked)
  const lastPayment = payments[0]
  const dueDateLabel = subscriptionStatus?.dueAt ? new Date(subscriptionStatus.dueAt).toLocaleDateString('fr-FR') : null

  useEffect(() => {
    if (canValidateCash && paymentMethod !== 'cash') {
      setPaymentMethod('cash')
      return
    }
    if (!canValidateCash && paymentMethod === 'cash') {
      setPaymentMethod('wave')
    }
  }, [canValidateCash, paymentMethod])

  const handlePay = async () => {
    if (!user?.id) return
    const numericAmount = Number(amount)
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      addToast({
        type: 'error',
        title: 'Montant invalide',
        message: 'Veuillez saisir un montant correct.',
      })
      return
    }
    if (paymentMethod === 'cash' && !canValidateCash) {
      addToast({
        type: 'error',
        title: 'Action non autorisée',
        message: 'Le paiement espèces doit être validé par un Super Admin.',
      })
      return
    }
    if (paymentMethod !== 'cash' && !payerPhone.trim()) {
      addToast({
        type: 'error',
        title: 'Numéro requis',
        message: 'Saisissez le numéro lié à Wave ou Orange Money.',
      })
      return
    }
    setPaying(true)
    try {
      const paidAt = new Date().toISOString()
      const provider =
        paymentMethod === 'wave'
          ? 'wave'
          : paymentMethod === 'orange_money'
          ? 'orange'
          : 'manual'
      const payment = await createAdminPayment({
        id: crypto.randomUUID(),
        adminId: user.id,
        entrepriseId: admin?.entrepriseId || '',
        amount: numericAmount,
        method: paymentMethod,
        provider,
        payerPhone: payerPhone.trim(),
        transactionRef: '',
        note: note.trim(),
        paidAt,
        month: requiredMonth,
        createdAt: paidAt,
      })
      setPayments((prev) => [payment, ...prev])
      const freshStatus = await getAdminPaymentStatus()
      setSubscriptionStatus(freshStatus)
      await refreshUndoAvailability()
      setNote('')
      if (payment?.status === 'pending' && payment?.checkoutUrl) {
        window.open(payment.checkoutUrl, '_blank', 'noopener,noreferrer')
      }
      addToast({
        type: payment?.status === 'pending' ? 'info' : 'success',
        title: payment?.status === 'pending' ? 'Paiement initié' : 'Paiement enregistré',
        message:
          payment?.status === 'pending'
            ? `Paiement ${paymentMethod === 'wave' ? 'Wave' : 'Orange Money'} en attente de confirmation provider.`
            : paymentMethod === 'cash'
            ? 'Paiement espèces enregistré. Accès mis à jour.'
            : `Paiement ${paymentMethod === 'wave' ? 'Wave' : 'Orange Money'} confirmé.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'enregistrer le paiement."
      addToast({
        type: 'error',
        title: 'Erreur',
        message,
      })
    } finally {
      setPaying(false)
    }
  }

  const handleRollbackLastPayment = async () => {
    if (isRollingBack) return
    try {
      setIsRollingBack(true)
      let undoId = latestUndoId
      if (!undoId) {
        undoId = await resolveLatestUndoId()
        if (!undoId) {
          throw new Error('Aucune action récente à annuler (fenêtre de 2 mois).')
        }
        setLatestUndoId(undoId)
      }

      await rollbackUndoAction(undoId)
      const [paymentsData, statusData] = await Promise.all([fetchAdminPayments(), getAdminPaymentStatus()])
      const sorted = [...paymentsData].sort((a, b) => String(b.paidAt || '').localeCompare(String(a.paidAt || '')))
      setPayments(sorted)
      setSubscriptionStatus(statusData)
      await refreshUndoAvailability()
      addToast({
        type: 'success',
        title: 'Rollback effectué',
        message: 'Le dernier paiement a été annulé.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Rollback impossible.'
      addToast({
        type: 'error',
        title: 'Rollback impossible',
        message,
      })
      if (message.toLowerCase().includes('expir')) {
        setLatestUndoId(null)
      }
    } finally {
      setIsRollingBack(false)
    }
  }

  return (
    <main className="h-full max-w-4xl mx-auto w-full overflow-hidden px-3 md:px-4 lg:px-5 py-2 md:py-3 animate-fade-in">
      <Card className="h-full border-[#121B53]/15 bg-white/90 shadow-[0_18px_45px_rgba(12,18,60,0.12)]">
        <CardHeader className="space-y-0.5 pb-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[#121B53]/60">Abonnement Admin</p>
          <CardTitle className="text-2xl text-[#121B53]">Paiement mensuel</CardTitle>
          <p className="text-sm text-muted-foreground">
            Paiement avant la fin du mois + {subscriptionStatus?.graceDays || 5} jours. Passé ce délai, l’accès est limité à cet écran.
          </p>
        </CardHeader>
        <CardContent className="h-full space-y-3 overflow-hidden pb-3">
          {blockedBySystem ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-700">
                Accès limité: abonnement en retard ({subscriptionStatus?.overdueMonth || requiredMonth})
              </p>
              <p className="text-xs text-rose-600 mt-1">
                {dueDateLabel ? `Date limite dépassée: ${dueDateLabel}.` : 'Date limite dépassée.'} Paiement requis pour débloquer le compte.
              </p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#121B53]/10 bg-[#F7F9FF] p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#121B53]/50">Statut du mois</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge className={paidRequiredMonth ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'}>
                  {paidRequiredMonth ? 'Payé' : 'Non payé'}
                </Badge>
                <span className="text-xs text-muted-foreground">{requiredMonth}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-[#121B53]/10 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#121B53]/50">Dernier paiement</p>
              <p className="mt-2 text-sm font-semibold text-[#121B53]">
                {lastPayment?.paidAt ? new Date(lastPayment.paidAt).toLocaleDateString('fr-FR') : '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                {lastPayment?.amount
                  ? `${formatCurrency(lastPayment.amount)} FCFA • ${lastPayment.method === 'wave' ? 'Wave' : lastPayment.method === 'orange_money' ? 'Orange Money' : 'Espèces'}`
                  : 'Aucun paiement enregistré'}
              </p>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {visiblePaymentMethods.map((method) => {
              const Icon = method.icon
              const selected = paymentMethod === method.id
              const cashDisabled = method.id === 'cash' && !canValidateCash
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => {
                    if (cashDisabled) return
                    setPaymentMethod(method.id)
                  }}
                  disabled={cashDisabled}
                  className={`group relative overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                    selected ? method.selectedClass : method.unselectedClass
                  } ${cashDisabled ? 'cursor-not-allowed opacity-45' : ''}`}
                >
                  <div className="absolute -right-6 -top-8 h-16 w-16 rounded-full bg-white/30 transition-transform duration-300 group-hover:scale-110" />
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${method.iconClass}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className={`font-semibold ${method.titleClass}`}>{method.label}</span>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-extrabold tracking-[0.16em] ${method.badgeClass}`}>
                      {method.badge}
                    </span>
                  </div>
                  <p className={`relative z-10 mt-2 text-xs ${method.hintClass}`}>
                    {cashDisabled ? 'Validation espèces uniquement par Super Admin' : method.hint}
                  </p>
                </button>
              )
            })}
          </div>

          {paymentMethod !== 'cash' ? (
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#121B53]">Numéro Mobile Money</label>
              <Input
                value={payerPhone}
                onChange={(e) => setPayerPhone(e.target.value)}
                placeholder="Ex: +221771234567"
                className="border-[#121B53]/20"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Paiement espèces: validation directe uniquement par Super Admin.
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#121B53]">Note espèces (optionnel)</label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: Paiement reçu au bureau"
                  className="border-[#121B53]/20"
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#121B53]">Montant mensuel (FCFA)</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="Ex: 5000"
                className="border-[#121B53]/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePay}
                disabled={paying || paidRequiredMonth || (paymentMethod === 'cash' && !canValidateCash)}
                className="h-11 bg-[#121B53] text-white hover:bg-[#0B153D]"
              >
                {paidRequiredMonth
                  ? 'Déjà payé'
                  : paying
                  ? 'Traitement...'
                  : paymentMethod === 'wave'
                  ? 'Payer via Wave'
                  : paymentMethod === 'orange_money'
                  ? 'Payer via Orange Money'
                  : 'Valider paiement espèces'}
              </Button>
              {(paidRequiredMonth || !!latestUndoId || isRollingBack) && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-11 w-11 border-[#121B53]/20"
                  title="Annuler la dernière action de paiement"
                  onClick={handleRollbackLastPayment}
                  disabled={isRollingBack}
                >
                  {isRollingBack ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#121B53]/10 bg-white p-3">
            <p className="text-sm font-semibold text-[#121B53]">Historique des paiements</p>
            {loading ? (
              <p className="text-sm text-muted-foreground mt-3">Chargement...</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-3">Aucun paiement enregistré.</p>
            ) : (
              <ul className="mt-3 max-h-28 space-y-2 overflow-y-auto pr-1 text-sm">
                {payments.slice(0, 6).map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between rounded-xl border border-[#121B53]/10 bg-[#F7F9FF] px-3 py-2"
                  >
                    <span className="text-[#121B53]">
                      {payment.month} • {payment.method === 'wave' ? 'Wave' : payment.method === 'orange_money' ? 'Orange Money' : 'Espèces'}
                      {payment.status === 'pending' ? ' • En attente' : ''}
                    </span>
                    <span className="font-semibold text-[#121B53]">{formatCurrency(payment.amount)} FCFA</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
