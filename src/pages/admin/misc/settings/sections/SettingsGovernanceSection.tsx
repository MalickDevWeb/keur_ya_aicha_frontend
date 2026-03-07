import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import type { AuditAutoExportStatus } from '@/services/api/auditLogs.api'
import type { PlatformConfig } from '@/services/platformConfig'

type SettingsGovernanceSectionProps = {
  value: PlatformConfig
  isLoading: boolean
  isSaving: boolean
  isReloading: boolean
  isApplyingAuditRetention: boolean
  isExportingAudit: boolean
  autoExportStatus: AuditAutoExportStatus | null
  isAutoExportStatusLoading: boolean
  isRunningAutoExport: boolean
  isDownloadingAutoExport: boolean
  isTestingWebhook: boolean
  onChange: (updater: (prev: PlatformConfig) => PlatformConfig) => void
  onSave: () => void
  onReload: () => void
  onApplyAuditRetention: () => void
  onExportAuditNow: () => void
  onRunAutoExportNow: () => void
  onDownloadLatestAutoExport: () => void
  onTestWebhook: () => void
}

function toPositiveNumber(value: string, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

export function SettingsGovernanceSection({
  value,
  isLoading,
  isSaving,
  isReloading,
  isApplyingAuditRetention,
  isExportingAudit,
  autoExportStatus,
  isAutoExportStatusLoading,
  isRunningAutoExport,
  isDownloadingAutoExport,
  isTestingWebhook,
  onChange,
  onSave,
  onReload,
  onApplyAuditRetention,
  onExportAuditNow,
  onRunAutoExportNow,
  onDownloadLatestAutoExport,
  onTestWebhook,
}: SettingsGovernanceSectionProps) {
  const isBusy =
    isLoading ||
    isSaving ||
    isReloading ||
    isApplyingAuditRetention ||
    isExportingAudit ||
    isRunningAutoExport ||
    isDownloadingAutoExport ||
    isTestingWebhook

  const formatDateTime = (value: string | null | undefined): string =>
    value ? new Date(value).toLocaleString('fr-FR') : 'Jamais'

  const setMaintenanceEnabled = (checked: boolean) =>
    onChange((prev) => ({
      ...prev,
      maintenance: { ...prev.maintenance, enabled: checked },
    }))

  const setMaintenanceMessage = (next: string) =>
    onChange((prev) => ({
      ...prev,
      maintenance: { ...prev.maintenance, message: next },
    }))

  const setSessionField = (
    key: 'sessionDurationMinutes' | 'inactivityTimeoutMinutes' | 'maxFailedLogins' | 'lockoutMinutes',
    next: string
  ) =>
    onChange((prev) => ({
      ...prev,
      sessionSecurity: {
        ...prev.sessionSecurity,
        [key]: toPositiveNumber(next, prev.sessionSecurity[key]),
      },
    }))

  const setPaymentField = (
    key:
      | 'graceDays'
      | 'latePenaltyPercent'
      | 'recipientName'
      | 'waveRecipientPhone'
      | 'orangeRecipientPhone',
    next: string
  ) =>
    onChange((prev) => ({
      ...prev,
      paymentRules: {
        ...prev.paymentRules,
        [key]:
          key === 'graceDays' || key === 'latePenaltyPercent'
            ? toPositiveNumber(next, prev.paymentRules[key])
            : next,
      },
    }))

  const setPaymentBlockOnOverdue = (checked: boolean) =>
    onChange((prev) => ({
      ...prev,
      paymentRules: { ...prev.paymentRules, blockOnOverdue: checked },
    }))

  const setOrangeOtpEnabled = (checked: boolean) =>
    onChange((prev) => ({
      ...prev,
      paymentRules: { ...prev.paymentRules, orangeOtpEnabled: checked },
    }))

  const setDocumentsField = (key: 'maxUploadMb' | 'retentionDays', next: string) =>
    onChange((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [key]: toPositiveNumber(next, prev.documents[key]),
      },
    }))

  const setAllowedMimeTypes = (next: string) =>
    onChange((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        allowedMimeTypes: next
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      },
    }))

  const setNotificationChannel = (key: 'sms' | 'email' | 'whatsapp', checked: boolean) =>
    onChange((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        channels: { ...prev.notifications.channels, [key]: checked },
      },
    }))

  const setNotificationEvent = (key: 'maintenance' | 'loginFailure' | 'paymentOverdue' | 'apiError', checked: boolean) =>
    onChange((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        events: { ...prev.notifications.events, [key]: checked },
      },
    }))

  const setNotificationTemplate = (
    key: 'maintenance' | 'loginFailure' | 'paymentOverdue' | 'apiError',
    next: string
  ) =>
    onChange((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        templates: { ...prev.notifications.templates, [key]: next },
      },
    }))

  const setBrandingField = (key: 'appName' | 'logoUrl' | 'primaryColor' | 'footerText', next: string) =>
    onChange((prev) => ({
      ...prev,
      branding: { ...prev.branding, [key]: next },
    }))

  const setAuditField = (key: 'retentionDays' | 'autoExportIntervalHours', next: string) =>
    onChange((prev) => ({
      ...prev,
      auditCompliance: {
        ...prev.auditCompliance,
        [key]: toPositiveNumber(next, prev.auditCompliance[key]),
      },
    }))

  const setAuditBoolean = (
    key: 'autoExportEnabled' | 'alertWebhookEnabled' | 'alertOnApiError' | 'alertOnSecurityEvent',
    checked: boolean
  ) =>
    onChange((prev) => ({
      ...prev,
      auditCompliance: {
        ...prev.auditCompliance,
        [key]: checked,
      },
    }))

  const setAuditString = (key: 'alertWebhookUrl' | 'alertWebhookSecret', next: string) =>
    onChange((prev) => ({
      ...prev,
      auditCompliance: { ...prev.auditCompliance, [key]: next },
    }))

  return (
    <section className="mt-8 min-w-0 space-y-6 overflow-x-hidden sm:mt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-medium">Gouvernance Plateforme (Super Admin)</h3>
          <p className="text-sm text-muted-foreground">
            Paramètres globaux: maintenance, sécurité, paiements, documents, notifications, branding et conformité.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={onReload} disabled={isBusy} className="w-full sm:w-auto">
            {isReloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isReloading ? 'Rechargement...' : 'Recharger'}
          </Button>
          <Button onClick={onSave} disabled={isBusy} className="w-full sm:w-auto">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <div className="min-w-0 space-y-3 rounded-xl border border-border bg-white/70 p-4">
        <h4 className="font-semibold">Mode Maintenance Global</h4>
        <div className="flex items-center gap-3">
          <Switch checked={value.maintenance.enabled} onCheckedChange={setMaintenanceEnabled} />
          <span className="text-sm text-muted-foreground">
            Bloquer les actions d’écriture sur la plateforme.
          </span>
        </div>
        <Textarea
          value={value.maintenance.message}
          onChange={(event) => setMaintenanceMessage(event.target.value)}
          rows={2}
          placeholder="Message maintenance affiché à tous"
        />
      </div>

      <div className="min-w-0 space-y-3 rounded-xl border border-border bg-white/70 p-4">
        <h4 className="font-semibold">Sécurité Session</h4>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Durée max session (minutes)</span>
            <Input
              className="min-w-0"
              type="number"
              min={5}
              value={value.sessionSecurity.sessionDurationMinutes}
              onChange={(event) => setSessionField('sessionDurationMinutes', event.target.value)}
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Timeout inactivité (minutes)</span>
            <Input
              className="min-w-0"
              type="number"
              min={1}
              value={value.sessionSecurity.inactivityTimeoutMinutes}
              onChange={(event) => setSessionField('inactivityTimeoutMinutes', event.target.value)}
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Échecs login avant blocage</span>
            <Input
              className="min-w-0"
              type="number"
              min={1}
              value={value.sessionSecurity.maxFailedLogins}
              onChange={(event) => setSessionField('maxFailedLogins', event.target.value)}
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Durée blocage login (minutes)</span>
            <Input
              className="min-w-0"
              type="number"
              min={1}
              value={value.sessionSecurity.lockoutMinutes}
              onChange={(event) => setSessionField('lockoutMinutes', event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="min-w-0 space-y-3 rounded-xl border border-border bg-white/70 p-4">
        <h4 className="font-semibold">Règles Paiement</h4>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Jours de grâce</span>
            <Input
              className="min-w-0"
              type="number"
              min={0}
              value={value.paymentRules.graceDays}
              onChange={(event) => setPaymentField('graceDays', event.target.value)}
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Pénalité retard (%)</span>
            <Input
              className="min-w-0"
              type="number"
              min={0}
              value={value.paymentRules.latePenaltyPercent}
              onChange={(event) => setPaymentField('latePenaltyPercent', event.target.value)}
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Nom bénéficiaire Mobile Money</span>
            <Input
              className="min-w-0"
              value={value.paymentRules.recipientName}
              onChange={(event) => setPaymentField('recipientName', event.target.value)}
              placeholder="Ex: Keur Ya Aicha"
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Numéro bénéficiaire Wave</span>
            <Input
              className="min-w-0"
              value={value.paymentRules.waveRecipientPhone}
              onChange={(event) => setPaymentField('waveRecipientPhone', event.target.value)}
              placeholder="Ex: 771719013"
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Numéro bénéficiaire Orange Money</span>
            <Input
              className="min-w-0"
              value={value.paymentRules.orangeRecipientPhone}
              onChange={(event) => setPaymentField('orangeRecipientPhone', event.target.value)}
              placeholder="Ex: 771719013"
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={value.paymentRules.blockOnOverdue} onCheckedChange={setPaymentBlockOnOverdue} />
          <span className="text-sm text-muted-foreground">Bloquer l’accès si abonnement en retard</span>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={value.paymentRules.orangeOtpEnabled} onCheckedChange={setOrangeOtpEnabled} />
          <span className="text-sm text-muted-foreground">Activer la validation OTP pour Orange Money</span>
        </div>
      </div>

      <div className="min-w-0 space-y-3 rounded-xl border border-border bg-white/70 p-4">
        <h4 className="font-semibold">Documents</h4>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Taille max upload (MB)</span>
            <Input
              className="min-w-0"
              type="number"
              min={1}
              value={value.documents.maxUploadMb}
              onChange={(event) => setDocumentsField('maxUploadMb', event.target.value)}
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Rétention documents (jours)</span>
            <Input
              className="min-w-0"
              type="number"
              min={1}
              value={value.documents.retentionDays}
              onChange={(event) => setDocumentsField('retentionDays', event.target.value)}
            />
          </label>
        </div>
        <label className="min-w-0 space-y-1">
          <span className="text-xs text-muted-foreground">Types autorisés (MIME, séparés par virgule)</span>
          <Input
            className="min-w-0"
            value={value.documents.allowedMimeTypes.join(', ')}
            onChange={(event) => setAllowedMimeTypes(event.target.value)}
            placeholder="application/pdf, image/jpeg, image/png"
          />
        </label>
      </div>

      <div className="min-w-0 space-y-3 rounded-xl border border-border bg-white/70 p-4">
        <h4 className="font-semibold">Notifications (Templates + Événements)</h4>
        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={value.notifications.channels.sms} onCheckedChange={(next) => setNotificationChannel('sms', next)} />
            SMS
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={value.notifications.channels.email} onCheckedChange={(next) => setNotificationChannel('email', next)} />
            Email
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={value.notifications.channels.whatsapp}
              onCheckedChange={(next) => setNotificationChannel('whatsapp', next)}
            />
            WhatsApp
          </label>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="min-w-0 flex items-center gap-2 text-sm">
            <Switch
              checked={value.notifications.events.maintenance}
              onCheckedChange={(next) => setNotificationEvent('maintenance', next)}
            />
            Événement maintenance
          </label>
          <label className="min-w-0 flex items-center gap-2 text-sm">
            <Switch
              checked={value.notifications.events.loginFailure}
              onCheckedChange={(next) => setNotificationEvent('loginFailure', next)}
            />
            Échec login
          </label>
          <label className="min-w-0 flex items-center gap-2 text-sm">
            <Switch
              checked={value.notifications.events.paymentOverdue}
              onCheckedChange={(next) => setNotificationEvent('paymentOverdue', next)}
            />
            Paiement en retard
          </label>
          <label className="min-w-0 flex items-center gap-2 text-sm">
            <Switch checked={value.notifications.events.apiError} onCheckedChange={(next) => setNotificationEvent('apiError', next)} />
            Erreur API
          </label>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Template maintenance</span>
            <Textarea
              rows={2}
              value={value.notifications.templates.maintenance}
              onChange={(event) => setNotificationTemplate('maintenance', event.target.value)}
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Template login failure</span>
            <Textarea
              rows={2}
              value={value.notifications.templates.loginFailure}
              onChange={(event) => setNotificationTemplate('loginFailure', event.target.value)}
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Template paiement en retard</span>
            <Textarea
              rows={2}
              value={value.notifications.templates.paymentOverdue}
              onChange={(event) => setNotificationTemplate('paymentOverdue', event.target.value)}
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Template erreur API</span>
            <Textarea
              rows={2}
              value={value.notifications.templates.apiError}
              onChange={(event) => setNotificationTemplate('apiError', event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="min-w-0 space-y-3 rounded-xl border border-border bg-white/70 p-4">
        <h4 className="font-semibold">Branding</h4>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Nom application</span>
            <Input className="min-w-0" value={value.branding.appName} onChange={(event) => setBrandingField('appName', event.target.value)} />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">URL logo</span>
            <Input className="min-w-0" value={value.branding.logoUrl} onChange={(event) => setBrandingField('logoUrl', event.target.value)} />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Couleur principale</span>
            <div className="flex min-w-0 items-center gap-2">
              <Input
                className="min-w-0"
                value={value.branding.primaryColor}
                onChange={(event) => setBrandingField('primaryColor', event.target.value)}
                placeholder="#121B53"
              />
              <input
                type="color"
                className="h-10 w-12 rounded border border-input bg-background p-1"
                value={value.branding.primaryColor}
                onChange={(event) => setBrandingField('primaryColor', event.target.value)}
              />
            </div>
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Pied de page</span>
            <Input
              className="min-w-0"
              value={value.branding.footerText}
              onChange={(event) => setBrandingField('footerText', event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="min-w-0 space-y-3 rounded-xl border border-border bg-white/70 p-4">
        <h4 className="font-semibold">Audit & Conformité</h4>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Rétention logs (jours)</span>
            <Input
              className="min-w-0"
              type="number"
              min={1}
              value={value.auditCompliance.retentionDays}
              onChange={(event) => setAuditField('retentionDays', event.target.value)}
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Fréquence export auto (heures)</span>
            <Input
              className="min-w-0"
              type="number"
              min={1}
              value={value.auditCompliance.autoExportIntervalHours}
              onChange={(event) => setAuditField('autoExportIntervalHours', event.target.value)}
            />
          </label>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="min-w-0 flex items-center gap-2 text-sm">
            <Switch checked={value.auditCompliance.autoExportEnabled} onCheckedChange={(next) => setAuditBoolean('autoExportEnabled', next)} />
            Export auto des logs
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs text-muted-foreground">Format export auto</span>
            <Select
              value={value.auditCompliance.autoExportFormat}
              onValueChange={(next) =>
                onChange((prev) => ({
                  ...prev,
                  auditCompliance: {
                    ...prev.auditCompliance,
                    autoExportFormat: next === 'json' ? 'json' : 'csv',
                  },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="min-w-0 flex items-center gap-2 text-sm">
            <Switch
              checked={value.auditCompliance.alertWebhookEnabled}
              onCheckedChange={(next) => setAuditBoolean('alertWebhookEnabled', next)}
            />
            Webhook alertes activé
          </label>
          <label className="min-w-0 flex items-center gap-2 text-sm">
            <Switch checked={value.auditCompliance.alertOnApiError} onCheckedChange={(next) => setAuditBoolean('alertOnApiError', next)} />
            Alerter sur erreurs API
          </label>
          <label className="min-w-0 flex items-center gap-2 text-sm">
            <Switch
              checked={value.auditCompliance.alertOnSecurityEvent}
              onCheckedChange={(next) => setAuditBoolean('alertOnSecurityEvent', next)}
            />
            Alerter sur événements sécurité
          </label>
        </div>
        <label className="min-w-0 space-y-1">
          <span className="text-xs text-muted-foreground">URL webhook alertes</span>
          <Input
            className="min-w-0"
            value={value.auditCompliance.alertWebhookUrl}
            onChange={(event) => setAuditString('alertWebhookUrl', event.target.value)}
            placeholder="https://hooks.example.com/kya"
          />
        </label>
        <label className="min-w-0 space-y-1">
          <span className="text-xs text-muted-foreground">Secret webhook (optionnel)</span>
          <Input
            className="min-w-0"
            value={value.auditCompliance.alertWebhookSecret}
            onChange={(event) => setAuditString('alertWebhookSecret', event.target.value)}
            placeholder="secret"
          />
        </label>
        <div className="min-w-0 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="font-medium">État du dernier auto-export backend</span>
            {isAutoExportStatusLoading ? (
              <span className="text-muted-foreground">Chargement du statut...</span>
            ) : autoExportStatus ? (
              <>
                <span className="text-muted-foreground">
                  Activé: {autoExportStatus.enabled ? 'oui' : 'non'} | Format: {autoExportStatus.format.toUpperCase()} | Fréquence: {autoExportStatus.intervalHours}h
                </span>
                <span className="text-muted-foreground">
                  Cron: {autoExportStatus.endpointPath} avec header `{autoExportStatus.headerName}` | Secret configuré: {autoExportStatus.cronSecretConfigured ? 'oui' : 'non'}
                </span>
                <span className="text-muted-foreground">
                  Échéance: {autoExportStatus.due ? 'export dû maintenant' : `prochain export prévu le ${formatDateTime(autoExportStatus.nextDueAt)}`}
                </span>
                <span className="text-muted-foreground">
                  Dernier export: {autoExportStatus.lastExport ? `${formatDateTime(autoExportStatus.lastExport.generatedAt)} | ${autoExportStatus.lastExport.fileName}` : 'aucun snapshot généré'}
                </span>
                {autoExportStatus.lastExport ? (
                  <>
                    <span className="text-muted-foreground">
                      Volume: {autoExportStatus.lastExport.count} logs ({autoExportStatus.lastExport.adminAuditCount} audits admin, {autoExportStatus.lastExport.securityAuditCount} audits sécurité)
                    </span>
                    <span className="break-all text-muted-foreground">
                      Checksum SHA-256: {autoExportStatus.lastExport.checksumSha256}
                    </span>
                  </>
                ) : null}
              </>
            ) : (
              <span className="text-muted-foreground">Statut indisponible.</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" onClick={onApplyAuditRetention} disabled={isBusy} className="w-full sm:w-auto">
            {isApplyingAuditRetention ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isApplyingAuditRetention ? 'Application...' : 'Appliquer rétention logs'}
          </Button>
          <Button variant="outline" onClick={onExportAuditNow} disabled={isBusy} className="w-full sm:w-auto">
            {isExportingAudit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isExportingAudit ? 'Export en cours...' : 'Exporter logs maintenant'}
          </Button>
          <Button variant="outline" onClick={onRunAutoExportNow} disabled={isBusy} className="w-full sm:w-auto">
            {isRunningAutoExport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isRunningAutoExport ? 'Génération...' : 'Lancer auto-export backend'}
          </Button>
          <Button variant="outline" onClick={onDownloadLatestAutoExport} disabled={isBusy || !autoExportStatus?.lastExport} className="w-full sm:w-auto">
            {isDownloadingAutoExport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isDownloadingAutoExport ? 'Téléchargement...' : 'Télécharger dernier auto-export'}
          </Button>
          <Button variant="secondary" onClick={onTestWebhook} disabled={isBusy} className="w-full sm:w-auto">
            {isTestingWebhook ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isTestingWebhook ? 'Test en cours...' : 'Tester webhook'}
          </Button>
        </div>
      </div>
    </section>
  )
}
