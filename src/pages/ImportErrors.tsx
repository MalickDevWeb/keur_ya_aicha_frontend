import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchImportRuns, getSetting, updateImportRun } from '@/services/api'
import { useData } from '@/contexts/DataContext'
import { Input } from '@/components/ui/input'
import ExcelJS from 'exceljs'
import { normalizeEmailForCompare, normalizePhoneForCompare, validateEmail } from '@/validators/clientValidator'
import { validateRow } from '@/lib/importClients'

type StoredErrors = {
  id: string
  createdAt: string
  fileName?: string
  inserted?: {
    id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
  }[]
  errors: {
    rowNumber: number
    errors: string[]
    parsed: any
  }[]
  ignored?: boolean
}

function escapeCsv(value: string) {
  const v = String(value ?? '')
  if (v.includes('"') || v.includes(',') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

function buildReportRows(
  inserted: StoredErrors['inserted'],
  storedErrors: StoredErrors['errors'],
) {
  const rows: {
    type: string
    rowNumber: string
    firstName: string
    lastName: string
    phone: string
    email: string
    errors: string
  }[] = []

  ;(inserted || []).forEach((c) => {
    rows.push({
      type: 'inserted',
      rowNumber: '',
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      phone: c.phone || '',
      email: c.email || '',
      errors: '',
    })
  })

  ;(storedErrors || []).forEach((e) => {
    rows.push({
      type: 'error',
      rowNumber: String(e.rowNumber || ''),
      firstName: e.parsed?.firstName || '',
      lastName: e.parsed?.lastName || '',
      phone: e.parsed?.phone || '',
      email: e.parsed?.email || '',
      errors: (e.errors || []).join(' | '),
    })
  })

  return rows
}

function buildReportCsv(
  reportRows: ReturnType<typeof buildReportRows>,
) {
  const rows: string[] = [
    'type,rowNumber,firstName,lastName,phone,email,errors',
    ...reportRows.map((row) => ([
      row.type,
      row.rowNumber,
      row.firstName,
      row.lastName,
      row.phone,
      row.email,
      row.errors,
    ].map(escapeCsv).join(','))),
  ]
  return rows.join('\n')
}

function buildDuplicateLookup(clients: Array<{ id?: string; firstName?: string; lastName?: string; phone?: string; email?: string }>) {
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

function findOwnerForParsed(
  parsed: any,
  ownerByPhone: Map<string, { id?: string; firstName?: string; lastName?: string; phone?: string; email?: string }>,
  ownerByEmail: Map<string, { id?: string; firstName?: string; lastName?: string; phone?: string; email?: string }>,
) {
  if (parsed?._duplicateOwner?.id || parsed?._duplicateOwner?.phone || parsed?._duplicateOwner?.email) {
    return parsed._duplicateOwner
  }
  const normalizedPhone = normalizePhoneForCompare(parsed?.phone || '')
  if (normalizedPhone && ownerByPhone.has(normalizedPhone)) {
    return ownerByPhone.get(normalizedPhone)
  }
  const normalizedEmail = normalizeEmailForCompare(parsed?.email || '')
  if (normalizedEmail && ownerByEmail.has(normalizedEmail)) {
    return ownerByEmail.get(normalizedEmail)
  }
  return null
}

function formatBackendError(
  err: any,
  parsed: any,
  ownerByPhone: Map<string, { firstName?: string; lastName?: string; phone?: string; email?: string }>,
  ownerByEmail: Map<string, { firstName?: string; lastName?: string; email?: string }>,
) {
  const message = String(err?.message || 'Erreur lors de la création')
  if (message.includes('409') || message.toLowerCase().includes('doublon')) {
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

function formatErrors(
  errors: string[],
  parsed: any,
  ownerByPhone: Map<string, { firstName?: string; lastName?: string; phone?: string; email?: string }>,
  ownerByEmail: Map<string, { firstName?: string; lastName?: string; email?: string }>,
) {
  return errors.map((err) => {
    const formatted = formatBackendError({ message: err }, parsed, ownerByPhone, ownerByEmail)
    if (formatted.toLowerCase().includes('doublon')) {
      const owner = findOwnerForParsed(parsed, ownerByPhone, ownerByEmail)
      if (owner) {
        const fullName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Client existant'
        const phone = owner.phone || '—'
        const email = owner.email || '—'
        return `Doublon détecté — ${fullName} • ${phone} • ${email}`
      }
      return 'Aucun doublon détecté dans vos clients'
    }
    return formatted
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function ImportErrors() {
  const navigate = useNavigate()
  const [stored, setStored] = useState<StoredErrors | null>(null)
  const [allRuns, setAllRuns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showOnlyErrors, setShowOnlyErrors] = useState(false)
  const [reportFormat, setReportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv')
  const [showFix, setShowFix] = useState(false)
  const [fixOverrides, setFixOverrides] = useState<Record<number, Partial<Record<'firstName' | 'lastName' | 'phone' | 'email', string>>>>({})
  const [fixResult, setFixResult] = useState<'success' | 'partial' | null>(null)
  const { addClient, clients } = useData()
  const { ownerByEmail, ownerByPhone } = buildDuplicateLookup(clients)

  const inserted = stored?.inserted || []
  const storedErrors = stored?.errors || []

  const reportRows = buildReportRows(inserted, storedErrors)
  const reportCsv = buildReportCsv(reportRows)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setIsLoading(true)
      try {
        const format = await getSetting('import_report_format')
        if (mounted && (format === 'csv' || format === 'xlsx' || format === 'json')) {
          setReportFormat(format)
        }
        const runs = await fetchImportRuns()
        setAllRuns(runs)
        // Find the latest non-ignored import run
        const latest = runs.find((r: any) => !r.ignored)
        if (mounted) setStored(latest || null)
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

  const handleIgnore = async () => {
    if (!stored) return
    await updateImportRun(stored.id, { ignored: true })
    navigate('/import/clients')
  }

  const updateOverride = (idx: number, field: 'firstName' | 'lastName' | 'phone' | 'email', value: string) => {
    setFixOverrides((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        [field]: value,
      },
    }))
  }

  const handleFixAndImport = async () => {
    if (!stored) return
    setFixResult(null)
    const nextInserted = [...(stored.inserted || [])]
    const nextErrors: StoredErrors['errors'] = []
    let hasNewErrors = false
    const existingPhones = new Set<string>(ownerByPhone.keys())
    const existingEmails = new Set<string>(ownerByEmail.keys())
    const seenPhones = new Set<string>()
    const seenEmails = new Set<string>()

    for (let i = 0; i < stored.errors.length; i++) {
      const e = stored.errors[i]
      const override = fixOverrides[i] || {}
      const parsed = { ...(e.parsed || {}), ...override }
      const rowErrors = validateRow(parsed)
      const normalizedPhone = normalizePhoneForCompare(parsed.phone || '')
      if (normalizedPhone) {
        if (existingPhones.has(normalizedPhone)) {
          const owner = ownerByPhone.get(normalizedPhone)
          rowErrors.push(buildDuplicateMessage('phone', normalizedPhone, ownerByPhone))
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
        if (seenPhones.has(normalizedPhone)) {
          rowErrors.push('Téléphone dupliqué dans la correction')
        }
        seenPhones.add(normalizedPhone)
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
        if (seenEmails.has(normalizedEmail)) {
          rowErrors.push('Email dupliqué dans la correction')
        }
        seenEmails.add(normalizedEmail)
      }
      if (rowErrors.length > 0) {
        hasNewErrors = true
        nextErrors.push({
          rowNumber: e.rowNumber,
          errors: rowErrors,
          parsed,
        })
        continue
      }
      const startDate = parsed.startDate ? new Date(parsed.startDate) : new Date()
      const safeStartDate = Number.isNaN(startDate.getTime()) ? new Date() : startDate
      const defaults = {
        propertyType: parsed.propertyType || 'apartment',
        propertyName: parsed.propertyName || 'Non renseigné',
        startDate: safeStartDate,
        monthlyRent: parsed.monthlyRent ?? 0,
        depositTotal: parsed.depositTotal ?? 0,
        depositPaid: parsed.depositPaid ?? 0,
        status: parsed.status || 'active',
      }
      try {
        const created = await addClient({
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          phone: parsed.phone || '',
          email: parsed.email || '',
          cni: parsed.cni || '',
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
        nextInserted.push({
          id: created.id,
          firstName: created.firstName || parsed.firstName || '',
          lastName: created.lastName || parsed.lastName || '',
          phone: created.phone || parsed.phone || '',
          email: created.email || parsed.email || '',
        })
      } catch (err: any) {
        hasNewErrors = true
        nextErrors.push({
          rowNumber: e.rowNumber,
          errors: [formatBackendError(err, parsed, ownerByPhone, ownerByEmail)],
          parsed,
        })
      }
    }

    const updated = {
      ...stored,
      inserted: nextInserted,
      errors: nextErrors,
    }
    await updateImportRun(stored.id, { inserted: nextInserted, errors: nextErrors })
    setStored(updated)
    setShowFix(false)
    setFixOverrides({})

    // Set result status
    if (nextErrors.length === 0) {
      setFixResult('success')
    } else if (nextErrors.length < stored.errors.length) {
      setFixResult('partial')
    }
  }

  // No import runs at all
  if (allRuns.length === 0 && !isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Erreurs d'import</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-16 h-16 text-success mb-4" />
            <p className="text-lg font-medium">Aucune importation enregistrée</p>
            <p className="text-sm text-muted-foreground mt-2">
              Importez un fichier Excel pour commencer
            </p>
            <Button className="mt-6" onClick={() => navigate('/import/clients')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'import
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No errors in the import run
  if (!stored && !isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Erreurs d'import</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-16 h-16 text-success mb-4" />
            <p className="text-lg font-medium text-success">Tout est bien !</p>
            <p className="text-sm text-muted-foreground mt-2">
              Aucune erreur trouvée dans vos importations
            </p>
            <Button className="mt-6" onClick={() => navigate('/import/clients')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'import
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Erreurs d'import</h1>
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (!stored) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Erreurs d'import</h1>
        <p className="text-muted-foreground">Aucune erreur enregistrée.</p>
        <Button onClick={() => navigate('/import/clients')}>Retour import</Button>
      </div>
    )
  }

  const handleDownloadReport = async () => {
    const safeName = (stored.fileName || 'import').replace(/\.[^.]+$/, '')
    if (reportFormat === 'json') {
      const payload = {
        fileName: stored.fileName || '—',
        createdAt: stored.createdAt,
        inserted,
        errors: stored.errors,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' })
      downloadBlob(blob, `${safeName}_rapport_import.json`)
      return
    }
    if (reportFormat === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Rapport')
      worksheet.columns = [
        { header: 'type', key: 'type', width: 12 },
        { header: 'rowNumber', key: 'rowNumber', width: 12 },
        { header: 'firstName', key: 'firstName', width: 18 },
        { header: 'lastName', key: 'lastName', width: 18 },
        { header: 'phone', key: 'phone', width: 16 },
        { header: 'email', key: 'email', width: 24 },
        { header: 'errors', key: 'errors', width: 40 },
      ]
      reportRows.forEach((row) => {
        worksheet.addRow(row)
      })
      const xlsxData = await workbook.xlsx.writeBuffer()
      const blob = new Blob([xlsxData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      downloadBlob(blob, `${safeName}_rapport_import.xlsx`)
      return
    }
    const blob = new Blob([reportCsv], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `${safeName}_rapport_import.csv`)
  }

  const hasRemainingErrors = stored.errors.length > 0

  // Show success message after fixing all errors
  if (fixResult === 'success' && !hasRemainingErrors) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Erreurs d'import</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-16 h-16 text-success mb-4" />
            <p className="text-lg font-medium text-success">Tout est bien !</p>
            <p className="text-sm text-muted-foreground mt-2">
              Toutes les erreurs ont été corrigées avec succès
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {inserted.length} client(s) importé(s)
            </p>
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={handleDownloadReport}>
                Télécharger le rapport
              </Button>
              <Button onClick={() => navigate('/import/clients')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'import
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Erreurs d'import</h1>
          <p className="text-sm text-muted-foreground">
            Fichier: {stored.fileName || '—'} • {new Date(stored.createdAt).toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/import/clients')}>
            Retour import
          </Button>
          <Button variant="outline" onClick={handleDownloadReport}>
            Télécharger le rapport
          </Button>
          <Button variant="secondary" onClick={() => setShowFix((v) => !v)}>
            Corriger
          </Button>
          <Button onClick={handleFixAndImport}>
            Corriger et importer
          </Button>
          <Button variant="ghost" onClick={handleIgnore}>
            Ignorer
          </Button>
        </div>
      </div>

      {fixResult === 'partial' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <p className="text-amber-800">
              ⚠️ Certaines erreurs n'ont pas pu être corrigées. Veuillez les corriger manuellement.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button
          variant={showOnlyErrors ? 'outline' : 'secondary'}
          onClick={() => setShowOnlyErrors(false)}
        >
          Voir tout
        </Button>
        <Button
          variant={showOnlyErrors ? 'secondary' : 'outline'}
          onClick={() => setShowOnlyErrors(true)}
        >
          Voir erreurs seulement
        </Button>
      </div>

      {!showOnlyErrors && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              {inserted.length} client(s) inséré(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inserted.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun client inséré.</p>
            ) : (
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
                  {inserted.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.firstName || '—'}</TableCell>
                      <TableCell>{c.lastName || '—'}</TableCell>
                      <TableCell>{c.phone || '—'}</TableCell>
                      <TableCell>{c.email || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            {stored.errors.length} ligne(s) en erreur
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showFix && stored.errors.length > 0 && (
            <div className="space-y-4 mb-6">
              {stored.errors.map((e, idx) => (
                <Card key={`${e.rowNumber}-fix-${idx}`} className="border-destructive/40">
                  <CardContent className="pt-4 space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Ligne {e.rowNumber} — {formatErrors(e.errors || [], e.parsed, ownerByPhone, ownerByEmail).join(', ')}
                    </div>
                    <div className="grid md:grid-cols-4 gap-3">
                      <Input
                        placeholder="Prénom"
                        value={fixOverrides[idx]?.firstName ?? e.parsed?.firstName ?? ''}
                        onChange={(ev) => updateOverride(idx, 'firstName', ev.target.value)}
                      />
                      <Input
                        placeholder="Nom"
                        value={fixOverrides[idx]?.lastName ?? e.parsed?.lastName ?? ''}
                        onChange={(ev) => updateOverride(idx, 'lastName', ev.target.value)}
                      />
                      <Input
                        placeholder="Téléphone"
                        value={fixOverrides[idx]?.phone ?? e.parsed?.phone ?? ''}
                        onChange={(ev) => updateOverride(idx, 'phone', ev.target.value)}
                      />
                      <Input
                        placeholder="Email"
                        value={fixOverrides[idx]?.email ?? e.parsed?.email ?? ''}
                        onChange={(ev) => updateOverride(idx, 'email', ev.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ligne</TableHead>
                <TableHead>Problèmes</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stored.errors.map((e, idx) => (
                <TableRow key={`${e.rowNumber}-${idx}`}>
                  <TableCell>{e.rowNumber}</TableCell>
                  <TableCell className="text-destructive">
                    {formatErrors(e.errors, e.parsed, ownerByPhone, ownerByEmail).join(', ')}
                  </TableCell>
                  <TableCell>{e.parsed?.firstName || '—'}</TableCell>
                  <TableCell>{e.parsed?.lastName || '—'}</TableCell>
                  <TableCell>{e.parsed?.phone || '—'}</TableCell>
                  <TableCell>
                    {(() => {
                      const owner = findOwnerForParsed(e.parsed, ownerByPhone, ownerByEmail)
                      if (!owner?.id) return '—'
                      return (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/clients/${owner.id}`)}
                        >
                          Détails
                        </Button>
                      )
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
