import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/contexts/DataContext'
import { normalizeEmailForCompare, normalizePhoneForCompare, validateEmail } from '@/validators/clientValidator'
import {
  buildRow,
  ClientImportError,
  ClientImportMapping,
  DEFAULT_IMPORT_ALIASES,
  guessMapping,
  parseSpreadsheet,
  validateRow,
} from '@/lib/importClients'
import { createImportRun, getSetting } from '@/services/api'

type RowOverrides = Record<number, { firstName?: string; lastName?: string; phone?: string }>

const REQUIRED_FIELDS = ['firstName', 'lastName', 'phone'] as const
const OPTIONAL_FIELDS = [
  'email',
  'cni',
  'propertyType',
  'propertyName',
  'startDate',
  'monthlyRent',
  'depositTotal',
  'depositPaid',
  'status',
] as const

export default function ImportClients() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { addClient, clients } = useData()

  const [fileName, setFileName] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<(string | number | Date | null)[][]>([])
  const [mapping, setMapping] = useState<ClientImportMapping>({})
  const [errors, setErrors] = useState<ClientImportError[]>([])
  const [overrides, setOverrides] = useState<RowOverrides>({})
  const [isImporting, setIsImporting] = useState(false)
  const [showFix, setShowFix] = useState(false)
  const [importAliases, setImportAliases] = useState<Partial<Record<keyof ClientImportMapping, string[]>> | null>(null)
  const { ownerByEmail, ownerByPhone } = buildDuplicateLookup(clients)

  const hasData = headers.length > 0 && rows.length > 0

  useEffect(() => {
    let mounted = true
    async function loadImportAliases() {
      try {
        const raw = await getSetting('import_clients_aliases')
        if (!mounted) return
        if (!raw) {
          setImportAliases(DEFAULT_IMPORT_ALIASES)
          return
        }
        const parsed = JSON.parse(raw)
        setImportAliases(parsed && typeof parsed === 'object' ? parsed : DEFAULT_IMPORT_ALIASES)
      } catch (e) {
        setImportAliases(DEFAULT_IMPORT_ALIASES)
      }
    }
    loadImportAliases()
    return () => {
      mounted = false
    }
  }, [])

  const collectErrors = (): ClientImportError[] | null => {
    const missingMapping = REQUIRED_FIELDS.filter((f) => mapping[f] === undefined)
    if (missingMapping.length > 0) {
      toast({
        title: 'Mapping incomplet',
        description: `Veuillez mapper: ${missingMapping.join(', ')}`,
        variant: 'destructive',
      })
      return null
    }
    const existingPhones = new Set<string>()
    const existingEmails = new Set<string>()
    const ownerByPhone = new Map<string, typeof clients[number]>()
    const ownerByEmail = new Map<string, typeof clients[number]>()
    clients.forEach((c) => {
      const n = normalizePhoneForCompare(c.phone || '')
      if (n) {
        existingPhones.add(n)
        if (!ownerByPhone.has(n)) ownerByPhone.set(n, c)
      }
      const e = normalizeEmailForCompare(c.email || '')
      if (e) {
        existingEmails.add(e)
        if (!ownerByEmail.has(e)) ownerByEmail.set(e, c)
      }
    })
    const seenPhonesInFile = new Set<string>()
    const seenEmailsInFile = new Set<string>()
    const nextErrors: ClientImportError[] = []
    rows.forEach((row, idx) => {
      const isEmpty = row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')
      if (isEmpty) return
      const parsed = buildRow(row, mapping, overrides[idx])
      const rowErrors = validateRow(parsed)
      const normalized = normalizePhoneForCompare(parsed.phone || '')
      if (normalized) {
        if (existingPhones.has(normalized)) {
          const owner = ownerByPhone.get(normalized)
          rowErrors.push(buildDuplicateMessage('phone', normalized, ownerByPhone))
          if (owner && !parsed._duplicateOwner) {
            parsed._duplicateOwner = {
              id: owner.id,
              firstName: owner.firstName,
              lastName: owner.lastName,
              phone: owner.phone,
              email: owner.email,
            }
          }
        }
        if (seenPhonesInFile.has(normalized)) {
          rowErrors.push('Téléphone dupliqué dans le fichier')
        }
        seenPhonesInFile.add(normalized)
      }
      const normalizedEmail = normalizeEmailForCompare(parsed.email || '')
      if (normalizedEmail) {
        if (!validateEmail(parsed.email || '')) {
          rowErrors.push('Email invalide (ex: nom@domaine.com)')
        }
        if (existingEmails.has(normalizedEmail)) {
          const owner = ownerByEmail.get(normalizedEmail)
          rowErrors.push(buildDuplicateMessage('email', normalizedEmail, ownerByEmail))
          if (owner && !parsed._duplicateOwner) {
            parsed._duplicateOwner = {
              id: owner.id,
              firstName: owner.firstName,
              lastName: owner.lastName,
              phone: owner.phone,
              email: owner.email,
            }
          }
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
  }

  const computeErrors = (opts?: { keepFixOpen?: boolean }) => {
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
  }

  const handleFile = async (file: File) => {
    const result = await parseSpreadsheet(file)
    setFileName(file.name)
    setHeaders(result.headers)
    setRows(result.rows)
    setMapping(guessMapping(result.headers, importAliases ?? DEFAULT_IMPORT_ALIASES))
    setErrors([])
    setOverrides({})
    setShowFix(false)
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      await handleFile(f)
      toast({ title: 'Fichier chargé', description: f.name })
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message || 'Impossible de lire le fichier', variant: 'destructive' })
    }
  }

  const mappedRows = useMemo(() => {
    return rows.map((r, idx) => buildRow(r, mapping, overrides[idx]))
  }, [rows, mapping, overrides])

  const handleImport = async () => {
    const nextErrors = collectErrors()
    if (!nextErrors) return
    setIsImporting(true)
    try {
      const errorByRow = new Map(nextErrors.map((e) => [e.rowIndex, e]))
      const inserted: { id: string; firstName: string; lastName: string; phone: string; email?: string }[] = []
      const finalErrors: ClientImportError[] = [...nextErrors]
      for (let idx = 0; idx < mappedRows.length; idx++) {
        if (errorByRow.has(idx)) continue
        const rawRow = rows[idx]
        const isEmpty = rawRow.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')
        if (isEmpty) continue
        const row = mappedRows[idx]
        if (!row.firstName || !row.lastName || !row.phone) {
          finalErrors.push({
            rowIndex: idx,
            rowNumber: idx + 2,
            errors: ['Données obligatoires manquantes'],
            raw: rows[idx],
            parsed: row,
          })
          continue
        }
        const defaults = {
          propertyType: row.propertyType || 'apartment',
          propertyName: row.propertyName || 'Non renseigné',
          startDate: row.startDate || new Date(),
          monthlyRent: row.monthlyRent ?? 0,
          depositTotal: row.depositTotal ?? 0,
          depositPaid: row.depositPaid ?? 0,
          status: row.status || 'active',
        }

        try {
          const created = await addClient({
            firstName: row.firstName || '',
            lastName: row.lastName || '',
            phone: row.phone || '',
            email: row.email || '',
            cni: row.cni || '',
            status: defaults.status as any,
            rental: {
              propertyType: defaults.propertyType as any,
              propertyName: defaults.propertyName,
              startDate: defaults.startDate,
              monthlyRent: defaults.monthlyRent,
              deposit: {
                total: defaults.depositTotal,
                paid: defaults.depositPaid,
                payments: [],
              },
            },
          })
          inserted.push({
            id: created.id,
            firstName: created.firstName || row.firstName || '',
            lastName: created.lastName || row.lastName || '',
            phone: created.phone || row.phone || '',
            email: created.email || row.email || '',
          })
        } catch (e: any) {
          finalErrors.push({
            rowIndex: idx,
            rowNumber: idx + 2,
            errors: [formatBackendError(e, row, ownerByPhone, ownerByEmail)],
            raw: rows[idx],
            parsed: row,
          })
        }
      }
      const run = await createImportRun({
        createdAt: new Date().toISOString(),
        fileName,
        totalRows: mappedRows.length,
        inserted,
        errors: finalErrors.map((e) => ({
          rowNumber: e.rowNumber,
          errors: e.errors,
          parsed: e.parsed,
        })),
        ignored: false,
      })
      if (finalErrors.length > 0) {
        toast({ title: 'Import terminé', description: `${inserted.length} client(s) inséré(s), ${finalErrors.length} erreur(s)` })
        navigate(`/import/errors`)
      } else {
        toast({ title: 'Import terminé', description: `${inserted.length} client(s) importé(s)` })
        navigate('/import/success')
      }
    } catch (e: any) {
      toast({ title: 'Erreur import', description: e?.message || 'Import échoué', variant: 'destructive' })
    } finally {
      setIsImporting(false)
    }
  }

  const saveErrorsAndGo = async () => {
    const nextErrors = collectErrors()
    if (!nextErrors) return
    try {
      await createImportRun({
        createdAt: new Date().toISOString(),
        fileName,
        totalRows: mappedRows.length,
        inserted: [],
        errors: nextErrors.map((e) => ({
          rowNumber: e.rowNumber,
          errors: e.errors,
          parsed: e.parsed,
        })),
        ignored: false,
      })
      navigate('/import/errors')
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message || 'Impossible d’enregistrer les erreurs', variant: 'destructive' })
    }
  }

  const updateOverride = (rowIndex: number, field: 'firstName' | 'lastName' | 'phone', value: string) => {
    setOverrides((prev) => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [field]: value,
      },
    }))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Import clients (Excel)</h1>
          <p className="text-sm text-muted-foreground">Mapper les colonnes, corriger les erreurs, puis importer.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/clients')}>
          Retour clients
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Charger un fichier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} />
          {fileName && (
            <div className="text-sm text-muted-foreground">Fichier: {fileName}</div>
          )}
        </CardContent>
      </Card>

      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle>Mapping des colonnes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid md:grid-cols-3 gap-4">
              {REQUIRED_FIELDS.map((field) => (
                <div key={field} className="space-y-2">
                  <Label>Obligatoire: {field}</Label>
                  <Select
                    value={mapping[field] !== undefined ? String(mapping[field]) : undefined}
                    onValueChange={(val) => setMapping((m) => ({ ...m, [field]: Number(val) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une colonne" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h, i) => (
                        <SelectItem key={h + i} value={String(i)}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {OPTIONAL_FIELDS.map((field) => (
                <div key={field} className="space-y-2">
                  <Label>Optionnel: {field}</Label>
                  <Select
                    value={mapping[field] !== undefined ? String(mapping[field]) : '__none__'}
                    onValueChange={(val) =>
                      setMapping((m) => ({ ...m, [field]: val === '__none__' ? undefined : Number(val) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="(optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Aucune</SelectItem>
                      {headers.map((h, i) => (
                        <SelectItem key={h + i} value={String(i)}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => computeErrors()}>
                Analyser
              </Button>
              <Button variant="secondary" onClick={handleImport} disabled={isImporting}>
                <Upload className="w-4 h-4 mr-2" />
                Importer les lignes valides
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

  {(errors.length > 0 || showFix) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {errors.length} ligne(s) en erreur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFix(true)}>
                Corriger maintenant
              </Button>
              <Button variant="secondary" onClick={saveErrorsAndGo}>
                Envoyer vers la page erreurs
              </Button>
            </div>

            {showFix && (
              <div className="space-y-4">
                {errors.length === 0 ? (
                  <Card className="border-emerald-200 bg-emerald-50">
                    <CardContent className="pt-4 space-y-2 text-emerald-800">
                      <p className="font-medium">Aucune erreur restante.</p>
                      <p className="text-sm">Vous pouvez importer les lignes valides.</p>
                    </CardContent>
                  </Card>
                ) : (
                  errors.map((e) => (
                    <Card key={e.rowIndex} className="border-destructive/40">
                      <CardContent className="pt-4 space-y-3">
                        <div className="text-sm text-muted-foreground">
                          Ligne {e.rowNumber} — {e.errors.join(', ')}
                        </div>
                        <div className="grid md:grid-cols-3 gap-3">
                          <Input
                            placeholder="Prénom"
                            value={overrides[e.rowIndex]?.firstName ?? e.parsed.firstName ?? ''}
                            onChange={(ev) => updateOverride(e.rowIndex, 'firstName', ev.target.value)}
                          />
                          <Input
                            placeholder="Nom"
                            value={overrides[e.rowIndex]?.lastName ?? e.parsed.lastName ?? ''}
                            onChange={(ev) => updateOverride(e.rowIndex, 'lastName', ev.target.value)}
                          />
                          <Input
                            placeholder="Téléphone"
                            value={overrides[e.rowIndex]?.phone ?? e.parsed.phone ?? ''}
                            onChange={(ev) => updateOverride(e.rowIndex, 'phone', ev.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                <div className="flex gap-2">
                  <Button onClick={() => computeErrors({ keepFixOpen: true })}>
                    Re‑valider
                  </Button>
                  {errors.length === 0 && (
                    <Button variant="secondary" onClick={handleImport} disabled={isImporting}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Importer
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function buildDuplicateLookup(clients: Array<{ phone?: string; email?: string }>) {
  const ownerByPhone = new Map<string, typeof clients[number]>()
  const ownerByEmail = new Map<string, typeof clients[number]>()
  clients.forEach((c) => {
    const n = normalizePhoneForCompare(c.phone || '')
    if (n && !ownerByPhone.has(n)) ownerByPhone.set(n, c)
    const e = normalizeEmailForCompare(c.email || '')
    if (e && !ownerByEmail.has(e)) ownerByEmail.set(e, c)
  })
  return { ownerByPhone, ownerByEmail }
}

function buildDuplicateMessage(
  kind: 'phone' | 'email',
  key: string,
  owners: Map<string, { firstName?: string; lastName?: string; phone?: string; email?: string }>,
) {
  const owner = owners.get(key)
  if (!owner) {
    return kind === 'phone'
      ? 'Numéro déjà utilisé (un client existe déjà)'
      : 'Email déjà utilisé (un client existe déjà)'
  }
  const fullName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Client existant'
  const contact = kind === 'phone' ? (owner.phone || '—') : (owner.email || '—')
  return kind === 'phone'
    ? `Numéro déjà utilisé par ${fullName} (${contact})`
    : `Email déjà utilisé par ${fullName} (${contact})`
}

function formatBackendError(
  err: any,
  parsed: any,
  ownerByPhone: Map<string, { firstName?: string; lastName?: string; phone?: string }>,
  ownerByEmail: Map<string, { firstName?: string; lastName?: string; email?: string }>,
) {
  const message = String(err?.message || 'Erreur lors de la création')
  if (message.includes('409')) {
    const n = normalizePhoneForCompare(parsed?.phone || '')
    if (n && ownerByPhone.has(n)) return buildDuplicateMessage('phone', n, ownerByPhone)
    const e = normalizeEmailForCompare(parsed?.email || '')
    if (e && ownerByEmail.has(e)) return buildDuplicateMessage('email', e, ownerByEmail)
    return 'Doublon détecté (numéro/email déjà utilisé)'
  }
  if (message.includes('401')) {
    return 'Non autorisé (session expirée)'
  }
  return message
}
