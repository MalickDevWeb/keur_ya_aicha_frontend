import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchImportRuns, updateImportRun } from '@/services/api'
import { ErrorsTable } from './components/ErrorsTable'
import { ErrorsActions } from './components/ErrorsActions'
import { PageHeader } from '@/pages/common/PageHeader'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { type StoredErrors } from './utils'

export default function ImportErrors() {
  const navigate = useNavigate()
  const [stored, setStored] = useState<StoredErrors | null>(null)
  const [allRuns, setAllRuns] = useState<StoredErrors[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setIsLoading(true)
      try {
        const runs = await fetchImportRuns()
        const latest = runs.find((r: StoredErrors) => !r.ignored)
        if (mounted) {
          setAllRuns(runs)
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

  const handleIgnore = async () => {
    if (!stored) return
    try {
      await updateImportRun(stored.id, { ignored: true })
      navigate('/import/clients')
    } catch {
      // ignore
    }
  }

  const handleDelete = async () => {
    if (!stored) return
    try {
      await updateImportRun(stored.id, { ignored: true })
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
        <PageHeader>
          <Button onClick={() => navigate('/import/clients')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'import
          </Button>
        </PageHeader>
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
      <PageHeader>
        <h1>Erreurs d'import</h1>
        <Button onClick={() => navigate('/import/clients')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </PageHeader>

      <SectionWrapper>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
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
            <div className="grid grid-cols-3 gap-4">
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
              <h3 className="font-semibold mb-4">Détail des erreurs</h3>
              <ErrorsTable storedErrors={stored.errors} inserted={stored.inserted} />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleIgnore} variant="outline">
                Marquer comme traité
              </Button>
              <Button onClick={() => navigate('/import/clients')} variant="default">
                Nouvel import
              </Button>
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
