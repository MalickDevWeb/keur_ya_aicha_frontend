import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/lib/i18n'
import { DEFAULT_IMPORT_ALIASES } from '@/lib/importClients'
import { getSetting, setSetting } from '@/services/api'
import { SettingsHeaderSection } from './sections/SettingsHeaderSection'
import { SettingsThemeSection } from './sections/SettingsThemeSection'
import { SettingsImportAliasesSection } from './sections/SettingsImportAliasesSection'
import { SettingsReportSection } from './sections/SettingsReportSection'
import { applyThemeToDocument, safeJsonParse } from './utils'

export default function SettingsPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [persistedTheme, setPersistedTheme] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('')
  const [previewTheme, setPreviewTheme] = useState('')
  const [importAliasesText, setImportAliasesText] = useState('')
  const [importAliasesError, setImportAliasesError] = useState('')
  const [importAliasesSaving, setImportAliasesSaving] = useState(false)
  const [reportFormat, setReportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv')
  const [reportFormatSaving, setReportFormatSaving] = useState(false)

  const role = String(user?.role || '').toUpperCase()
  const canEdit = user && (role === 'ADMIN' || role === 'SUPER_ADMIN')

  useEffect(() => {
    async function loadTheme() {
      try {
        const theme = await getSetting('app_theme')
        const themeValue = theme || ''
        setPersistedTheme(themeValue)
        setSelectedTheme(themeValue)
        applyThemeToDocument(themeValue)
      } finally {
        // no-op
      }
    }
    loadTheme()
  }, [])

  useEffect(() => {
    async function loadImportAliases() {
      try {
        const raw = await getSetting('import_clients_aliases')
        const parsed = safeJsonParse(raw, DEFAULT_IMPORT_ALIASES)
        setImportAliasesText(JSON.stringify(parsed, null, 2))
      } catch {
        setImportAliasesText(JSON.stringify(DEFAULT_IMPORT_ALIASES, null, 2))
      }
    }
    loadImportAliases()
  }, [])

  useEffect(() => {
    async function loadReportFormat() {
      try {
        const raw = await getSetting('import_report_format')
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
  }, [])

  const handleSelectTheme = (themeKey: string) => {
    setSelectedTheme(themeKey)
    setPreviewTheme(themeKey)
  }

  const handleResetTheme = () => {
    setSelectedTheme('')
    setPreviewTheme('')
    persistTheme('')
  }

  const persistTheme = async (themeKey: string) => {
    try {
      await setSetting('app_theme', themeKey)
      setPersistedTheme(themeKey)
      setSelectedTheme(themeKey)
      applyThemeToDocument(themeKey)
      setPreviewTheme('')
    } finally {
      // no-op
    }
  }

  const saveImportAliases = async () => {
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
      return
    }
    try {
      setImportAliasesSaving(true)
      await setSetting('import_clients_aliases', JSON.stringify(parsed))
    } catch {
      setImportAliasesError('Échec de sauvegarde.')
    } finally {
      setImportAliasesSaving(false)
    }
  }

  const resetImportAliases = () => {
    setImportAliasesText(JSON.stringify(DEFAULT_IMPORT_ALIASES, null, 2))
    setImportAliasesError('')
  }

  const saveReportFormat = async () => {
    try {
      setReportFormatSaving(true)
      await setSetting('import_report_format', reportFormat)
    } finally {
      setReportFormatSaving(false)
    }
  }

  if (!canEdit) {
    return (
      <div className="p-6">
        <SettingsHeaderSection title={t('settings.title') || 'Paramètres'} />
        <p className="mt-4 text-muted-foreground">Vous n'êtes pas autorisé à modifier la palette.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <SettingsHeaderSection title={t('settings.title') || 'Paramètres'} />

      <SettingsThemeSection
        persistedTheme={persistedTheme}
        selectedTheme={selectedTheme}
        previewTheme={previewTheme}
        onSelectTheme={handleSelectTheme}
        onReset={handleResetTheme}
        onApply={() => persistTheme(selectedTheme)}
        onCancelPreview={() => setPreviewTheme('')}
      />

      <SettingsImportAliasesSection
        value={importAliasesText}
        error={importAliasesError}
        isSaving={importAliasesSaving}
        onChange={setImportAliasesText}
        onSave={saveImportAliases}
        onReset={resetImportAliases}
        onOpenImport={() => navigate('/import/clients')}
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
