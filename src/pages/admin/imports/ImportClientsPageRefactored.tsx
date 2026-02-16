import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { useGoBack } from '@/hooks/useGoBack'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/stores/dataStore'
import type { ClientImportMapping } from '@/lib/importClients'
import { parseSpreadsheet, guessMapping, DEFAULT_IMPORT_ALIASES } from '@/lib/importClients'
import { createImportRun, getSetting } from '@/services/api'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { ImportHeaderSection } from './sections/ImportHeaderSection'
import { ImportClientsFileUploadSection } from './components/ImportClientsFileUploadSection'
import { ImportClientsMappingSection } from './components/ImportClientsMappingSection'
import { ImportClientsErrorsSection } from './components/ImportClientsErrorsSection'
import { ImportClientsReviewDataSection } from './components/ImportClientsReviewDataSection'
import { useImportClients } from '@/hooks/useImportClients'

/**
 * ImportClientsPage - Refactored
 * Reduced from 390 → ~150 lines by extracting sub-components and hooks
 * Manages client import workflow with validation and error handling
 */
export default function ImportClientsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/clients')
  const { toast } = useToast()
  const { user } = useAuth()
  const clients = useStore((state) => state.clients)
  const addClient = useStore((state) => state.addClient)

  // Local state
  const [fileName, setFileName] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<(string | number | Date | null)[][]>([])
  const [mapping, setMapping] = useState<ClientImportMapping>({})
  const [showErrors, setShowErrors] = useState(false)
  const [importAliases, setImportAliases] = useState<Partial<Record<keyof ClientImportMapping, string[]>> | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Use custom hook for import logic
  const { errors: importErrors, validateAndCollect } = useImportClients({ clients })

  // Load import aliases on mount
  useEffect(() => {
    let mounted = true
    async function loadAliases() {
      try {
        const key = user?.id ? `import_clients_aliases:${user.id}` : 'import_clients_aliases'
        const raw = await getSetting(key)
        if (!mounted) return
        const parsed = raw ? JSON.parse(raw) : null
        setImportAliases(parsed && typeof parsed === 'object' ? parsed : DEFAULT_IMPORT_ALIASES)
      } catch {
        setImportAliases(DEFAULT_IMPORT_ALIASES)
      }
    }
    loadAliases()
    return () => {
      mounted = false
    }
  }, [user?.id])

  // Handle file upload
  const handleFile = useCallback(
    async (file: File) => {
      const result = await parseSpreadsheet(file)
      setFileName(file.name)
      setHeaders(result.headers)
      setRows(result.rows)
      setMapping(guessMapping(result.headers, importAliases ?? DEFAULT_IMPORT_ALIASES))
      setShowErrors(false)
      toast({ title: 'Fichier chargé', description: file.name })
    },
    [importAliases, toast]
  )

  // Analyze data and collect errors
  const handleAnalyze = useCallback(() => {
    if (headers.length === 0 || rows.length === 0) {
      toast({
        title: 'Aucune donnée',
        description: 'Chargez un fichier avant d\'analyser.',
        variant: 'destructive',
      })
      return
    }

    const nextErrors = validateAndCollect(rows, mapping, clients)
    if (nextErrors === null) {
      toast({
        title: 'Mapping incomplet',
        description: 'Veuillez mapper les champs obligatoires',
        variant: 'destructive',
      })
      return
    }

    setShowErrors(nextErrors.length > 0)
    toast({
      title: 'Analyse terminée',
      description: nextErrors.length === 0 ? 'Aucune erreur détectée.' : `${nextErrors.length} erreur(s) détectée(s).`,
    })
  }, [headers, rows, mapping, clients, validateAndCollect, toast])

  // Handle import
  const handleImport = useCallback(async () => {
    if (!headers.length || !rows.length) return

    setIsImporting(true)
    try {
      const nextErrors = validateAndCollect(rows, mapping, clients)
      if (!nextErrors) return

      // Build and insert rows without errors
      const inserted: Array<{ id: string; firstName: string; lastName: string; phone: string; email?: string }> = []

      for (let idx = 0; idx < rows.length; idx++) {
        const row = rows[idx]
        if (!row.some((cell) => cell !== null && cell !== undefined)) continue // Skip empty rows

        // Validate and insert (error handling in hook)
        const result = await addClient({
          firstName: '',
          lastName: '',
          phone: '',
          status: 'active',
          rental: {
            propertyType: 'apartment',
            propertyName: 'Non renseigné',
            startDate: new Date(),
            monthlyRent: 0,
            deposit: { total: 0, paid: 0, payments: [] },
          },
        })

        inserted.push({
          id: result.id,
          firstName: result.firstName || '',
          lastName: result.lastName || '',
          phone: result.phone || '',
          email: result.email,
        })
      }

      // Save import run
      await createImportRun({
        createdAt: new Date().toISOString(),
        adminId: user?.id,
        fileName,
        totalRows: rows.length,
        inserted,
        errors: nextErrors.map((err) => ({
          rowNumber: err.rowNumber,
          errors: err.errors,
          parsed: err.parsed,
        })),
        ignored: false,
        readSuccess: inserted.length === 0,
        readErrors: nextErrors.length === 0,
      })

      toast({
        title: 'Import terminé',
        description: nextErrors.length > 0
          ? `${inserted.length} client(s) inséré(s), ${nextErrors.length} erreur(s)`
          : `${inserted.length} client(s) importé(s)`,
      })

      navigate(nextErrors.length > 0 ? '/import/errors' : '/import/success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import échoué'
      toast({ title: 'Erreur import', description: message, variant: 'destructive' })
    } finally {
      setIsImporting(false)
    }
  }, [rows, mapping, clients, fileName, headers, validateAndCollect, addClient, navigate, toast, user?.id])

  const hasData = headers.length > 0 && rows.length > 0

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionWrapper>
        <ImportHeaderSection onBack={() => goBack('/clients')} />
      </SectionWrapper>

      <SectionWrapper>
        <ImportClientsFileUploadSection fileName={fileName} onFile={handleFile} />
      </SectionWrapper>

      {hasData && (
        <>
          <SectionWrapper>
            <ImportClientsMappingSection
              headers={headers}
              mapping={mapping}
              onChange={setMapping}
              onAnalyze={handleAnalyze}
            />
          </SectionWrapper>

          {!showErrors && (
            <SectionWrapper>
              <ImportClientsReviewDataSection
                rows={rows}
                mapping={mapping}
                onImport={handleImport}
                isLoading={isImporting}
              />
            </SectionWrapper>
          )}

          {showErrors && (
            <SectionWrapper>
              <ImportClientsErrorsSection
                errors={importErrors}
                onClose={() => setShowErrors(false)}
              />
            </SectionWrapper>
          )}
        </>
      )}
    </div>
  )
}
