import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient, fetchClients, fetchImportRuns, getSetting, markImportRunRead, updateImportRun } from '@/services/api'
import { ErrorsTable } from './components/ErrorsTable'
import { ErrorsActions } from './components/ErrorsActions'
import { PageHeader } from '@/pages/common/PageHeader'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { useToast } from '@/hooks/use-toast'
import { useGoBack } from '@/hooks/useGoBack'
import { CLIENT_IMPORT_FIELDS, DEFAULT_REQUIRED_FIELDS, validateRow, type ClientImportMapping } from '@/lib/importClients'
import { buildDuplicateLookup, buildDuplicateMessage, formatBackendError, type StoredErrors } from './utils'
import { normalizeEmailForCompare, normalizePhoneForCompare } from '@/validators/frontend'

const REQUIRED_FIELDS_KEY = 'import_clients_required_fields'

const cloneEditableErrors = (errors: StoredErrors['errors']) =>
  errors.map((err) => ({
    ...err,
    parsed: { ...err.parsed },
  }))

export default function ImportErrors() {
  const navigate = useNavigate()
  const goBack = useGoBack('/import/clients')
  const { toast } = useToast()
  const [stored, setStored] = useState<StoredErrors | null>(null)
  const [allRuns, setAllRuns] = useState<StoredErrors[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [requiredFields, setRequiredFields] = useState<Array<keyof ClientImportMapping>>(DEFAULT_REQUIRED_FIELDS)
  const [editableErrors, setEditableErrors] = useState<StoredErrors['errors']>([])
  const [isSavingEdits, setIsSavingEdits] = useState(false)
  const [isImportingCorrected, setIsImportingCorrected] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setIsLoading(true)
      try {
        const runs = await fetchImportRuns()
        const unreadErrorRuns = runs.filter(
          (r: StoredErrors) => !r.ignored && (r.errors?.length || 0) > 0 && !r.readErrors
        )
        if (unreadErrorRuns.length > 0) {
          await Promise.all(unreadErrorRuns.map((r: StoredErrors) => markImportRunRead(r.id, 'errors')))
        }
        const normalizedRuns = runs.map((r: StoredErrors) =>
          unreadErrorRuns.some((entry) => entry.id === r.id)
            ? { ...r, readErrors: true }
            : r
        )
        const latest = normalizedRuns.find((r: StoredErrors) => !r.ignored)
        if (mounted) {
          setAllRuns(normalizedRuns)
          setStored(latest || null)
        }
      } catch {
        if (mounted) setStored(null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const loadRequired = async () => {
      try {
        const raw = await getSetting(REQUIRED_FIELDS_KEY)
        if (!mounted) return
        if (!raw) {
          setRequiredFields(DEFAULT_REQUIRED_FIELDS)
          return
        }
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((field) => CLIENT_IMPORT_FIELDS.includes(field)) as Array<keyof ClientImportMapping>
          setRequiredFields(valid.length > 0 ? valid : DEFAULT_REQUIRED_FIELDS)
        } else {
          setRequiredFields(DEFAULT_REQUIRED_FIELDS)
        }
      } catch {
        setRequiredFields(DEFAULT_REQUIRED_FIELDS)
      }
    }
    loadRequired()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!stored) {
      setEditableErrors([])
      return
    }
    setEditableErrors(cloneEditableErrors(stored.errors))
  }, [stored])

  const handleIgnore = async () => {
    if (!stored) return
    try {
      await updateImportRun(stored.id, { ignored: true, readErrors: true })
      navigate('/import/clients')
    } catch {
      // ignore
    }
  }

  const handleUpdateCell = (
    index: number,
    field: 'firstName' | 'lastName' | 'phone' | 'email' | 'cni',
    value: string
  ) => {
    setEditableErrors((prev) =>
      prev.map((err, idx) =>
        idx === index ? { ...err, parsed: { ...err.parsed, [field]: value } } : err
      )
    )
  }

  const runCorrectedImport = async (rowsToImport: StoredErrors['errors']) => {
    if (!stored) return
    setIsImportingCorrected(true)
    try {
      const clients = await fetchClients()
      const { ownerByEmail, ownerByPhone } = buildDuplicateLookup(clients)
      const created: StoredErrors['inserted'] = []
      const failures: StoredErrors['errors'] = []

      for (const err of rowsToImport) {
        const parsed = err.parsed as ClientImportMapping
        const rowErrors = validateRow(parsed, requiredFields)
        if (rowErrors.length > 0) {
          failures.push({ ...err, errors: rowErrors })
          continue
        }

        const duplicateMessages: string[] = []
        const normalizedPhone = normalizePhoneForCompare(String(parsed.phone || ''))
        const normalizedEmail = normalizeEmailForCompare(String(parsed.email || ''))

        if (normalizedPhone && ownerByPhone.has(normalizedPhone)) {
          duplicateMessages.push(
            `${buildDuplicateMessage('phone', normalizedPhone, ownerByPhone)} (détecté avant import)`
          )
        }
        if (normalizedEmail && ownerByEmail.has(normalizedEmail)) {
          duplicateMessages.push(
            `${buildDuplicateMessage('email', normalizedEmail, ownerByEmail)} (détecté avant import)`
          )
        }
        if (duplicateMessages.length > 0) {
          failures.push({ ...err, errors: duplicateMessages })
          continue
        }

        try {
          const result = await createClient({
            firstName: String(parsed.firstName || '').trim(),
            lastName: String(parsed.lastName || '').trim(),
            phone: String(parsed.phone || '').trim(),
            email: parsed.email ? String(parsed.email).trim() : undefined,
            cni: parsed.cni ? String(parsed.cni).trim() : undefined,
            status: parsed.status === 'archived' || parsed.status === 'blacklisted' ? parsed.status : 'active',
            rental: {
              propertyType: (parsed.propertyType as 'studio' | 'room' | 'apartment' | 'villa' | 'other') || 'apartment',
              propertyName: parsed.propertyName ? String(parsed.propertyName) : 'Non renseigné',
              startDate: parsed.startDate ? new Date(parsed.startDate as string) : new Date(),
              monthlyRent: Number(parsed.monthlyRent || 0),
              deposit: {
                total: Number(parsed.depositTotal || 0),
                paid: Number(parsed.depositPaid || 0),
                payments: [],
              },
            },
          })

          created.push({
            id: result.id,
            firstName: result.firstName || '',
            lastName: result.lastName || '',
            phone: result.phone || '',
            email: result.email,
          })

          const createdPhone = normalizePhoneForCompare(result.phone || '')
          if (createdPhone && !ownerByPhone.has(createdPhone)) {
            ownerByPhone.set(createdPhone, result)
          }
          const createdEmail = normalizeEmailForCompare(result.email || '')
          if (createdEmail && !ownerByEmail.has(createdEmail)) {
            ownerByEmail.set(createdEmail, result)
          }
        } catch (error) {
          failures.push({
            ...err,
            errors: [formatBackendError(error, parsed, ownerByPhone, ownerByEmail)],
          })
        }
      }

      const mergedInserted = [...(stored.inserted || []), ...created]
      await updateImportRun(stored.id, {
        inserted: mergedInserted,
        errors: failures,
        ignored: failures.length === 0,
        readErrors: true,
        readSuccess: failures.length === 0 ? false : Boolean(stored.readSuccess),
      } as never)

      setStored((prev) =>
        prev
          ? {
              ...prev,
              inserted: mergedInserted,
              errors: failures,
              ignored: failures.length === 0,
              readErrors: true,
              readSuccess: failures.length === 0 ? false : Boolean(prev.readSuccess),
            }
          : prev
      )
      setAllRuns((prev) =>
        prev.map((run) =>
          run.id === stored.id
            ? {
                ...run,
                inserted: mergedInserted,
                errors: failures,
                ignored: failures.length === 0,
                readErrors: true,
                readSuccess: failures.length === 0 ? false : Boolean(run.readSuccess),
              }
            : run
        )
      )
      setEditableErrors(cloneEditableErrors(failures))

      if (failures.length > 0) {
        const duplicateCount = failures.filter((f) =>
          f.errors.some((msg) => msg.toLowerCase().includes('doublon') || msg.includes('409'))
        ).length
        toast({
          title: 'Import partiel',
          description:
            duplicateCount > 0
              ? `${created.length} importé(s), ${failures.length} erreur(s), dont ${duplicateCount} doublon(s) en base (409).`
              : `${created.length} importé(s), ${failures.length} erreur(s).`,
        })
        return
      }

      toast({ title: 'Import réussi', description: `${created.length} client(s) importé(s).` })
      navigate('/import/success', {
        state: { reason: 'Import relancé avec les lignes corrigées.' },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de l'import des corrections."
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setIsImportingCorrected(false)
    }
  }

  const revalidateAndSave = async () => {
    if (!stored) return
    setIsSavingEdits(true)
    try {
      const nextErrors = editableErrors.map((err) => {
        const parsed = err.parsed as ClientImportMapping
        const rowErrors = validateRow(parsed, requiredFields)
        return { ...err, errors: rowErrors }
      })

      const remainingErrors = nextErrors.filter((err) => err.errors.length > 0)
      const hasErrors = remainingErrors.length > 0
      setEditableErrors(nextErrors)
      await updateImportRun(stored.id, {
        errors: remainingErrors,
        ignored: false,
        readErrors: true,
      } as never)

      setStored((prev) =>
        prev ? { ...prev, errors: remainingErrors, ignored: false, readErrors: true } : prev
      )
      setAllRuns((prev) =>
        prev.map((run) =>
          run.id === stored.id ? { ...run, errors: remainingErrors, ignored: false, readErrors: true } : run
        )
      )
      if (hasErrors) {
        toast({
          title: 'Corrections enregistrées',
          description: 'Vérifiez encore les lignes en erreur.',
        })
        return
      }

      toast({
        title: 'Toutes les erreurs corrigées',
        description: 'Import automatique des lignes corrigées en cours...',
      })
      await runCorrectedImport(nextErrors)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de la validation.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setIsSavingEdits(false)
    }
  }

  const importCorrectedRows = async () => {
    if (!stored) return
    await runCorrectedImport(editableErrors)
  }

  const errorCount = useMemo(
    () => editableErrors.filter((err) => err.errors.length > 0).length,
    [editableErrors]
  )

  const handleDelete = async () => {
    if (!stored) return
    try {
      await updateImportRun(stored.id, { ignored: true, readErrors: true })
      setStored(null)
      setAllRuns((prev) => prev.filter((r) => r.id !== stored.id))
    } catch {
      // ignore
    }
  }

  const handleRefresh = async () => {
    try {
      const runs = await fetchImportRuns()
      const latest = runs.find((r: StoredErrors) => !r.ignored)
      setAllRuns(runs)
      setStored(latest || null)
      setEditableErrors(latest ? cloneEditableErrors(latest.errors) : [])
    } catch {
      // ignore
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!stored) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Erreurs d'import"
          actions={
            <Button
              onClick={() => goBack('/import/clients')}
              variant="outline"
              className="w-full md:w-auto whitespace-normal text-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'import
            </Button>
          }
        />
        <SectionWrapper>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucun import avec erreurs</p>
            <Button onClick={() => navigate('/import/clients')} variant="outline" className="mt-4">
              Importer des clients
            </Button>
          </div>
        </SectionWrapper>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Erreurs d'import"
        actions={
          <Button
            onClick={() => goBack('/import/clients')}
            variant="outline"
            className="w-full md:w-auto whitespace-normal text-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        }
      />

      <SectionWrapper>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Détails de l'import</CardTitle>
                <p className="text-sm text-gray-500">
                  {new Date(stored.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <ErrorsActions
                storedErrors={stored}
                onRefresh={handleRefresh}
                onDelete={handleDelete}
                isLoading={isLoading}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{(stored.inserted?.length || 0) + stored.errors.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Importés</p>
                <p className="text-2xl font-bold text-green-600">{stored.inserted?.length || 0}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Erreurs</p>
                <p className="text-2xl font-bold text-red-600">{stored.errors.length}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Clients importés</h3>
              {stored.inserted && stored.inserted.length > 0 ? (
                <>
                  <div className="space-y-2 md:hidden">
                    {stored.inserted.map((client) => (
                      <Card key={client.id} className="border border-emerald-100">
                        <CardContent className="p-3 space-y-1 text-sm">
                          <p><span className="font-medium">Prénom:</span> {client.firstName || '—'}</p>
                          <p><span className="font-medium">Nom:</span> {client.lastName || '—'}</p>
                          <p><span className="font-medium">Téléphone:</span> {client.phone || '—'}</p>
                          <p className="break-all"><span className="font-medium">Email:</span> {client.email || '—'}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prénom</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stored.inserted.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell>{client.firstName || '—'}</TableCell>
                            <TableCell>{client.lastName || '—'}</TableCell>
                            <TableCell>{client.phone || '—'}</TableCell>
                            <TableCell>{client.email || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun client importé.</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-4">Détail des erreurs</h3>
              <ErrorsTable
                storedErrors={editableErrors}
                inserted={stored.inserted}
                editable
                onUpdate={handleUpdateCell}
              />
              <div className="mt-4 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
                <Button
                  onClick={revalidateAndSave}
                  disabled={isSavingEdits}
                  className="w-full md:w-auto whitespace-normal text-center"
                >
                  {isSavingEdits ? 'Validation...' : 'Re‑valider et sauvegarder'}
                </Button>
                <Button
                  onClick={importCorrectedRows}
                  disabled={isImportingCorrected || errorCount > 0}
                  className="w-full md:w-auto whitespace-normal text-center"
                >
                  {isImportingCorrected ? 'Import...' : 'Importer les lignes corrigées'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditableErrors(cloneEditableErrors(stored.errors))}
                  disabled={isSavingEdits}
                  className="w-full md:w-auto whitespace-normal text-center"
                >
                  Annuler les modifications
                </Button>
                <span className="text-sm text-muted-foreground">
                  {errorCount} erreur(s) restante(s)
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row">
              <Button onClick={handleIgnore} variant="outline" className="w-full md:w-auto whitespace-normal text-center">
                Marquer comme traité
              </Button>
              <Button onClick={() => navigate('/import/clients')} variant="default" className="w-full md:w-auto whitespace-normal text-center">
                Nouvel import
              </Button>
              {stored.inserted && stored.inserted.length > 0 && (
                <Button
                  onClick={() => navigate('/import/success')}
                  variant="secondary"
                  className="w-full md:w-auto whitespace-normal text-center"
                >
                  Voir les importés
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>

      {allRuns.length > 1 && (
        <SectionWrapper>
          <Card>
            <CardHeader>
              <CardTitle>Historique des imports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allRuns.map((run) => (
                  <div
                    key={run.id}
                    onClick={() => setStored(run)}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      run.id === stored.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <p className="font-semibold">{new Date(run.createdAt).toLocaleString('fr-FR')}</p>
                    <p className="text-sm">
                      {run.inserted?.length || 0} importés | {run.errors.length} erreurs
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </SectionWrapper>
      )}
    </div>
  )
}
