import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useElectronAPI } from '@/hooks/useElectronAPI'
import { useToast } from '@/hooks/use-toast'
import { useActionLogger } from '@/lib/actionLogger'
import { CLIENT_IMPORT_FIELDS, DEFAULT_IMPORT_ALIASES, DEFAULT_REQUIRED_FIELDS, type ClientImportMapping } from '@/lib/importClients'
import {
  changeOwnPassword,
  getPaymentProviderSettings,
  savePaymentProviderSettings,
  type PaymentProviderSettings,
  getSetting,
  setSetting,
} from '@/services/api'
import { uploadToCloudinary } from '@/services/api/uploads.api'
import {
  applyAuditLogsRetention,
  downloadAuditLogsExport,
  downloadLatestAuditAutoExport,
  fetchAuditAutoExportStatus,
  triggerAuditAutoExportNow,
  type AuditAutoExportStatus,
} from '@/services/api/auditLogs.api'
import {
  PlatformConfig,
  applyBrandingToDocument,
  getPlatformConfigSnapshot,
  refreshPlatformConfigFromServer,
  savePlatformConfig,
  sendComplianceWebhookAlert,
  testComplianceWebhookServerSide,
} from '@/services/platformConfig'
import {
  ensureRuntimeConfigLoaded,
  getRuntimeConfigSnapshot,
  updateRuntimeConfig,
  validateRuntimeApiBaseUrl,
  validateRuntimeSignUrl,
} from '@/services/runtimeConfig'
import { SettingsHeaderSection } from './sections/SettingsHeaderSection'
import { SettingsAccountSecuritySection } from './sections/SettingsAccountSecuritySection'
import { SettingsAdminBrandingSection } from './sections/SettingsAdminBrandingSection'
import { SettingsGovernanceSection } from './sections/SettingsGovernanceSection'
import { SettingsImportAliasesSection } from './sections/SettingsImportAliasesSection'
import { SettingsRequiredFieldsSection } from './sections/SettingsRequiredFieldsSection'
import { SettingsReportSection } from './sections/SettingsReportSection'
import { SettingsRuntimeApiSection } from './sections/SettingsRuntimeApiSection'
import { SettingsContractsSection } from './sections/SettingsContractsSection'
import { SettingsSignatureSection } from './sections/SettingsSignatureSection'
import { safeJsonParse } from './utils'
import {
  appendAdminLogoToLibrary,
  fetchAdminBrandingOverrides,
  fetchAdminLogoLibrary,
  saveAdminAppNameOverride,
  saveAdminLogoOverride,
} from '@/services/adminBranding'

const REQUIRED_FIELDS_KEY = 'import_clients_required_fields'
const URL_PROTOCOLS = new Set(['http:', 'https:'])

function normalizeApiBaseUrl(value: string): string {
  return String(value || '').trim().replace(/\/+$/, '')
}

function normalizeSignUrl(value: string): string {
  return String(value || '').trim()
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return URL_PROTOCOLS.has(parsed.protocol)
  } catch {
    return false
  }
}

function buildEmptyPaymentProviderSettings(): PaymentProviderSettings {
  return {
    wave: {
      apiBaseUrl: '',
      initiationPath: '/payments',
      merchantId: '',
      apiKey: '',
      apiKeyConfigured: false,
      apiKeyMasked: '',
      apiSecret: '',
      apiSecretConfigured: false,
      apiSecretMasked: '',
      webhookSecret: '',
      webhookSecretConfigured: false,
      webhookSecretMasked: '',
    },
    orangeMoney: {
      apiBaseUrl: '',
      initiationPath: '/payments',
      merchantCode: '',
      clientId: '',
      clientSecret: '',
      clientSecretConfigured: false,
      clientSecretMasked: '',
      webhookSecret: '',
      webhookSecretConfigured: false,
      webhookSecretMasked: '',
    },
    webhooks: {
      wave: '',
      orangeMoney: '',
    },
  }
}

export default function SettingsPage() {
  const { user, impersonation } = useAuth()
  const { toast } = useToast()
  const { isElectron, openRuntimeConfigFolder } = useElectronAPI()
  const logAction = useActionLogger('settings')
  const navigate = useNavigate()
  const [importAliasesText, setImportAliasesText] = useState('')
  const [importAliasesError, setImportAliasesError] = useState('')
  const [importAliasesSaving, setImportAliasesSaving] = useState(false)
  const [requiredFields, setRequiredFields] = useState<Array<keyof ClientImportMapping>>(DEFAULT_REQUIRED_FIELDS)
  const [requiredFieldsSaving, setRequiredFieldsSaving] = useState(false)
  const [reportFormat, setReportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv')
  const [reportFormatSaving, setReportFormatSaving] = useState(false)
  const [runtimeApiBaseUrl, setRuntimeApiBaseUrl] = useState('')
  const [runtimeSignUrl, setRuntimeSignUrl] = useState('')
  const [runtimeConfigSource, setRuntimeConfigSource] = useState('default')
  const [runtimeConfigLoading, setRuntimeConfigLoading] = useState(false)
  const [runtimeConfigSaving, setRuntimeConfigSaving] = useState(false)
  const [runtimeConfigReloading, setRuntimeConfigReloading] = useState(false)
  const [runtimeConfigOpeningFolder, setRuntimeConfigOpeningFolder] = useState(false)
  const [runtimeConfigUserPath, setRuntimeConfigUserPath] = useState<string | null>(null)
  const [runtimeConfigPortablePath, setRuntimeConfigPortablePath] = useState<string | null>(null)
  const [runtimeConfigWrittenPath, setRuntimeConfigWrittenPath] = useState<string | null>(null)
  const [platformConfigDraft, setPlatformConfigDraft] = useState<PlatformConfig>(getPlatformConfigSnapshot())
  const [paymentProviderSettings, setPaymentProviderSettings] = useState<PaymentProviderSettings>(
    buildEmptyPaymentProviderSettings()
  )
  const [platformConfigLoading, setPlatformConfigLoading] = useState(false)
  const [platformConfigSaving, setPlatformConfigSaving] = useState(false)
  const [platformConfigReloading, setPlatformConfigReloading] = useState(false)
  const [paymentProviderLoading, setPaymentProviderLoading] = useState(false)
  const [auditRetentionApplying, setAuditRetentionApplying] = useState(false)
  const [auditExporting, setAuditExporting] = useState(false)
  const [auditAutoExportStatus, setAuditAutoExportStatus] = useState<AuditAutoExportStatus | null>(null)
  const [auditAutoExportStatusLoading, setAuditAutoExportStatusLoading] = useState(false)
  const [auditAutoExportRunning, setAuditAutoExportRunning] = useState(false)
  const [auditAutoExportDownloading, setAuditAutoExportDownloading] = useState(false)
  const [webhookTesting, setWebhookTesting] = useState(false)
  const [adminAppName, setAdminAppName] = useState('')
  const [adminNameSaving, setAdminNameSaving] = useState(false)
  const [adminLogoUrl, setAdminLogoUrl] = useState('')
  const [adminLogoLibrary, setAdminLogoLibrary] = useState<string[]>([])
  const [adminLogoLoading, setAdminLogoLoading] = useState(false)
  const [adminLogoSaving, setAdminLogoSaving] = useState(false)
  const [adminLogoUploading, setAdminLogoUploading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  const role = String(user?.role || '').toUpperCase()
  const canEdit = user && (role === 'ADMIN' || role === 'SUPER_ADMIN')
  const canEditRequired = role === 'SUPER_ADMIN'
  // Afficher la section contrats pour les admins et aussi pour le super admin en impersonation
  const canEditContracts = Boolean(canEdit || impersonation?.adminId)
  const canEditAdminBranding = role === 'ADMIN' || !!impersonation?.adminId
  const roleLabel = role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'Admin' : 'Compte'
  const activeAdminId = String(
    impersonation?.adminId || (role === 'ADMIN' ? user?.id || '' : '')
  ).trim()
  const adminScopeLabel = String(
    impersonation?.adminName || (role === 'ADMIN' ? user?.name || user?.username || '' : 'Espace admin')
  ).trim()
  const userScopedKey = useCallback((key: string) => (user?.id ? `${key}:${user.id}` : key), [user?.id])

  const loadRuntimeConfig = useCallback(async () => {
    if (!canEditRequired) return
    setRuntimeConfigLoading(true)
    try {
      await ensureRuntimeConfigLoaded()
      const snapshot = getRuntimeConfigSnapshot()
      setRuntimeApiBaseUrl(snapshot.apiBaseUrl || '')
      setRuntimeSignUrl(snapshot.cloudinarySignUrl || '')
      setRuntimeConfigSource(snapshot.source || 'default')
      setRuntimeConfigUserPath(snapshot.userPath)
      setRuntimeConfigPortablePath(snapshot.portablePath)
      setRuntimeConfigWrittenPath(snapshot.writtenPath)
    } finally {
      setRuntimeConfigLoading(false)
    }
  }, [canEditRequired])

  const loadPlatformConfig = useCallback(async () => {
    if (!canEditRequired) return
    setPlatformConfigLoading(true)
    try {
      const config = await refreshPlatformConfigFromServer()
      setPlatformConfigDraft(config)
      applyBrandingToDocument(config)
    } finally {
      setPlatformConfigLoading(false)
    }
  }, [canEditRequired])

  const loadPaymentProviders = useCallback(async () => {
    if (!canEditRequired) return
    setPaymentProviderLoading(true)
    try {
      const config = await getPaymentProviderSettings()
      setPaymentProviderSettings(config)
    } catch {
      setPaymentProviderSettings(buildEmptyPaymentProviderSettings())
    } finally {
      setPaymentProviderLoading(false)
    }
  }, [canEditRequired])

  const loadAuditAutoExportStatus = useCallback(
    async (silent = true) => {
      if (!canEditRequired) return
      setAuditAutoExportStatusLoading(true)
      try {
        const status = await fetchAuditAutoExportStatus()
        setAuditAutoExportStatus(status)
      } catch (error) {
        setAuditAutoExportStatus(null)
        if (!silent) {
          const message =
            error instanceof Error ? error.message : "Impossible de charger l'état de l'auto-export."
          toast({ title: 'Erreur', description: message, variant: 'destructive' })
        }
      } finally {
        setAuditAutoExportStatusLoading(false)
      }
    },
    [canEditRequired, toast]
  )

  useEffect(() => {
    async function loadImportAliases() {
      try {
        const raw = await getSetting(userScopedKey('import_clients_aliases'))
        const parsed = safeJsonParse(raw, DEFAULT_IMPORT_ALIASES)
        setImportAliasesText(JSON.stringify(parsed, null, 2))
      } catch {
        setImportAliasesText(JSON.stringify(DEFAULT_IMPORT_ALIASES, null, 2))
      }
    }
    loadImportAliases()
  }, [userScopedKey])

  useEffect(() => {
    async function loadReportFormat() {
      try {
        const raw = await getSetting(userScopedKey('import_report_format'))
        if (raw === 'csv' || raw === 'xlsx' || raw === 'json') {
          setReportFormat(raw)
        } else {
          setReportFormat('csv')
        }
      } catch {
        setReportFormat('csv')
      }
    }
    loadReportFormat()
  }, [userScopedKey])

  useEffect(() => {
    let mounted = true
    async function loadRequiredFields() {
      try {
        const raw = await getSetting(REQUIRED_FIELDS_KEY)
        if (!mounted) return
        if (!raw) {
          setRequiredFields(DEFAULT_REQUIRED_FIELDS)
          return
        }
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((field) => CLIENT_IMPORT_FIELDS.includes(field)) as Array<
            keyof ClientImportMapping
          >
          setRequiredFields(valid.length > 0 ? valid : DEFAULT_REQUIRED_FIELDS)
        } else {
          setRequiredFields(DEFAULT_REQUIRED_FIELDS)
        }
      } catch {
        setRequiredFields(DEFAULT_REQUIRED_FIELDS)
      }
    }
    loadRequiredFields()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!canEditRequired) return
    void loadRuntimeConfig()
  }, [canEditRequired, loadRuntimeConfig])

  useEffect(() => {
    if (!canEditRequired) return
    void loadPlatformConfig()
  }, [canEditRequired, loadPlatformConfig])

  useEffect(() => {
    if (!canEditRequired) return
    void loadPaymentProviders()
  }, [canEditRequired, loadPaymentProviders])

  useEffect(() => {
    if (!canEditRequired) return
    void loadAuditAutoExportStatus(true)
  }, [canEditRequired, loadAuditAutoExportStatus])

  useEffect(() => {
    let mounted = true
    const loadAdminBranding = async () => {
      if (!activeAdminId) {
        if (mounted) {
          setAdminAppName('')
          setAdminLogoUrl('')
          setAdminLogoLibrary([])
        }
        return
      }
      setAdminLogoLoading(true)
      try {
        const [branding, library] = await Promise.all([
          fetchAdminBrandingOverrides(activeAdminId),
          fetchAdminLogoLibrary(activeAdminId),
        ])
        if (!mounted) return
        setAdminAppName(branding.appName)
        setAdminLogoUrl(branding.logoUrl)
        setAdminLogoLibrary(library)
      } finally {
        if (mounted) setAdminLogoLoading(false)
      }
    }

    void loadAdminBranding()
    return () => {
      mounted = false
    }
  }, [activeAdminId])

  const saveAdminAppName = async () => {
    if (!activeAdminId) return
    const normalized = String(adminAppName || '').trim()
    setAdminAppName(normalized)
    try {
      setAdminNameSaving(true)
      await saveAdminAppNameOverride(activeAdminId, normalized)
      toast({
        title: 'Nom enregistré',
        description: normalized
          ? "Le nom d'entreprise de cet admin est appliqué."
          : 'Le nom global sera utilisé.',
      })
      void logAction('settings.adminBranding.appName.save.success', {
        adminId: activeAdminId,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'enregistrer le nom d'entreprise."
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.adminBranding.appName.save.error', { message })
    } finally {
      setAdminNameSaving(false)
    }
  }

  const saveImportAliases = async () => {
    void logAction('settings.importAliases.save.start')
    setImportAliasesError('')
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(importAliasesText)
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Format JSON invalide.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JSON invalide.'
      setImportAliasesError(message)
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.importAliases.save.error', { message })
      return
    }
    try {
      setImportAliasesSaving(true)
      await setSetting(userScopedKey('import_clients_aliases'), JSON.stringify(parsed))
      toast({ title: 'Enregistré', description: 'Format d’import sauvegardé.' })
      void logAction('settings.importAliases.save.success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de sauvegarde.'
      setImportAliasesError(message)
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.importAliases.save.error', { message })
    } finally {
      setImportAliasesSaving(false)
    }
  }

  const resetImportAliases = () => {
    void logAction('settings.importAliases.reset')
    setImportAliasesText(JSON.stringify(DEFAULT_IMPORT_ALIASES, null, 2))
    setImportAliasesError('')
    toast({ title: 'Réinitialisé', description: 'Format d’import réinitialisé.' })
  }

  const saveReportFormat = async () => {
    void logAction('settings.reportFormat.save.start', { reportFormat })
    try {
      setReportFormatSaving(true)
      await setSetting(userScopedKey('import_report_format'), reportFormat)
      toast({ title: 'Enregistré', description: 'Format de rapport sauvegardé.' })
      void logAction('settings.reportFormat.save.success', { reportFormat })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de sauvegarde.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.reportFormat.save.error', { message })
    } finally {
      setReportFormatSaving(false)
    }
  }

  const toggleRequiredField = (field: keyof ClientImportMapping) => {
    void logAction('settings.requiredFields.toggle', { field })
    setRequiredFields((prev) => {
      if (prev.includes(field)) {
        return prev.filter((item) => item !== field)
      }
      return [...prev, field]
    })
  }

  const saveRequiredFields = async () => {
    void logAction('settings.requiredFields.save.start', { requiredFields })
    try {
      setRequiredFieldsSaving(true)
      const sorted = requiredFields.filter((field) => CLIENT_IMPORT_FIELDS.includes(field))
      await setSetting(REQUIRED_FIELDS_KEY, JSON.stringify(sorted))
      toast({ title: 'Enregistré', description: 'Champs obligatoires sauvegardés.' })
      void logAction('settings.requiredFields.save.success', { requiredFields: sorted })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de sauvegarde.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.requiredFields.save.error', { message })
    } finally {
      setRequiredFieldsSaving(false)
    }
  }

  const saveRuntimeConfig = async () => {
    void logAction('settings.runtimeConfig.save.start')
    let apiBaseUrl = ''
    let cloudinarySignUrl = ''
    try {
      apiBaseUrl = validateRuntimeApiBaseUrl(normalizeApiBaseUrl(runtimeApiBaseUrl))
      cloudinarySignUrl = validateRuntimeSignUrl(normalizeSignUrl(runtimeSignUrl))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'URL runtime invalide.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.runtimeConfig.save.error', { message })
      return
    }

    try {
      setRuntimeConfigSaving(true)
      const nextState = await updateRuntimeConfig({ apiBaseUrl, cloudinarySignUrl })
      setRuntimeApiBaseUrl(nextState.apiBaseUrl || '')
      setRuntimeSignUrl(nextState.cloudinarySignUrl || '')
      setRuntimeConfigSource(nextState.source || 'default')
      setRuntimeConfigUserPath(nextState.userPath)
      setRuntimeConfigPortablePath(nextState.portablePath)
      setRuntimeConfigWrittenPath(nextState.writtenPath)
      toast({ title: 'Enregistré', description: 'Configuration API mise à jour.' })
      void logAction('settings.runtimeConfig.save.success', {
        source: nextState.source,
        writtenPath: nextState.writtenPath || null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de sauvegarde de la configuration API.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.runtimeConfig.save.error', { message })
    } finally {
      setRuntimeConfigSaving(false)
    }
  }

  const reloadRuntimeConfig = async () => {
    if (runtimeConfigReloading || runtimeConfigSaving) return
    void logAction('settings.runtimeConfig.reload.start')
    setRuntimeConfigReloading(true)
    try {
      await loadRuntimeConfig()
      toast({ title: 'Rechargé', description: 'Configuration API relue.' })
      void logAction('settings.runtimeConfig.reload.success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de recharger la configuration API.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.runtimeConfig.reload.error', { message })
    } finally {
      setRuntimeConfigReloading(false)
    }
  }

  const openRuntimeConfigDirectory = async () => {
    if (runtimeConfigOpeningFolder || runtimeConfigSaving) return
    void logAction('settings.runtimeConfig.openFolder.start')
    setRuntimeConfigOpeningFolder(true)
    if (!openRuntimeConfigFolder) {
      const message = "Action indisponible hors application desktop."
      toast({ title: 'Information', description: message })
      void logAction('settings.runtimeConfig.openFolder.error', { message })
      setRuntimeConfigOpeningFolder(false)
      return
    }
    try {
      const response = await openRuntimeConfigFolder()
      const payload = (response || {}) as { success?: boolean; error?: string }
      if (payload.success === false) {
        throw new Error(payload.error || "Impossible d'ouvrir le dossier de configuration.")
      }
      toast({ title: 'Dossier ouvert', description: 'Le dossier de configuration a été ouvert.' })
      void logAction('settings.runtimeConfig.openFolder.success')
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'ouvrir le dossier de configuration."
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.runtimeConfig.openFolder.error', { message })
    } finally {
      setRuntimeConfigOpeningFolder(false)
    }
  }

  const reloadGovernanceConfig = async () => {
    if (platformConfigReloading || platformConfigSaving) return
    setPlatformConfigReloading(true)
    try {
      await loadPlatformConfig()
      await loadPaymentProviders()
      await loadAuditAutoExportStatus(true)
    } finally {
      setPlatformConfigReloading(false)
    }
  }

  const saveGovernanceConfig = async () => {
    void logAction('settings.governance.save.start')
    const webhookUrl = String(platformConfigDraft.auditCompliance.alertWebhookUrl || '').trim()
    if (webhookUrl && !isValidHttpUrl(webhookUrl)) {
      const message = "L'URL webhook d'alerte est invalide."
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.save.error', { message })
      return
    }
    const logoUrl = String(platformConfigDraft.branding.logoUrl || '').trim()
    if (logoUrl && !logoUrl.startsWith('/') && !isValidHttpUrl(logoUrl)) {
      const message = "L'URL du logo doit être une URL http(s) ou un chemin local (/logo.png)."
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.save.error', { message })
      return
    }
    const waveApiBaseUrl = String(paymentProviderSettings.wave.apiBaseUrl || '').trim()
    if (waveApiBaseUrl && !isValidHttpUrl(waveApiBaseUrl)) {
      const message = "L'URL API Wave est invalide."
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.save.error', { message })
      return
    }
    const orangeApiBaseUrl = String(paymentProviderSettings.orangeMoney.apiBaseUrl || '').trim()
    if (orangeApiBaseUrl && !isValidHttpUrl(orangeApiBaseUrl)) {
      const message = "L'URL API Orange Money est invalide."
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.save.error', { message })
      return
    }

    try {
      setPlatformConfigSaving(true)
      const savedProviders = await savePaymentProviderSettings({
        wave: {
          apiBaseUrl: paymentProviderSettings.wave.apiBaseUrl,
          initiationPath: paymentProviderSettings.wave.initiationPath,
          merchantId: paymentProviderSettings.wave.merchantId,
          apiKey: paymentProviderSettings.wave.apiKey,
          apiSecret: paymentProviderSettings.wave.apiSecret,
          webhookSecret: paymentProviderSettings.wave.webhookSecret,
        },
        orangeMoney: {
          apiBaseUrl: paymentProviderSettings.orangeMoney.apiBaseUrl,
          initiationPath: paymentProviderSettings.orangeMoney.initiationPath,
          merchantCode: paymentProviderSettings.orangeMoney.merchantCode,
          clientId: paymentProviderSettings.orangeMoney.clientId,
          clientSecret: paymentProviderSettings.orangeMoney.clientSecret,
          webhookSecret: paymentProviderSettings.orangeMoney.webhookSecret,
        },
      })
      setPaymentProviderSettings(savedProviders)
      const saved = await savePlatformConfig(platformConfigDraft)
      setPlatformConfigDraft(saved)
      applyBrandingToDocument(saved)
      await loadAuditAutoExportStatus(true)
      if (saved.maintenance.enabled) {
        void sendComplianceWebhookAlert('security', {
          event: 'maintenance',
          message: saved.maintenance.message,
          actor: user?.id || 'unknown',
        })
      }
      toast({ title: 'Enregistré', description: 'Configuration gouvernance sauvegardée.' })
      void logAction('settings.governance.save.success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec sauvegarde gouvernance.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.save.error', { message })
    } finally {
      setPlatformConfigSaving(false)
    }
  }

  const applyAuditRetentionNow = async () => {
    if (auditRetentionApplying) return
    void logAction('settings.governance.audit.retention.start')
    setAuditRetentionApplying(true)
    try {
      const resultat = await applyAuditLogsRetention()
      toast({
        title: 'Rétention appliquée',
        description: `${resultat.deletedCount} log(s) supprimé(s) selon la politique (${resultat.retentionDays} jour(s)).`,
      })
      void logAction('settings.governance.audit.retention.success', {
        deleted: resultat.deletedCount,
        retentionDays: resultat.retentionDays,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec application rétention.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.audit.retention.error', { message })
    } finally {
      setAuditRetentionApplying(false)
    }
  }

  const exportAuditNow = async () => {
    if (auditExporting) return
    void logAction('settings.governance.audit.export.start')
    setAuditExporting(true)
    try {
      const format = platformConfigDraft.auditCompliance.autoExportFormat
      const { blob, fileName } = await downloadAuditLogsExport(format)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast({ title: 'Export prêt', description: `Export ${format.toUpperCase()} généré côté serveur.` })
      void logAction('settings.governance.audit.export.success', { format, fileName })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec export logs.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.audit.export.error', { message })
    } finally {
      setAuditExporting(false)
    }
  }

  const runAuditAutoExportNow = async () => {
    if (auditAutoExportRunning) return
    void logAction('settings.governance.audit.autoExport.run.start')
    setAuditAutoExportRunning(true)
    try {
      const resultat = await triggerAuditAutoExportNow(true)
      await loadAuditAutoExportStatus(true)
      toast({
        title: resultat.executed ? 'Auto-export backend lancé' : 'Auto-export backend inchangé',
        description: resultat.executed
          ? `Snapshot backend généré (${resultat.export?.count || 0} logs).`
          : "Aucun nouveau snapshot n'était nécessaire pour l'instant.",
      })
      void logAction('settings.governance.audit.autoExport.run.success', resultat)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de lancer l'auto-export backend."
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.audit.autoExport.run.error', { message })
    } finally {
      setAuditAutoExportRunning(false)
    }
  }

  const downloadLatestAutoExport = async () => {
    if (auditAutoExportDownloading) return
    void logAction('settings.governance.audit.autoExport.download.start')
    setAuditAutoExportDownloading(true)
    try {
      const { blob, fileName } = await downloadLatestAuditAutoExport()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      void logAction('settings.governance.audit.autoExport.download.success', { fileName })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de télécharger le dernier auto-export."
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.audit.autoExport.download.error', { message })
    } finally {
      setAuditAutoExportDownloading(false)
    }
  }

  const testAlertWebhook = async () => {
    if (webhookTesting) return
    void logAction('settings.governance.audit.webhook.test.start')
    setWebhookTesting(true)
    try {
      const resultat = await testComplianceWebhookServerSide()
      toast({
        title: 'Webhook testé',
        description: !resultat.enabled
          ? "Webhook désactivé: activez l'option pour envoyer réellement le test."
          : !resultat.configured
            ? "Aucune URL webhook n'est configurée."
            : resultat.sent
              ? 'Demande de test envoyée par le backend au webhook.'
              : 'Le backend a tenté le test webhook, mais la cible a refusé ou n’a pas répondu.',
      })
      void logAction('settings.governance.audit.webhook.test.success', resultat)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec test webhook.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.audit.webhook.test.error', { message })
    } finally {
      setWebhookTesting(false)
    }
  }

  const useGlobalLogo = async () => {
    setAdminLogoUrl('')
    if (!activeAdminId) return
    try {
      setAdminLogoSaving(true)
      await saveAdminLogoOverride(activeAdminId, '')
      toast({ title: 'Réinitialisé', description: 'Le logo global sera utilisé.' })
      void logAction('settings.adminBranding.logo.reset.success', { adminId: activeAdminId })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de réinitialiser le logo admin.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.adminBranding.logo.reset.error', { message })
    } finally {
      setAdminLogoSaving(false)
    }
  }

  const selectLogoFromLibrary = async (logoUrl: string) => {
    const normalized = String(logoUrl || '').trim()
    if (!normalized || !activeAdminId) return
    setAdminLogoUrl(normalized)
    try {
      setAdminLogoSaving(true)
      await saveAdminLogoOverride(activeAdminId, normalized)
      const nextLibrary = await appendAdminLogoToLibrary(activeAdminId, normalized)
      setAdminLogoLibrary(nextLibrary)
      toast({ title: 'Logo appliqué', description: 'Le logo sélectionné est maintenant actif.' })
      void logAction('settings.adminBranding.logo.select.success', { adminId: activeAdminId })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de sélectionner ce logo.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.adminBranding.logo.select.error', { message })
    } finally {
      setAdminLogoSaving(false)
    }
  }

  const uploadAdminLogoFile = async (file: File) => {
    if (!activeAdminId) {
      toast({ title: 'Erreur', description: 'Admin introuvable.', variant: 'destructive' })
      return
    }

    try {
      setAdminLogoUploading(true)
      const uploadedUrl = await uploadToCloudinary(file)
      await saveAdminLogoOverride(activeAdminId, uploadedUrl)
      const nextLibrary = await appendAdminLogoToLibrary(activeAdminId, uploadedUrl)
      setAdminLogoLibrary(nextLibrary)
      setAdminLogoUrl(uploadedUrl)
      toast({ title: 'Logo uploadé', description: 'Logo enregistré sur Cloudinary et appliqué.' })
      void logAction('settings.adminBranding.logo.upload.success', {
        adminId: activeAdminId,
        fileName: file.name,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec upload logo Cloudinary.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.adminBranding.logo.upload.error', { message })
    } finally {
      setAdminLogoUploading(false)
    }
  }

  const saveOwnPassword = async () => {
    if (passwordSaving) return
    const safeCurrentPassword = String(currentPassword || '')
    const safeNewPassword = String(newPassword || '')
    const safeConfirmPassword = String(confirmPassword || '')

    if (!safeCurrentPassword || !safeNewPassword || !safeConfirmPassword) {
      toast({ title: 'Erreur', description: 'Tous les champs mot de passe sont requis.', variant: 'destructive' })
      return
    }
    if (safeNewPassword.length < 8) {
      toast({
        title: 'Erreur',
        description: 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
        variant: 'destructive',
      })
      return
    }
    if (safeCurrentPassword === safeNewPassword) {
      toast({
        title: 'Erreur',
        description: 'Le nouveau mot de passe doit être différent de l’actuel.',
        variant: 'destructive',
      })
      return
    }
    if (safeNewPassword !== safeConfirmPassword) {
      toast({
        title: 'Erreur',
        description: 'La confirmation du nouveau mot de passe ne correspond pas.',
        variant: 'destructive',
      })
      return
    }

    void logAction('settings.accountPassword.change.start')
    setPasswordSaving(true)
    try {
      await changeOwnPassword(safeCurrentPassword, safeNewPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast({ title: 'Mot de passe mis à jour', description: 'Le mot de passe du compte connecté a été modifié.' })
      void logAction('settings.accountPassword.change.success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de changer le mot de passe.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.accountPassword.change.error', { message })
    } finally {
      setPasswordSaving(false)
    }
  }

  if (!canEdit) {
    return (
      <div className="mx-auto w-full max-w-6xl min-w-0 overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
        <SettingsHeaderSection title="Paramètres" />
        <p className="mt-4 text-muted-foreground">Vous n'êtes pas autorisé à modifier ces paramètres.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
      <SettingsHeaderSection title="Paramètres" />

      {canEditAdminBranding ? (
        <SettingsAdminBrandingSection
          appName={adminAppName}
          logoUrl={adminLogoUrl}
          onAppNameChange={setAdminAppName}
          onSaveAppName={saveAdminAppName}
          onUseGlobalLogo={useGlobalLogo}
          onSelectLogo={selectLogoFromLibrary}
          onUploadLogoFile={uploadAdminLogoFile}
          isLoading={adminLogoLoading}
          isSaving={adminLogoSaving}
          isUploading={adminLogoUploading}
          isSavingName={adminNameSaving}
          globalAppName={platformConfigDraft.branding.appName}
          globalLogoUrl={platformConfigDraft.branding.logoUrl}
          adminScopeLabel={adminScopeLabel || 'Mon espace admin'}
          logoLibrary={adminLogoLibrary}
        />
      ) : null}

      <SettingsAccountSecuritySection
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSave={saveOwnPassword}
        isSaving={passwordSaving}
        roleLabel={roleLabel}
        isImpersonating={Boolean(impersonation?.adminId)}
      />

      <SettingsRequiredFieldsSection
        requiredFields={requiredFields}
        isSaving={requiredFieldsSaving}
        canEdit={canEditRequired}
        onToggle={toggleRequiredField}
        onSave={saveRequiredFields}
      />

      <SettingsImportAliasesSection
        value={importAliasesText}
        error={importAliasesError}
        isSaving={importAliasesSaving}
        onChange={setImportAliasesText}
        onSave={saveImportAliases}
        onReset={resetImportAliases}
        onOpenImport={() => {
          void logAction('settings.importAliases.openImport')
          navigate('/import/clients')
        }}
      />

      <SettingsReportSection
        value={reportFormat}
        onChange={setReportFormat}
        onSave={saveReportFormat}
        isSaving={reportFormatSaving}
      />

      {canEditRequired && (
        <SettingsRuntimeApiSection
          isElectron={isElectron}
          source={runtimeConfigSource}
          apiBaseUrl={runtimeApiBaseUrl}
          cloudinarySignUrl={runtimeSignUrl}
          userPath={runtimeConfigUserPath}
          portablePath={runtimeConfigPortablePath}
          writtenPath={runtimeConfigWrittenPath}
          isLoading={runtimeConfigLoading}
          isSaving={runtimeConfigSaving}
          isReloading={runtimeConfigReloading}
          isOpeningConfigFolder={runtimeConfigOpeningFolder}
          onApiBaseUrlChange={setRuntimeApiBaseUrl}
          onCloudinarySignUrlChange={setRuntimeSignUrl}
          onReload={reloadRuntimeConfig}
          onSave={saveRuntimeConfig}
          onOpenConfigFolder={openRuntimeConfigDirectory}
        />
      )}

      {canEditRequired && (
        <SettingsGovernanceSection
          value={platformConfigDraft}
          isLoading={platformConfigLoading}
          isSaving={platformConfigSaving}
          isReloading={platformConfigReloading}
          paymentProviders={paymentProviderSettings}
          isPaymentProvidersLoading={paymentProviderLoading}
          isApplyingAuditRetention={auditRetentionApplying}
          isExportingAudit={auditExporting}
          autoExportStatus={auditAutoExportStatus}
          isAutoExportStatusLoading={auditAutoExportStatusLoading}
          isRunningAutoExport={auditAutoExportRunning}
          isDownloadingAutoExport={auditAutoExportDownloading}
          isTestingWebhook={webhookTesting}
          onChange={(updater) => setPlatformConfigDraft((prev) => updater(prev))}
          onPaymentProvidersChange={(updater) => setPaymentProviderSettings((prev) => updater(prev))}
          onSave={saveGovernanceConfig}
          onReload={() => {
            void reloadGovernanceConfig()
          }}
          onApplyAuditRetention={applyAuditRetentionNow}
          onExportAuditNow={exportAuditNow}
          onRunAutoExportNow={runAuditAutoExportNow}
          onDownloadLatestAutoExport={downloadLatestAutoExport}
          onTestWebhook={testAlertWebhook}
        />
      )}

      {canEdit && <SettingsSignatureSection />}

      {canEditContracts && <SettingsContractsSection />}
    </div>
  )
}
