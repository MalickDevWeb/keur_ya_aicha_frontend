import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { PlatformConfig } from '@/services/platformConfig'

type SettingsGovernanceSectionProps = {
  value: PlatformConfig
  isLoading: boolean
  isSaving: boolean
  onChange: (updater: (prev: PlatformConfig) => PlatformConfig) => void
  onSave: () => void
  onReload: () => void
  onApplyAuditRetention: () => void
  onExportAuditNow: () => void
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
  onChange,
  onSave,
  onReload,
  onApplyAuditRetention,
  onExportAuditNow,
  onTestWebhook,
}: SettingsGovernanceSectionProps) {
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

  const setPaymentField = (key: 'graceDays' | 'latePenaltyPercent', next: string) =>
    onChange((prev) => ({
      ...prev,
      paymentRules: {
        ...prev.paymentRules,
        [key]: toPositiveNumber(next, prev.paymentRules[key]),
      },
    }))

  const setPaymentBlockOnOverdue = (checked: boolean) =>
    onChange((prev) => ({
      ...prev,
      paymentRules: { ...prev.paymentRules, blockOnOverdue: checked },
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
    <section className="mt-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-medium">Gouvernance Plateforme (Super Admin)</h3>
          <p className="text-sm text-muted-foreground">
            Paramètres globaux: maintenance, sécurité, paiements, documents, notifications, branding et conformité.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReload} disabled={isLoading || isSaving}>
            Recharger
          </Button>
          <Button onClick={onSave} disabled={isLoading || isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white/70 p-4 space-y-3">
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

      <div className="rounded-xl border border-border bg-white/70 p-4 space-y-3">
        <h4 className="font-semibold">Sécurité Session</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Durée max session (minutes)</span>
            <Input
              type="number"
              min={5}
              value={value.sessionSecurity.sessionDurationMinutes}
              onChange={(event) => setSessionField('sessionDurationMinutes', event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Timeout inactivité (minutes)</span>
            <Input
              type="number"
              min={1}
              value={value.sessionSecurity.inactivityTimeoutMinutes}
              onChange={(event) => setSessionField('inactivityTimeoutMinutes', event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Échecs login avant blocage</span>
            <Input
              type="number"
              min={1}
              value={value.sessionSecurity.maxFailedLogins}
              onChange={(event) => setSessionField('maxFailedLogins', event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Durée blocage login (minutes)</span>
            <Input
              type="number"
              min={1}
              value={value.sessionSecurity.lockoutMinutes}
              onChange={(event) => setSessionField('lockoutMinutes', event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white/70 p-4 space-y-3">
        <h4 className="font-semibold">Règles Paiement</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Jours de grâce</span>
            <Input
              type="number"
              min={0}
              value={value.paymentRules.graceDays}
              onChange={(event) => setPaymentField('graceDays', event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Pénalité retard (%)</span>
            <Input
              type="number"
              min={0}
              value={value.paymentRules.latePenaltyPercent}
              onChange={(event) => setPaymentField('latePenaltyPercent', event.target.value)}
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={value.paymentRules.blockOnOverdue} onCheckedChange={setPaymentBlockOnOverdue} />
          <span className="text-sm text-muted-foreground">Bloquer l’accès si abonnement en retard</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white/70 p-4 space-y-3">
        <h4 className="font-semibold">Documents</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Taille max upload (MB)</span>
            <Input
              type="number"
              min={1}
              value={value.documents.maxUploadMb}
              onChange={(event) => setDocumentsField('maxUploadMb', event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Rétention documents (jours)</span>
            <Input
              type="number"
              min={1}
              value={value.documents.retentionDays}
              onChange={(event) => setDocumentsField('retentionDays', event.target.value)}
            />
          </label>
        </div>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Types autorisés (MIME, séparés par virgule)</span>
          <Input
            value={value.documents.allowedMimeTypes.join(', ')}
            onChange={(event) => setAllowedMimeTypes(event.target.value)}
            placeholder="application/pdf, image/jpeg, image/png"
          />
        </label>
      </div>

      <div className="rounded-xl border border-border bg-white/70 p-4 space-y-3">
        <h4 className="font-semibold">Notifications (Templates + Événements)</h4>
        <div className="grid gap-3 sm:grid-cols-3">
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
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={value.notifications.events.maintenance}
              onCheckedChange={(next) => setNotificationEvent('maintenance', next)}
            />
            Événement maintenance
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={value.notifications.events.loginFailure}
              onCheckedChange={(next) => setNotificationEvent('loginFailure', next)}
            />
            Échec login
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={value.notifications.events.paymentOverdue}
              onCheckedChange={(next) => setNotificationEvent('paymentOverdue', next)}
            />
            Paiement en retard
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={value.notifications.events.apiError} onCheckedChange={(next) => setNotificationEvent('apiError', next)} />
            Erreur API
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Template maintenance</span>
            <Textarea
              rows={2}
              value={value.notifications.templates.maintenance}
              onChange={(event) => setNotificationTemplate('maintenance', event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Template login failure</span>
            <Textarea
              rows={2}
              value={value.notifications.templates.loginFailure}
              onChange={(event) => setNotificationTemplate('loginFailure', event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Template paiement en retard</span>
            <Textarea
              rows={2}
              value={value.notifications.templates.paymentOverdue}
              onChange={(event) => setNotificationTemplate('paymentOverdue', event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Template erreur API</span>
            <Textarea
              rows={2}
              value={value.notifications.templates.apiError}
              onChange={(event) => setNotificationTemplate('apiError', event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white/70 p-4 space-y-3">
        <h4 className="font-semibold">Branding</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Nom application</span>
            <Input value={value.branding.appName} onChange={(event) => setBrandingField('appName', event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">URL logo</span>
            <Input value={value.branding.logoUrl} onChange={(event) => setBrandingField('logoUrl', event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Couleur principale</span>
            <div className="flex items-center gap-2">
              <Input
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
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Pied de page</span>
            <Input
              value={value.branding.footerText}
              onChange={(event) => setBrandingField('footerText', event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white/70 p-4 space-y-3">
        <h4 className="font-semibold">Audit & Conformité</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Rétention logs (jours)</span>
            <Input
              type="number"
              min={1}
              value={value.auditCompliance.retentionDays}
              onChange={(event) => setAuditField('retentionDays', event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Fréquence export auto (heures)</span>
            <Input
              type="number"
              min={1}
              value={value.auditCompliance.autoExportIntervalHours}
              onChange={(event) => setAuditField('autoExportIntervalHours', event.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={value.auditCompliance.autoExportEnabled} onCheckedChange={(next) => setAuditBoolean('autoExportEnabled', next)} />
            Export auto des logs
          </label>
          <label className="space-y-1">
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

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={value.auditCompliance.alertWebhookEnabled}
              onCheckedChange={(next) => setAuditBoolean('alertWebhookEnabled', next)}
            />
            Webhook alertes activé
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={value.auditCompliance.alertOnApiError} onCheckedChange={(next) => setAuditBoolean('alertOnApiError', next)} />
            Alerter sur erreurs API
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={value.auditCompliance.alertOnSecurityEvent}
              onCheckedChange={(next) => setAuditBoolean('alertOnSecurityEvent', next)}
            />
            Alerter sur événements sécurité
          </label>
        </div>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">URL webhook alertes</span>
          <Input
            value={value.auditCompliance.alertWebhookUrl}
            onChange={(event) => setAuditString('alertWebhookUrl', event.target.value)}
            placeholder="https://hooks.example.com/kya"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Secret webhook (optionnel)</span>
          <Input
            value={value.auditCompliance.alertWebhookSecret}
            onChange={(event) => setAuditString('alertWebhookSecret', event.target.value)}
            placeholder="secret"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onApplyAuditRetention}>
            Appliquer rétention logs
          </Button>
          <Button variant="outline" onClick={onExportAuditNow}>
            Exporter logs maintenant
          </Button>
          <Button variant="secondary" onClick={onTestWebhook}>
            Tester webhook
          </Button>
        </div>
      </div>
    </section>
  )
}
