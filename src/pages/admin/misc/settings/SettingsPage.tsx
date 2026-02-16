import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useActionLogger } from '@/lib/actionLogger'
import { CLIENT_IMPORT_FIELDS, DEFAULT_IMPORT_ALIASES, DEFAULT_REQUIRED_FIELDS, type ClientImportMapping } from '@/lib/importClients'
import { getSetting, setSetting } from '@/services/api'
import { SettingsHeaderSection } from './sections/SettingsHeaderSection'
import { SettingsImportAliasesSection } from './sections/SettingsImportAliasesSection'
import { SettingsRequiredFieldsSection } from './sections/SettingsRequiredFieldsSection'
import { SettingsReportSection } from './sections/SettingsReportSection'
import { safeJsonParse } from './utils'

const REQUIRED_FIELDS_KEY = 'import_clients_required_fields'

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const logAction = useActionLogger('settings')
  const navigate = useNavigate()
  const [importAliasesText, setImportAliasesText] = useState('')
  const [importAliasesError, setImportAliasesError] = useState('')
  const [importAliasesSaving, setImportAliasesSaving] = useState(false)
  const [requiredFields, setRequiredFields] = useState<Array<keyof ClientImportMapping>>(DEFAULT_REQUIRED_FIELDS)
  const [requiredFieldsSaving, setRequiredFieldsSaving] = useState(false)
  const [reportFormat, setReportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv')
  const [reportFormatSaving, setReportFormatSaving] = useState(false)

  const role = String(user?.role || '').toUpperCase()
  const canEdit = user && (role === 'ADMIN' || role === 'SUPER_ADMIN')
  const canEditRequired = role === 'SUPER_ADMIN'
  const userScopedKey = (key: string) => (user?.id ? `${key}:${user.id}` : key)

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
    </div>
  )
}
