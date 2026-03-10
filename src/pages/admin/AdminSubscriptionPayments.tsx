import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createAdminPayment, fetchAdminPayments, getAdmin, getAdminPaymentStatus, listUndoActions, rollbackUndoAction } from '@/services/api'
import type { AdminDTO, AdminPaymentDTO, AdminPaymentStatusDTO } from '@/dto/frontend/responses'
import { formatCurrency } from '@/lib/types'
import { ArrowUpRight, Banknote, Landmark, Loader2, RotateCcw, Smartphone } from 'lucide-react'
import {
  DEFAULT_PLATFORM_CONFIG,
  getPlatformConfigSnapshot,
  refreshPlatformConfigFromServer,
  sendComplianceWebhookAlert,
  subscribePlatformConfigUpdates,
  type PaymentRulesConfig,
} from '@/services/platformConfig'
import { resolveAssetUrl } from '@/services/assets'
import { ADMIN_FEATURE_LABELS, normalizeAdminFeaturePermissions } from '@/services/adminPermissions'

const getMonthKey = (value: Date | string) => String(value).slice(0, 7)
const UNDO_RESOURCE = 'admin_payments'
const MIN_AMOUNT_FCFA = 100
const MAX_AMOUNT_FCFA = 10_000_000
const ORANGE_SIM_CODE_LENGTH = 6
const WAVE_LOGO_PATH = '/providers/wave-logo.svg'
const ORANGE_LOGO_PATH = '/providers/orange-money-logo.svg'
const SUBSCRIPTION_MODE_LABELS: Record<'monthly' | 'premium' | 'annual', string> = {
  monthly: 'Mensuel',
  premium: 'Premium',
  annual: 'Annuel',
}

type PaymentFieldErrors = {
  phone?: string
  amount?: string
  orangeCode?: string
}

function normalizePhone(value: string): string {
  const raw = String(value || '').trim()
  const startsWithPlus = raw.startsWith('+')
  const digitsOnly = raw.replace(/\D/g, '')
  if (digitsOnly.startsWith('221') && digitsOnly.length === 12) {
    return `+${digitsOnly}`
  }
  if (digitsOnly.length === 9 && digitsOnly.startsWith('7')) {
    return `+221${digitsOnly}`
  }
  if (startsWithPlus && digitsOnly.length > 0) {
    return `+${digitsOnly}`
  }
  return digitsOnly
}

function isValidSenegalMobileNumber(value: string): boolean {
  const normalized = normalizePhone(value)
  return /^\+2217\d{8}$/.test(normalized)
}

function buildOrangeSimulationCode(): string {
  return String(Math.floor(Math.random() * 10 ** ORANGE_SIM_CODE_LENGTH)).padStart(ORANGE_SIM_CODE_LENGTH, '0')
}

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
    selectedClass: 'border-[#00AEEF] bg-[#E7F9FF] shadow-[0_10px_24px_rgba(0,174,239,0.22)]',
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
    selectedClass: 'border-[#FF7900] bg-[#FFF2E7] shadow-[0_10px_24px_rgba(255,121,0,0.2)]',
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
    selectedClass: 'border-[#121B53] bg-[#EEF2FF] shadow-[0_10px_24px_rgba(18,27,83,0.2)]',
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
  const [paymentRules, setPaymentRules] = useState<PaymentRulesConfig>(getPlatformConfigSnapshot().paymentRules)
  const [fieldErrors, setFieldErrors] = useState<PaymentFieldErrors>({})
  const [orangeCode, setOrangeCode] = useState('')
  const [orangeCodeInput, setOrangeCodeInput] = useState('')
  const [waveQrCodeDataUrl, setWaveQrCodeDataUrl] = useState('')
  const [waveQrLoading, setWaveQrLoading] = useState(false)
  const [waveMarkedAsPaid, setWaveMarkedAsPaid] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const overdueToastKeyRef = useRef('')
  const userRole = String(user?.role || '').toUpperCase()
  const canValidateCash = userRole === 'SUPER_ADMIN'
  const currentMonth = useMemo(() => getMonthKey(new Date().toISOString()), [])
  const waveLogoUrl = useMemo(() => resolveAssetUrl(WAVE_LOGO_PATH), [])
  const orangeLogoUrl = useMemo(() => resolveAssetUrl(ORANGE_LOGO_PATH), [])

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
    let active = true
    const loadPlatformConfig = async () => {
      const config = await refreshPlatformConfigFromServer()
      if (!active) return
      setPaymentRules(config.paymentRules)
    }
    void loadPlatformConfig()
    const unsubscribe = subscribePlatformConfigUpdates((config) => {
      if (!active) return
      setPaymentRules(config.paymentRules)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

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
  const blockedBySystem = Boolean(subscriptionStatus?.blocked)
  const lastPayment = payments[0]
  const dueDateLabel = subscriptionStatus?.dueAt ? new Date(subscriptionStatus.dueAt).toLocaleDateString('fr-FR') : null
  const effectiveGraceDays =
    Number.isFinite(Number(paymentRules.graceDays)) && Number(paymentRules.graceDays) >= 0
      ? Number(paymentRules.graceDays)
      : DEFAULT_PLATFORM_CONFIG.paymentRules.graceDays
  const latePenaltyPercent =
    Number.isFinite(Number(paymentRules.latePenaltyPercent)) && Number(paymentRules.latePenaltyPercent) >= 0
      ? Number(paymentRules.latePenaltyPercent)
      : DEFAULT_PLATFORM_CONFIG.paymentRules.latePenaltyPercent
  const overdueByRules = Boolean(subscriptionStatus?.dueAt) && Date.now() > new Date(subscriptionStatus.dueAt || '').getTime()
  const subscriptionMode = (() => {
    const raw = String(subscriptionStatus?.subscriptionMode || admin?.subscriptionMode || 'monthly').toLowerCase()
    if (raw === 'annual' || raw === 'premium') return raw
    return 'monthly'
  })() as 'monthly' | 'premium' | 'annual'
  const expectedPlanAmount = (() => {
    const statusAmount = Number(subscriptionStatus?.expectedAmount || 0)
    if (Number.isFinite(statusAmount) && statusAmount > 0) return Math.round(statusAmount)
    if (subscriptionMode === 'annual') {
      const adminAnnual = Number(admin?.subscriptionAnnualAmount || 0)
      return Number.isFinite(adminAnnual) && adminAnnual > 0 ? Math.round(adminAnnual) : 60000
    }
    const adminMonthly = Number(admin?.subscriptionMonthlyAmount || 0)
    return Number.isFinite(adminMonthly) && adminMonthly > 0 ? Math.round(adminMonthly) : 5000
  })()
  const allowCustomAmount = Boolean(subscriptionStatus?.allowCustomAmount ?? admin?.subscriptionAllowCustomAmount)
  const paymentRecipientName = String(
    subscriptionStatus?.recipientName || paymentRules.recipientName || 'Keur Ya Aicha'
  ).trim()
  const waveRecipientPhone = normalizePhone(
    subscriptionStatus?.waveRecipientPhone || paymentRules.waveRecipientPhone || ''
  )
  const waveEnabled = Boolean(subscriptionStatus?.waveEnabled ?? paymentRules.waveEnabled)
  const waveMode = subscriptionStatus?.waveMode || paymentRules.waveMode || 'manual'
  const waveApiConfigured = Boolean(subscriptionStatus?.waveApiConfigured)
  const orangeRecipientPhone = normalizePhone(
    subscriptionStatus?.orangeRecipientPhone || paymentRules.orangeRecipientPhone || ''
  )
  const orangeMoneyEnabled = Boolean(
    subscriptionStatus?.orangeMoneyEnabled ?? paymentRules.orangeMoneyEnabled
  )
  const orangeMoneyMode = subscriptionStatus?.orangeMoneyMode || paymentRules.orangeMoneyMode || 'manual'
  const orangeMoneyApiConfigured = Boolean(subscriptionStatus?.orangeMoneyApiConfigured)
  const orangeOtpEnabled = Boolean(
    subscriptionStatus?.orangeOtpEnabled ?? paymentRules.orangeOtpEnabled
  )
  const manualValidationEnabled = Boolean(
    subscriptionStatus?.manualValidationEnabled ?? paymentRules.manualValidationEnabled
  )
  const getPeriodKeyForPayment = (payment: AdminPaymentDTO): string => {
    const rawMonth = String(payment.month || '').trim()
    if (subscriptionMode === 'annual') {
      if (/^\d{4}$/.test(rawMonth)) return rawMonth
      if (/^\d{4}-\d{2}$/.test(rawMonth)) return rawMonth.slice(0, 4)
      return String(new Date(payment.paidAt || payment.createdAt || Date.now()).getFullYear())
    }
    if (/^\d{4}-\d{2}$/.test(rawMonth)) return rawMonth
    return String(payment.paidAt || payment.createdAt || new Date().toISOString()).slice(0, 7)
  }
  const getPeriodLabelForPayment = (payment: AdminPaymentDTO): string => {
    if (subscriptionMode === 'annual') {
      return `${getPeriodKeyForPayment(payment)} (annuel)`
    }
    return getPeriodKeyForPayment(payment)
  }
  const paidRequiredMonth = payments.some((payment) => getPeriodKeyForPayment(payment) === requiredMonth)
  const settledPayments = payments.filter((payment) => {
    const status = String(payment.status || 'paid').toLowerCase()
    return status === 'paid' || status === 'success' || status === 'succeeded'
  })
  const paidPeriods = Array.from(new Set(settledPayments.map((payment) => getPeriodKeyForPayment(payment)))).sort((a, b) =>
    b.localeCompare(a)
  )
  const planRights = (() => {
    const effectivePermissions = normalizeAdminFeaturePermissions(
      (user?.permissions || admin?.permissions) as Record<string, boolean> | undefined
    )
    const allowedFeatures = (Object.keys(effectivePermissions) as Array<keyof typeof effectivePermissions>)
      .filter((feature) => effectivePermissions[feature])
      .map((feature) => ADMIN_FEATURE_LABELS[feature])
    const blockedFeatures = (Object.keys(effectivePermissions) as Array<keyof typeof effectivePermissions>)
      .filter((feature) => !effectivePermissions[feature])
      .map((feature) => ADMIN_FEATURE_LABELS[feature])

    if (blockedBySystem) {
      return ['Accès limité à la page abonnement jusqu’au paiement de la période en retard.']
    }
    const rights = [
      'Accès aux modules Clients, Locations, Paiements et Documents.',
      'Création, modification et suivi des opérations de gestion.',
      allowCustomAmount ? 'Montant libre autorisé pour les paiements d’abonnement.' : 'Montant verrouillé par le Super Admin.',
      allowedFeatures.length > 0 ? `Fonctions actives: ${allowedFeatures.join(', ')}.` : 'Aucune fonction active.',
    ]
    if (blockedFeatures.length > 0) {
      rights.push(`Fonctions bloquées: ${blockedFeatures.join(', ')}.`)
    }
    if (subscriptionMode === 'premium') {
      rights.push('Mode Premium actif: accès administratif complet.')
    } else if (subscriptionMode === 'annual') {
      rights.push('Mode Annuel actif: renouvellement global par année.')
    } else {
      rights.push('Mode Mensuel actif: renouvellement chaque mois.')
    }
    return rights
  })()
  const normalizedPhone = normalizePhone(payerPhone)
  const numericAmount = allowCustomAmount ? Number(amount) : expectedPlanAmount
  const visiblePaymentMethods = useMemo(() => {
    if (canValidateCash) {
      return PAYMENT_METHOD_OPTIONS.filter((method) => method.id === 'cash')
    }
    return PAYMENT_METHOD_OPTIONS.filter((method) => {
      if (method.id === 'cash') return false
      if (method.id === 'wave') return waveEnabled
      if (method.id === 'orange_money') return orangeMoneyEnabled
      return false
    })
  }, [canValidateCash, orangeMoneyEnabled, waveEnabled])
  const paymentAccountConfigured =
    paymentMethod === 'wave'
      ? Boolean(waveRecipientPhone) && (waveMode !== 'api' || waveApiConfigured)
      : paymentMethod === 'orange_money'
      ? Boolean(orangeRecipientPhone) && (orangeMoneyMode !== 'api' || orangeMoneyApiConfigured)
      : true
  const hasValidRawAmount =
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    (!allowCustomAmount || (numericAmount >= MIN_AMOUNT_FCFA && numericAmount <= MAX_AMOUNT_FCFA))
  const waveCheckoutLink = useMemo(() => {
    if (paymentMethod !== 'wave') return ''
    if (!hasValidRawAmount || !waveRecipientPhone) return ''
    const params = new URLSearchParams({
      amount: String(Math.round(numericAmount)),
      currency: 'XOF',
      phone: waveRecipientPhone,
      reason: `Abonnement ${requiredMonth}`,
    })
    return `wave://pay?${params.toString()}`
  }, [hasValidRawAmount, numericAmount, paymentMethod, requiredMonth, waveRecipientPhone])

  useEffect(() => {
    if (!blockedBySystem) return
    void sendComplianceWebhookAlert('security', {
      event: 'payment_overdue',
      adminId: user?.id || '',
      month: subscriptionStatus?.overdueMonth || requiredMonth,
      dueAt: subscriptionStatus?.dueAt || '',
    })
  }, [blockedBySystem, requiredMonth, subscriptionStatus?.dueAt, subscriptionStatus?.overdueMonth, user?.id])

  useEffect(() => {
    if (!blockedBySystem) return
    const overduePeriod = subscriptionStatus?.overdueMonth || requiredMonth
    const toastKey = `${overduePeriod}|${subscriptionStatus?.dueAt || ''}`
    if (overdueToastKeyRef.current === toastKey) return
    overdueToastKeyRef.current = toastKey
    addToast({
      type: 'error',
      title: 'Renouvellement requis',
      message: `Le mois ${overduePeriod} est dépassé. Renouvelez maintenant pour éviter les restrictions d'accès.`,
    })
  }, [addToast, blockedBySystem, requiredMonth, subscriptionStatus?.dueAt, subscriptionStatus?.overdueMonth])

  useEffect(() => {
    if (canValidateCash && paymentMethod !== 'cash') {
      setPaymentMethod('cash')
      return
    }
    if (!canValidateCash) {
      if (paymentMethod === 'cash') {
        setPaymentMethod(visiblePaymentMethods[0]?.id || 'wave')
        return
      }
      const methodStillVisible = visiblePaymentMethods.some((method) => method.id === paymentMethod)
      if (!methodStillVisible && visiblePaymentMethods[0]) {
        setPaymentMethod(visiblePaymentMethods[0].id)
      }
    }
  }, [canValidateCash, paymentMethod, visiblePaymentMethods])

  useEffect(() => {
    if (allowCustomAmount) return
    if (!Number.isFinite(expectedPlanAmount) || expectedPlanAmount <= 0) return
    setAmount(String(expectedPlanAmount))
  }, [allowCustomAmount, expectedPlanAmount])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(max-width: 900px)')
    const update = () => {
      const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent)
      setIsMobileViewport(mediaQuery.matches || mobileUa)
    }
    update()
    mediaQuery.addEventListener('change', update)
    return () => {
      mediaQuery.removeEventListener('change', update)
    }
  }, [])

  useEffect(() => {
    setFieldErrors({})
    if (paymentMethod === 'wave' && waveMode === 'api') {
      setWaveMarkedAsPaid(true)
    } else {
      setWaveMarkedAsPaid(false)
    }
    if (paymentMethod !== 'orange_money') {
      setOrangeCode('')
      setOrangeCodeInput('')
    }
  }, [paymentMethod, waveMode])

  useEffect(() => {
    if (paymentMethod !== 'orange_money') return
    if (orangeMoneyMode === 'api') {
      setOrangeCode('')
      setOrangeCodeInput('')
      return
    }
    setOrangeCode('')
    setOrangeCodeInput('')
  }, [amount, orangeMoneyMode, payerPhone, paymentMethod])

  useEffect(() => {
    if (paymentMethod !== 'wave') return
    if (waveMode === 'api') {
      setWaveMarkedAsPaid(true)
      return
    }
    setWaveMarkedAsPaid(false)
  }, [amount, payerPhone, paymentMethod, waveMode])

  useEffect(() => {
    let active = true
    const buildWaveQr = async () => {
      if (!waveCheckoutLink) {
        if (active) {
          setWaveQrCodeDataUrl('')
          setWaveQrLoading(false)
        }
        return
      }
      setWaveQrLoading(true)
      try {
        const qrcodeModule = (await import('qrcode')) as {
          toDataURL?: (text: string, options?: Record<string, unknown>) => Promise<string>
          default?: { toDataURL?: (text: string, options?: Record<string, unknown>) => Promise<string> }
        }
        const toDataURL = qrcodeModule.toDataURL || qrcodeModule.default?.toDataURL
        if (!toDataURL) {
          throw new Error('QR module unavailable')
        }
        const dataUrl = await toDataURL(waveCheckoutLink, {
          width: 260,
          margin: 1,
          color: {
            dark: '#003A63',
            light: '#FFFFFF',
          },
        })
        if (!active) return
        setWaveQrCodeDataUrl(dataUrl)
      } catch {
        if (!active) return
        setWaveQrCodeDataUrl('')
      } finally {
        if (active) setWaveQrLoading(false)
      }
    }

    void buildWaveQr()
    return () => {
      active = false
    }
  }, [waveCheckoutLink])

  const openWaveCheckoutOnMobile = () => {
    if (!waveCheckoutLink) {
      addToast({
        type: 'error',
        title: 'Wave indisponible',
        message: waveRecipientPhone
          ? 'Renseignez un montant valide pour générer le lien Wave.'
          : 'Le compte bénéficiaire Wave n’est pas encore configuré par le Super Admin.',
      })
      return
    }
    if (!isMobileViewport) {
      addToast({
        type: 'info',
        title: 'Utilisation mobile recommandée',
        message: 'Scannez le QR code avec un téléphone connecté à Wave.',
      })
      return
    }
    window.location.href = waveCheckoutLink
  }

  const handlePay = async () => {
    if (!user?.id) return
    const nextErrors: PaymentFieldErrors = {}
    if (!allowCustomAmount) {
      if (!Number.isFinite(expectedPlanAmount) || expectedPlanAmount <= 0) {
        nextErrors.amount = "Montant d'abonnement non configuré par le Super Admin."
      }
    } else if (!numericAmount || Number.isNaN(numericAmount) || numericAmount < MIN_AMOUNT_FCFA || numericAmount > MAX_AMOUNT_FCFA) {
      nextErrors.amount = `Montant invalide. Valeur attendue entre ${formatCurrency(MIN_AMOUNT_FCFA)} et ${formatCurrency(MAX_AMOUNT_FCFA)} FCFA.`
    }
    if (paymentMethod === 'cash' && !canValidateCash) {
      addToast({
        type: 'error',
        title: 'Action non autorisée',
        message: 'Le paiement espèces doit être validé par un Super Admin.',
      })
      return
    }
    if (paymentMethod !== 'cash') {
      if (!payerPhone.trim()) {
        nextErrors.phone = 'Saisissez le numéro lié à Wave ou Orange Money.'
      } else if (!isValidSenegalMobileNumber(payerPhone)) {
        nextErrors.phone = 'Téléphone invalide (format attendu: +221771234567 ou 771234567).'
      }
    }

    if (paymentMethod === 'wave' && !waveRecipientPhone) {
      addToast({
        type: 'error',
        title: 'Compte Wave non configuré',
        message: 'Le Super Admin doit renseigner le numéro bénéficiaire Wave dans les paramètres.',
      })
      return
    }

    if (paymentMethod === 'orange_money' && !orangeRecipientPhone) {
      addToast({
        type: 'error',
        title: 'Compte Orange Money non configuré',
        message: 'Le Super Admin doit renseigner le numéro bénéficiaire Orange Money dans les paramètres.',
      })
      return
    }

    if (paymentMethod === 'wave' && waveMode === 'api' && !waveApiConfigured) {
      addToast({
        type: 'error',
        title: 'Wave API incomplète',
        message: 'Le Super Admin doit terminer la configuration API Wave.',
      })
      return
    }

    if (paymentMethod === 'orange_money' && orangeMoneyMode === 'api' && !orangeMoneyApiConfigured) {
      addToast({
        type: 'error',
        title: 'Orange Money API incomplète',
        message: 'Le Super Admin doit terminer la configuration API Orange Money.',
      })
      return
    }

    if (
      (paymentMethod === 'wave' && waveMode === 'manual') ||
      (paymentMethod === 'orange_money' && orangeMoneyMode === 'manual')
    ) {
      if (!manualValidationEnabled) {
        addToast({
          type: 'error',
          title: 'Validation manuelle désactivée',
          message: 'Le Super Admin a désactivé la validation manuelle des paiements Mobile Money.',
        })
        return
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      addToast({
        type: 'error',
        title: 'Validation requise',
        message: nextErrors.phone || nextErrors.amount || 'Complétez correctement les informations de paiement.',
      })
      return
    }

    if (paymentMethod === 'orange_money' && orangeOtpEnabled && orangeMoneyMode !== 'api') {
      if (!orangeCode) {
        const generatedCode = buildOrangeSimulationCode()
        setOrangeCode(generatedCode)
        setOrangeCodeInput('')
        setFieldErrors({})
        addToast({
          type: 'info',
          title: 'Code Orange Money envoyé',
          message: `Simulation: entrez le code ${generatedCode} pour confirmer le paiement.`,
        })
        return
      }
      if (orangeCodeInput.trim() !== orangeCode) {
        setFieldErrors({ orangeCode: 'Code de validation Orange Money invalide.' })
        addToast({
          type: 'error',
          title: 'Code invalide',
          message: 'Le code de validation Orange Money est incorrect.',
        })
        return
      }
    }

    if (paymentMethod === 'wave' && waveMode !== 'api' && !waveMarkedAsPaid) {
      addToast({
        type: 'info',
        title: 'Confirmation Wave requise',
        message: 'Scannez le QR ou ouvrez Wave sur mobile, puis cliquez sur "J’ai validé sur Wave".',
      })
      return
    }

    setPaying(true)
    try {
      const nowIso = new Date().toISOString()
      const baseAmount = allowCustomAmount ? numericAmount : expectedPlanAmount
      const penaltyMultiplier = overdueByRules ? 1 + latePenaltyPercent / 100 : 1
      const effectiveAmount = Number((baseAmount * penaltyMultiplier).toFixed(0))
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
        amount: effectiveAmount,
        method: paymentMethod,
        provider,
        payerPhone: paymentMethod === 'cash' ? '' : normalizedPhone,
        transactionRef:
          paymentMethod === 'orange_money' && orangeMoneyMode !== 'api'
            ? `OM-MAN-${Date.now()}`
            : paymentMethod === 'wave' && waveMode !== 'api'
            ? `WAVE-MAN-${Date.now()}`
            : '',
        note: note.trim(),
        paidAt: paymentMethod === 'cash' ? nowIso : undefined,
        month: requiredMonth,
        createdAt: nowIso,
      })
      setPayments((prev) => [payment, ...prev])
      const freshStatus = await getAdminPaymentStatus()
      setSubscriptionStatus(freshStatus)
      await refreshUndoAvailability()
      setNote('')
      setFieldErrors({})
      setOrangeCode('')
      setOrangeCodeInput('')
      setWaveMarkedAsPaid(false)
      if (payment?.status === 'pending' && payment?.checkoutUrl) {
        window.open(payment.checkoutUrl, '_blank', 'noopener,noreferrer')
      }
      addToast({
        type: payment?.status === 'pending' ? 'info' : 'success',
        title: payment?.status === 'pending' ? 'Paiement initié' : 'Paiement enregistré',
        message:
          payment?.status === 'pending'
            ? paymentMethod === 'wave'
              ? waveMode === 'api'
                ? 'Paiement Wave initié. En attente de confirmation provider.'
                : 'Déclaration Wave enregistrée. En attente de validation.'
              : orangeMoneyMode === 'api'
                ? 'Paiement Orange Money initié. En attente de confirmation provider.'
                : 'Déclaration Orange Money enregistrée. En attente de validation.'
            : paymentMethod === 'cash'
            ? 'Paiement espèces enregistré. Accès mis à jour.'
            : `Paiement ${paymentMethod === 'wave' ? 'Wave' : 'Orange Money'} confirmé.`,
      })
      if (effectiveAmount > (allowCustomAmount ? numericAmount : expectedPlanAmount)) {
        addToast({
          type: 'info',
          title: 'Pénalité appliquée',
          message: `Montant ajusté avec pénalité (${latePenaltyPercent}%): ${formatCurrency(effectiveAmount)} FCFA.`,
        })
      }
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
          <CardTitle className="text-2xl text-[#121B53]">Paiement abonnement</CardTitle>
          <p className="text-sm text-muted-foreground">
            {subscriptionMode === 'annual'
              ? `Paiement annuel requis avec une grâce de ${effectiveGraceDays} jours.`
              : `Paiement avant la fin du mois + ${effectiveGraceDays} jours.`}{' '}
            Passé ce délai, l’accès est limité à cet écran.
          </p>
          <p className="text-xs text-[#121B53]/70">
            Mode: <span className="font-semibold">{SUBSCRIPTION_MODE_LABELS[subscriptionMode]}</span> •
            Montant attendu: <span className="font-semibold">{formatCurrency(expectedPlanAmount)} FCFA</span>
            {allowCustomAmount ? ' • Montant libre autorisé' : ' • Montant verrouillé par Super Admin'}
          </p>
          <p className="text-xs text-[#121B53]/70">
            Bénéficiaire Mobile Money: <span className="font-semibold">{paymentRecipientName || 'Non défini'}</span>
            {waveRecipientPhone ? ` • Wave ${waveRecipientPhone}` : ' • Wave non configuré'}
            {orangeRecipientPhone ? ` • Orange ${orangeRecipientPhone}` : ' • Orange non configuré'}
          </p>
          <p className="text-xs text-[#121B53]/70">
            Modes actifs: Wave {waveEnabled ? (waveMode === 'api' ? 'API' : 'manuel') : 'désactivé'} • Orange Money{' '}
            {orangeMoneyEnabled ? (orangeMoneyMode === 'api' ? 'API' : 'manuel') : 'désactivé'} • Validation manuelle{' '}
            {manualValidationEnabled ? 'autorisée' : 'désactivée'}
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

          <div className="rounded-2xl border border-[#121B53]/10 bg-[#F7F9FF] p-3 text-xs text-[#121B53]/80">
            <p>
              Règles actives: blocage {paymentRules.blockOnOverdue ? 'activé' : 'désactivé'} • pénalité retard {latePenaltyPercent}%.
            </p>
            {overdueByRules && latePenaltyPercent > 0 ? (
              <p className="mt-1 text-amber-700">
                Retard détecté: la pénalité est appliquée automatiquement au montant saisi.
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#121B53]/10 bg-[#F7F9FF] p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#121B53]/50">
                {subscriptionMode === 'annual' ? "Statut de l'année" : 'Statut du mois'}
              </p>
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

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#121B53]/10 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#121B53]/50">Vos droits actuels</p>
              <ul className="mt-2 space-y-2 text-sm text-[#121B53]">
                {planRights.map((right) => (
                  <li key={right} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#121B53]/70" />
                    <span>{right}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[#121B53]/10 bg-[#F7F9FF] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.2em] text-[#121B53]/50">Périodes déjà payées</p>
                <Badge className="bg-[#121B53] text-white">{paidPeriods.length}</Badge>
              </div>
              {paidPeriods.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Aucune période validée pour le moment.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {paidPeriods.slice(0, 12).map((period) => (
                    <Badge key={period} variant="secondary" className="bg-white border border-[#121B53]/15 text-[#121B53]">
                      {subscriptionMode === 'annual' ? `${period} (annuel)` : period}
                    </Badge>
                  ))}
                </div>
              )}
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
          {!canValidateCash && visiblePaymentMethods.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Aucun moyen de paiement mobile n’est actuellement activé par le Super Admin.
            </div>
          ) : null}

          {paymentMethod !== 'cash' ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#121B53]">Numéro Mobile Money</label>
                <Input
                  value={payerPhone}
                  onChange={(event) => {
                    setPayerPhone(event.target.value)
                    setFieldErrors((prev) => ({ ...prev, phone: undefined }))
                  }}
                  placeholder="Ex: +221771234567 ou 771234567"
                  className={fieldErrors.phone ? 'border-rose-300 focus-visible:ring-rose-300' : 'border-[#121B53]/20'}
                />
                {fieldErrors.phone ? <p className="text-xs text-rose-600">{fieldErrors.phone}</p> : null}
              </div>

              {paymentMethod === 'wave' ? (
                <div className="rounded-2xl border border-[#00AEEF]/30 bg-[#ECFAFF] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img src={waveLogoUrl} alt="Wave" className="h-10 rounded-lg border border-[#00AEEF]/20 bg-white p-1" />
                      <div>
                        <p className="text-sm font-semibold text-[#006E9A]">Paiement Wave</p>
                        <p className="text-xs text-[#2B7A9B]">
                          Le paiement part vers {paymentRecipientName || 'le compte configuré'}
                          {waveRecipientPhone ? ` (${waveRecipientPhone})` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-[#00AEEF] text-white">WAVE</Badge>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-[auto_1fr]">
                    <div className="flex h-[170px] w-[170px] items-center justify-center rounded-xl border border-[#00AEEF]/25 bg-white p-2">
                      {waveQrLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-[#00AEEF]" />
                      ) : waveQrCodeDataUrl ? (
                        <img src={waveQrCodeDataUrl} alt="QR Wave" className="h-full w-full object-contain" />
                      ) : (
                        <p className="px-2 text-center text-[11px] text-[#2B7A9B]">
                          Entrez numéro + montant valides pour générer le QR.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 text-xs text-[#256885]">
                      <p>1. Vérifiez le numéro et le montant.</p>
                      <p>2. Scannez le QR code depuis l’application Wave.</p>
                      <p>3. Le transfert doit arriver sur le compte Wave configuré par le Super Admin.</p>
                      <p>
                        4. {waveMode === 'api'
                          ? 'Le backend initiera ensuite le paiement provider et attendra le webhook.'
                          : 'Revenez ici puis déclarez le paiement pour validation manuelle.'}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-[#00AEEF]/40 text-[#006E9A]"
                          onClick={openWaveCheckoutOnMobile}
                        >
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Ouvrir Wave sur mobile
                        </Button>
                        <Button
                          type="button"
                          variant={waveMarkedAsPaid ? 'default' : 'secondary'}
                          className={waveMarkedAsPaid ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}
                          onClick={() => setWaveMarkedAsPaid((prev) => !prev)}
                          disabled={waveMode === 'api'}
                        >
                          {waveMode === 'api'
                            ? 'Validation provider attendue'
                            : waveMarkedAsPaid
                              ? 'Wave validé'
                              : 'J’ai validé sur Wave'}
                        </Button>
                      </div>
                      {isMobileViewport ? (
                        <p className="text-[11px] text-[#256885]">Mobile détecté: le bouton peut ouvrir directement l’app Wave.</p>
                      ) : (
                        <p className="text-[11px] text-[#256885]">Desktop détecté: utilisez le QR code avec votre téléphone.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#FF7900]/25 bg-[#FFF5EC] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img src={orangeLogoUrl} alt="Orange Money" className="h-10 rounded-lg border border-[#FF7900]/20 bg-white p-1" />
                      <div>
                        <p className="text-sm font-semibold text-[#B85600]">Paiement Orange Money</p>
                        <p className="text-xs text-[#B56A2C]">
                          Le transfert doit arriver sur {paymentRecipientName || 'le compte configuré'}
                          {orangeRecipientPhone ? ` (${orangeRecipientPhone})` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-[#FF7900] text-black">OM</Badge>
                  </div>
                  <div className="mt-3 space-y-1">
                    {orangeMoneyMode === 'api' ? (
                      <p className="text-xs text-[#8C490D]">
                        Le backend initiera le paiement Orange Money via l’API configurée puis attendra le retour provider.
                      </p>
                    ) : orangeOtpEnabled ? (
                      <>
                        <label className="text-xs font-medium text-[#B85600]">Code de validation OM</label>
                        <Input
                          value={orangeCodeInput}
                          onChange={(event) => {
                            setOrangeCodeInput(event.target.value.replace(/[^\d]/g, '').slice(0, ORANGE_SIM_CODE_LENGTH))
                            setFieldErrors((prev) => ({ ...prev, orangeCode: undefined }))
                          }}
                          placeholder={`Code à ${ORANGE_SIM_CODE_LENGTH} chiffres`}
                          className={fieldErrors.orangeCode ? 'border-rose-300 focus-visible:ring-rose-300' : 'border-[#FF7900]/30 bg-white'}
                        />
                        {fieldErrors.orangeCode ? <p className="text-xs text-rose-600">{fieldErrors.orangeCode}</p> : null}
                        {orangeCode ? (
                          <p className="text-xs text-[#8C490D]">
                            Code simulation envoyé: <span className="font-semibold tracking-widest">{orangeCode}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-[#8C490D]">
                            Cliquez sur "Recevoir code OM" pour générer un code de validation.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-[#8C490D]">
                        OTP Orange Money désactivé. Utilisez le numéro bénéficiaire configuré puis confirmez le paiement.
                      </p>
                    )}
                  </div>
                </div>
              )}
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
              <label className="text-sm font-medium text-[#121B53]">
                {subscriptionMode === 'annual' ? 'Montant annuel (FCFA)' : 'Montant abonnement (FCFA)'}
              </label>
              <Input
                value={amount}
                onChange={(event) => {
                  if (!allowCustomAmount) return
                  setAmount(event.target.value.replace(/[^\d]/g, ''))
                  setFieldErrors((prev) => ({ ...prev, amount: undefined }))
                }}
                placeholder="Ex: 5000"
                className={fieldErrors.amount ? 'border-rose-300 focus-visible:ring-rose-300' : 'border-[#121B53]/20'}
                disabled={!allowCustomAmount}
              />
              {fieldErrors.amount ? (
                <p className="text-xs text-rose-600">{fieldErrors.amount}</p>
              ) : !allowCustomAmount ? (
                <p className="text-xs text-[#121B53]/60">
                  Montant prérempli par le Super Admin: {formatCurrency(expectedPlanAmount)} FCFA
                </p>
              ) : (
                <p className="text-xs text-[#121B53]/60">
                  Minimum {formatCurrency(MIN_AMOUNT_FCFA)} FCFA • Maximum {formatCurrency(MAX_AMOUNT_FCFA)} FCFA
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePay}
                disabled={
                  paying ||
                  paidRequiredMonth ||
                  (paymentMethod === 'cash' && !canValidateCash) ||
                  !paymentAccountConfigured ||
                  (!allowCustomAmount && expectedPlanAmount <= 0)
                }
                className="h-11 bg-[#121B53] text-white hover:bg-[#0B153D]"
              >
                {paidRequiredMonth
                  ? 'Déjà payé'
                  : paying
                  ? 'Traitement...'
                  : paymentMethod === 'wave'
                  ? waveMode === 'api'
                    ? 'Initier paiement Wave'
                    : 'Déclarer paiement Wave'
                  : paymentMethod === 'orange_money'
                  ? orangeMoneyMode === 'api'
                    ? 'Initier paiement OM'
                    : orangeOtpEnabled
                    ? orangeCode
                      ? 'Confirmer code OM'
                      : 'Recevoir code OM'
                    : 'Confirmer paiement OM'
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
                      {getPeriodLabelForPayment(payment)} • {payment.method === 'wave' ? 'Wave' : payment.method === 'orange_money' ? 'Orange Money' : 'Espèces'}
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
