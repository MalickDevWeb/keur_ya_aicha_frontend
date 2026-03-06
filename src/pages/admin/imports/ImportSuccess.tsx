import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchImportRuns, markImportRunRead } from '@/services/api'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

type ImportRun = {
  id: string
  adminId?: string
  createdAt: string
  fileName?: string
  totalRows?: number
  inserted?: {
    id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
  }[]
  errors?: {
    rowNumber: number
    errors: string[]
    parsed: unknown
  }[]
  readSuccess?: boolean
}

export default function ImportSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const { user, impersonation } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isHidingFromSidebar, setIsHidingFromSidebar] = useState(false)
  const [latest, setLatest] = useState<ImportRun | null>(null)
  const [runs, setRuns] = useState<ImportRun[]>([])
  const activeAdminId = useMemo(() => {
    const impersonated = String(impersonation?.adminId || '').trim()
    if (impersonated) return impersonated
    const role = String(user?.role || '').toUpperCase()
    if (role === 'ADMIN') {
      return String(user?.id || '').trim()
    }
    return ''
  }, [impersonation?.adminId, user?.id, user?.role])
  const requestedRunId = String((location.state as { importRunId?: string } | null)?.importRunId || '').trim()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setIsLoading(true)
      try {
        const runs = await fetchImportRuns()
        const visibleRuns = activeAdminId
          ? runs.filter((run: ImportRun) => String(run.adminId || '').trim() === activeAdminId)
          : runs

        const unreadSuccessRuns = visibleRuns.filter(
          (run: ImportRun) => (run.inserted?.length || 0) > 0 && !run.readSuccess
        )
        const unreadIds = new Set(unreadSuccessRuns.map((run: ImportRun) => run.id))
        const normalizedRuns = visibleRuns.map((run: ImportRun) =>
          unreadIds.has(run.id) ? { ...run, readSuccess: true } : run
        )
        if (!mounted) return
        setRuns(normalizedRuns)
        const requestedRun = requestedRunId
          ? normalizedRuns.find((run) => run.id === requestedRunId)
          : null
        setLatest(requestedRun || normalizedRuns[0] || null)
        setIsLoading(false)

        if (unreadSuccessRuns.length > 0) {
          void Promise.all(
            unreadSuccessRuns.map((run: ImportRun) => markImportRunRead(run.id, 'success'))
          ).then(() => {
            window.dispatchEvent(new Event('import-runs-updated'))
          })
        }
      } catch {
        if (mounted) {
          setRuns([])
          setLatest(null)
          setIsLoading(false)
        }
      }
    }
    void load()
    const onImportRunsUpdated = () => {
      void load()
    }
    window.addEventListener('import-runs-updated', onImportRunsUpdated)
    return () => {
      mounted = false
      window.removeEventListener('import-runs-updated', onImportRunsUpdated)
    }
  }, [activeAdminId, requestedRunId])

  const hideFromSidebar = async () => {
    if (isHidingFromSidebar) return
    const unreadIds = runs
      .filter((run) => (run.inserted?.length || 0) > 0 && !run.readSuccess)
      .map((run) => run.id)

    if (unreadIds.length === 0) {
      toast({ title: 'Déjà masqué', description: 'Aucun import non lu à masquer.' })
      return
    }

    try {
      setIsHidingFromSidebar(true)
      await Promise.all(unreadIds.map((id) => markImportRunRead(id, 'success')))
      setRuns((prev) => prev.map((run) => (unreadIds.includes(run.id) ? { ...run, readSuccess: true } : run)))
      setLatest((prev) => (prev && unreadIds.includes(prev.id) ? { ...prev, readSuccess: true } : prev))
      window.dispatchEvent(new Event('import-runs-updated'))
      toast({ title: 'Masqué', description: 'Le badge "Imports réussis" a été retiré de la sidebar.' })
    } finally {
      setIsHidingFromSidebar(false)
    }
  }

  const inserted = latest?.inserted || []
  const errorsCount = latest?.errors?.length || 0
  const fileName = latest?.fileName || '—'
  const reason = (location.state as { reason?: string } | null)?.reason

  const formatDate = (date?: string) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('fr-FR')
  }

  if (!latest && !isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Imports réussis</h1>
        <p className="text-sm text-muted-foreground">Aucun import enregistré.</p>
        <Button onClick={() => navigate('/import/clients')}>Lancer un import</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Imports réussis</h1>
          <p className="text-sm text-muted-foreground break-words">
            Dernier fichier importé : {fileName} • {formatDate(latest?.createdAt)}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={() => navigate('/import/clients')} className="w-full sm:w-auto">
            Nouvel import
          </Button>
          {errorsCount > 0 && (
            <Button variant="secondary" onClick={() => navigate('/import/errors')} className="w-full sm:w-auto">
              Voir erreurs ({errorsCount})
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={hideFromSidebar}
            disabled={isHidingFromSidebar}
            className="w-full sm:w-auto"
          >
            {isHidingFromSidebar ? 'Masquage...' : 'Masquer de la sidebar'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            {inserted.length} client(s) importé(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : inserted.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {reason || 'Aucun client importé sur le dernier fichier.'}
            </div>
          ) : isMobile ? (
            <div className="space-y-3">
              {inserted.map((c) => (
                <div key={c.id} className="rounded-xl border border-border p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-muted-foreground">Prénom:</span> {c.firstName || '—'}</p>
                    <p><span className="text-muted-foreground">Nom:</span> {c.lastName || '—'}</p>
                    <p className="col-span-2"><span className="text-muted-foreground">Téléphone:</span> {c.phone || '—'}</p>
                    <p className="col-span-2 break-all"><span className="text-muted-foreground">Email:</span> {c.email || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
