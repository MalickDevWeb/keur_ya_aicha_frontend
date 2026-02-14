import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchImportRuns } from '@/services/api'

type ImportRun = {
  id: string
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
}

export default function ImportSuccess() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [latest, setLatest] = useState<ImportRun | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setIsLoading(true)
      try {
        const runs = await fetchImportRuns()
        if (!mounted) return
        setLatest((runs && runs.length > 0) ? runs[0] : null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const inserted = latest?.inserted || []
  const errorsCount = latest?.errors?.length || 0
  const fileName = latest?.fileName || '—'

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Imports réussis</h1>
          <p className="text-sm text-muted-foreground">
            Dernier fichier importé : {fileName} • {formatDate(latest?.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/import/clients')}>
            Nouvel import
          </Button>
          {errorsCount > 0 && (
            <Button variant="secondary" onClick={() => navigate('/import/errors')}>
              Voir erreurs ({errorsCount})
            </Button>
          )}
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
              Aucun client importé sur le dernier fichier.
            </div>
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
    </div>
  )
}
