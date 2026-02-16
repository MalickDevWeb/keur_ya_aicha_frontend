import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useElectronAPI } from '@/hooks/useElectronAPI'
import { useToast } from '@/hooks/use-toast'
import { useActionLogger } from '@/lib/actionLogger'
import { CLIENT_IMPORT_FIELDS, DEFAULT_IMPORT_ALIASES, DEFAULT_REQUIRED_FIELDS, type ClientImportMapping } from '@/lib/importClients'
import { getSetting, setSetting } from '@/services/api'
import { deleteAuditLogs, listAuditLogs } from '@/services/api/auditLogs.api'
import {
  PlatformConfig,
  applyBrandingToDocument,
  getPlatformConfigSnapshot,
  refreshPlatformConfigFromServer,
  savePlatformConfig,
  sendComplianceWebhookAlert,
} from '@/services/platformConfig'
import { ensureRuntimeConfigLoaded, getRuntimeConfigSnapshot, updateRuntimeConfig } from '@/services/runtimeConfig'
import { SettingsHeaderSection } from './sections/SettingsHeaderSection'
import { SettingsGovernanceSection } from './sections/SettingsGovernanceSection'
import { SettingsImportAliasesSection } from './sections/SettingsImportAliasesSection'
import { SettingsRequiredFieldsSection } from './sections/SettingsRequiredFieldsSection'
import { SettingsReportSection } from './sections/SettingsReportSection'
import { SettingsRuntimeApiSection } from './sections/SettingsRuntimeApiSection'
import { safeJsonParse } from './utils'

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

export default function SettingsPage() {
  const { user } = useAuth()
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
  const [runtimeConfigUserPath, setRuntimeConfigUserPath] = useState<string | null>(null)
  const [runtimeConfigPortablePath, setRuntimeConfigPortablePath] = useState<string | null>(null)
  const [runtimeConfigWrittenPath, setRuntimeConfigWrittenPath] = useState<string | null>(null)
  const [platformConfigDraft, setPlatformConfigDraft] = useState<PlatformConfig>(getPlatformConfigSnapshot())
  const [platformConfigLoading, setPlatformConfigLoading] = useState(false)
  const [platformConfigSaving, setPlatformConfigSaving] = useState(false)

  const role = String(user?.role || '').toUpperCase()
  const canEdit = user && (role === 'ADMIN' || role === 'SUPER_ADMIN')
  const canEditRequired = role === 'SUPER_ADMIN'
  const userScopedKey = (key: string) => (user?.id ? `${key}:${user.id}` : key)

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
  }, [user?.id])

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
  }, [user?.id])

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
    const apiBaseUrl = normalizeApiBaseUrl(runtimeApiBaseUrl)
    const cloudinarySignUrl = normalizeSignUrl(runtimeSignUrl)

    if (apiBaseUrl && !isValidHttpUrl(apiBaseUrl)) {
      const message = "L'URL de l'API backend est invalide."
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.runtimeConfig.save.error', { message })
      return
    }

    if (cloudinarySignUrl && !isValidHttpUrl(cloudinarySignUrl)) {
      const message = "L'URL de signature Cloudinary est invalide."
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
    void logAction('settings.runtimeConfig.reload.start')
    try {
      await loadRuntimeConfig()
      toast({ title: 'Rechargé', description: 'Configuration API relue.' })
      void logAction('settings.runtimeConfig.reload.success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de recharger la configuration API.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.runtimeConfig.reload.error', { message })
    }
  }

  const openRuntimeConfigDirectory = async () => {
    void logAction('settings.runtimeConfig.openFolder.start')
    if (!openRuntimeConfigFolder) {
      const message = "Action indisponible hors application desktop."
      toast({ title: 'Information', description: message })
      void logAction('settings.runtimeConfig.openFolder.error', { message })
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

    try {
      setPlatformConfigSaving(true)
      const saved = await savePlatformConfig(platformConfigDraft)
      setPlatformConfigDraft(saved)
      applyBrandingToDocument(saved)
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
    void logAction('settings.governance.audit.retention.start')
    try {
      const retentionDays = Math.max(1, Number(platformConfigDraft.auditCompliance.retentionDays || 1))
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
      const logs = await listAuditLogs()
      const toDelete = logs
        .filter((log) => new Date(log.createdAt || 0).getTime() < cutoff)
        .map((log) => log.id)
      await deleteAuditLogs(toDelete)
      toast({
        title: 'Rétention appliquée',
        description: `${toDelete.length} log(s) supprimé(s) selon la politique.`,
      })
      void logAction('settings.governance.audit.retention.success', { deleted: toDelete.length })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec application rétention.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.audit.retention.error', { message })
    }
  }

  const exportAuditNow = async () => {
    void logAction('settings.governance.audit.export.start')
    try {
      const logs = await listAuditLogs()
      const format = platformConfigDraft.auditCompliance.autoExportFormat
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `audit_logs_${stamp}.${format}`
      let blob: Blob
      if (format === 'json') {
        blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
      } else {
        const headers = ['id', 'createdAt', 'actor', 'action', 'targetType', 'targetId', 'message', 'ipAddress']
        const rows = logs.map((log) =>
          headers
            .map((key) => {
              const raw = String((log as Record<string, unknown>)[key] ?? '')
              return `"${raw.replace(/"/g, '""')}"`
            })
            .join(',')
        )
        const csv = [headers.join(','), ...rows].join('\n')
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast({ title: 'Export prêt', description: `${logs.length} log(s) exporté(s).` })
      void logAction('settings.governance.audit.export.success', { count: logs.length, format })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec export logs.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.audit.export.error', { message })
    }
  }

  const testAlertWebhook = async () => {
    void logAction('settings.governance.audit.webhook.test.start')
    try {
      await sendComplianceWebhookAlert('security', {
        event: 'manual_test',
        actor: user?.id || 'unknown',
        message: 'Test webhook initié depuis paramètres Super Admin',
      })
      toast({
        title: 'Webhook testé',
        description: platformConfigDraft.auditCompliance.alertWebhookEnabled
          ? 'Demande de test envoyée au webhook.'
          : "Webhook désactivé: activez l'option pour envoyer réellement le test.",
      })
      void logAction('settings.governance.audit.webhook.test.success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec test webhook.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      void logAction('settings.governance.audit.webhook.test.error', { message })
    }
  }

  if (!canEdit) {
    return (
      <div className="p-6">
      <SettingsHeaderSection title="Paramètres" />
      <p className="mt-4 text-muted-foreground">Vous n'êtes pas autorisé à modifier ces paramètres.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <SettingsHeaderSection title="Paramètres" />

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
          onChange={(updater) => setPlatformConfigDraft((prev) => updater(prev))}
          onSave={saveGovernanceConfig}
          onReload={() => {
            void loadPlatformConfig()
          }}
          onApplyAuditRetention={applyAuditRetentionNow}
          onExportAuditNow={exportAuditNow}
          onTestWebhook={testAlertWebhook}
        />
      )}
    </div>
  )
}
