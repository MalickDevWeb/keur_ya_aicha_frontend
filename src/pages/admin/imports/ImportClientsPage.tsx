import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { useGoBack } from '@/hooks/useGoBack'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/stores/dataStore'
import type { ClientImportMapping } from '@/lib/importClients'
import {
  buildRow,
  ClientImportError,
  DEFAULT_IMPORT_ALIASES,
  DEFAULT_REQUIRED_FIELDS,
  FIELD_LABELS,
  CLIENT_IMPORT_FIELDS,
  guessMapping,
  parseSpreadsheet,
  validateRow,
} from '@/lib/importClients'
import { createImportRun, getSetting } from '@/services/api'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { ImportHeaderSection } from './sections/ImportHeaderSection'
import { FileUploadCard } from './sections/FileUploadCard'
import { ErrorsCard } from './sections/ErrorsCard'
import { MappingCard } from './sections/MappingCard'
import type { RowOverrides } from './types'
import { buildDuplicateLookup, buildDuplicateMessage, formatBackendError } from './utils'
import { normalizeEmailForCompare, normalizePhoneForCompare } from '@/validators/frontend'

const REQUIRED_FIELDS_KEY = 'import_clients_required_fields'

export default function ImportClientsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/clients')
  const { toast } = useToast()
  const { user } = useAuth()
  const clients = useStore((state) => state.clients)
  const addClient = useStore((state) => state.addClient)

  const [fileName, setFileName] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<(string | number | Date | null)[][]>([])
  const [mapping, setMapping] = useState<ClientImportMapping>({})
  const [errors, setErrors] = useState<ClientImportError[]>([])
  const [overrides, setOverrides] = useState<RowOverrides>({})
  const [isImporting, setIsImporting] = useState(false)
  const [showFix, setShowFix] = useState(false)
  const [importAliases, setImportAliases] = useState<
    Partial<Record<keyof ClientImportMapping, string[]>> | null
  >(null)
  const [requiredFields, setRequiredFields] = useState<Array<keyof ClientImportMapping>>(DEFAULT_REQUIRED_FIELDS)

  const { ownerByEmail, ownerByPhone } = useMemo(() => buildDuplicateLookup(clients), [clients])
  const hasData = headers.length > 0 && rows.length > 0

  useEffect(() => {
    let mounted = true
    async function loadImportAliases() {
      try {
        const key = user?.id ? `import_clients_aliases:${user.id}` : 'import_clients_aliases'
        const raw = await getSetting(key)
        if (!mounted) return
        if (!raw) {
          setImportAliases(DEFAULT_IMPORT_ALIASES)
          return
        }
        const parsed = JSON.parse(raw)
        setImportAliases(parsed && typeof parsed === 'object' ? parsed : DEFAULT_IMPORT_ALIASES)
      } catch {
        setImportAliases(DEFAULT_IMPORT_ALIASES)
      }
    }
    loadImportAliases()
    return () => {
      mounted = false
    }
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

  const collectErrors = useCallback((): ClientImportError[] | null => {
    const missingMapping = requiredFields.filter((field) => mapping[field] === undefined)
    if (missingMapping.length > 0) {
      const missingLabels = missingMapping.map((field) => FIELD_LABELS[field] || field)
      toast({
        title: 'Mapping incomplet',
        description: `Colonnes manquantes: ${missingLabels.join(', ')}`,
        variant: 'destructive',
      })
      return null
    }

    const existingPhones = new Set(ownerByPhone.keys())
    const existingEmails = new Set(ownerByEmail.keys())

    const seenPhonesInFile = new Set<string>()
    const seenEmailsInFile = new Set<string>()
    const nextErrors: ClientImportError[] = []

    const isRowEmpty = (row: (string | number | Date | null)[]) =>
      row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')

    rows.forEach((row, idx) => {
      if (isRowEmpty(row)) return

      const parsed = buildRow(row, mapping, overrides[idx])
      const rowErrors = validateRow(parsed, requiredFields)

      const normalizedPhone = normalizePhoneForCompare(String(parsed.phone || ''))
      if (normalizedPhone) {
        if (existingPhones.has(normalizedPhone)) {
          rowErrors.push(buildDuplicateMessage('phone', normalizedPhone, ownerByPhone))
        }
        if (seenPhonesInFile.has(normalizedPhone)) {
          rowErrors.push('Téléphone dupliqué dans le fichier')
        }
        seenPhonesInFile.add(normalizedPhone)
      }

      const normalizedEmail = normalizeEmailForCompare(String(parsed.email || ''))
      if (normalizedEmail) {
        if (existingEmails.has(normalizedEmail)) {
          rowErrors.push(buildDuplicateMessage('email', normalizedEmail, ownerByEmail))
        }
        if (seenEmailsInFile.has(normalizedEmail)) {
          rowErrors.push('Email dupliqué dans le fichier')
        }
        seenEmailsInFile.add(normalizedEmail)
      }

      if (rowErrors.length > 0) {
        nextErrors.push({
          rowIndex: idx,
          rowNumber: idx + 2,
          errors: rowErrors,
          raw: row,
          parsed,
        })
      }
    })

    return nextErrors
  }, [rows, mapping, overrides, ownerByPhone, ownerByEmail, requiredFields, toast])

  const computeErrors = useCallback((opts?: { keepFixOpen?: boolean }) => {
    if (!hasData) {
      toast({
        title: 'Aucune donnée',
        description: 'Chargez un fichier avant d’analyser.',
        variant: 'destructive',
      })
      return
    }
    const nextErrors = collectErrors()
    if (!nextErrors) return
    setErrors(nextErrors)
    const shouldShowFix = opts?.keepFixOpen || nextErrors.length > 0
    setShowFix(shouldShowFix)
    toast({
      title: 'Analyse terminée',
      description: nextErrors.length === 0 ? 'Aucune erreur détectée.' : `${nextErrors.length} erreur(s) détectée(s).`,
    })
  }, [collectErrors, hasData, toast])

  const handleFile = useCallback(async (file: File) => {
    const result = await parseSpreadsheet(file)
    setFileName(file.name)
    setHeaders(result.headers)
    setRows(result.rows)
    setMapping(guessMapping(result.headers, importAliases ?? DEFAULT_IMPORT_ALIASES))
    setErrors([])
    setOverrides({})
    setShowFix(false)
  }, [importAliases])

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      await handleFile(file)
      toast({ title: 'Fichier chargé', description: file.name })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de lire le fichier'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    }
  }

  const onUpdateOverride = (rowIndex: number, field: 'firstName' | 'lastName' | 'phone' | 'cni', value: string) => {
    setOverrides((prev) => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [field]: value,
      },
    }))
  }

  const saveErrorsToServer = async (nextErrors: ClientImportError[]) => {
    try {
      await createImportRun({
        createdAt: new Date().toISOString(),
        adminId: user?.id,
        fileName,
        totalRows: rows.length,
        inserted: [],
        errors: nextErrors.map((err) => ({
          rowNumber: err.rowNumber,
          errors: err.errors,
          parsed: err.parsed,
        })),
        ignored: false,
        readSuccess: true,
        readErrors: false,
      })
      navigate('/import/errors')
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'enregistrer les erreurs"
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    }
  }

  const handleImport = async () => {
    if (!hasData) return
    setIsImporting(true)

    try {
      const nextErrors = collectErrors()
      if (!nextErrors) return

      const inserted: Array<{ id: string; firstName: string; lastName: string; phone: string; email?: string }> = []

      for (let idx = 0; idx < rows.length; idx++) {
        const row = rows[idx]
        if (!row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')) continue

        const parsed = buildRow(row, mapping, overrides[idx])
        const rowErrors = validateRow(parsed, requiredFields)
        if (rowErrors.length > 0) continue

        try {
          const result = await addClient({
            firstName: parsed.firstName || '',
            lastName: parsed.lastName || '',
            phone: String(parsed.phone || '').trim(),
            email: parsed.email ? String(parsed.email).trim() : undefined,
            cni: parsed.cni ? String(parsed.cni).trim() : undefined,
            status: parsed.status === 'archived' || parsed.status === 'blacklisted' ? parsed.status : 'active',
            rental: {
              propertyType: (parsed.propertyType as 'studio' | 'room' | 'apartment' | 'villa' | 'other') || 'apartment',
              propertyName: parsed.propertyName || 'Non renseigné',
              startDate: parsed.startDate || new Date(),
              monthlyRent: parsed.monthlyRent || 0,
              deposit: {
                total: parsed.depositTotal || 0,
                paid: parsed.depositPaid || 0,
                payments: [],
              },
            },
          })

          inserted.push({
            id: result.id,
            firstName: result.firstName || '',
            lastName: result.lastName || '',
            phone: result.phone || '',
            email: result.email,
          })
        } catch (err) {
          nextErrors.push({
            rowIndex: idx,
            rowNumber: idx + 2,
            errors: [formatBackendError(err, parsed, ownerByPhone, ownerByEmail)],
            raw: row,
            parsed,
          })
        }
      }

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
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <SectionWrapper>
        <ImportHeaderSection onBack={() => goBack('/clients')} />
      </SectionWrapper>

      <SectionWrapper>
        <FileUploadCard fileName={fileName} onFileChange={onFileChange} />
      </SectionWrapper>

      {hasData && (
        <>
          <SectionWrapper>
            <MappingCard
              headers={headers}
              mapping={mapping}
              requiredFields={requiredFields}
              onMappingChange={setMapping}
              onAnalyze={() => computeErrors()}
              onImport={handleImport}
              isImporting={isImporting}
            />
          </SectionWrapper>
          <SectionWrapper>
            <ErrorsCard
              errors={errors}
              showFix={showFix}
              overrides={overrides}
              onShowFix={() => setShowFix(true)}
              onSaveErrors={() => saveErrorsToServer(errors)}
              onUpdateOverride={onUpdateOverride}
              onRevalidate={() => computeErrors({ keepFixOpen: true })}
              onImport={handleImport}
              isImporting={isImporting}
            />
          </SectionWrapper>
        </>
      )}
    </div>
  )
}
