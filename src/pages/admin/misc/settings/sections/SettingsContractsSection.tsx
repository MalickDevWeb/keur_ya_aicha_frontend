import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  listContractTemplates,
  createContractTemplate,
  updateContractTemplate,
  deleteContractTemplate,
  type ContractTemplate,
} from '@/services/api/contractTemplates.api'
import { useToast } from '@/hooks/use-toast'

export function SettingsContractsSection() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [nom, setNom] = useState('')
  const [corps, setCorps] = useState('')
  const [loading, setLoading] = useState(false)

  const selected = templates.find((tpl) => tpl.id === selectedId) || null

  useEffect(() => {
    void (async () => {
      try {
        const data = await listContractTemplates()
        setTemplates(data)
        if (data.length > 0) {
          setSelectedId(data[0].id)
          setNom(data[0].nom)
          setCorps(data[0].corps)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Impossible de charger les templates.'
        toast({ title: 'Erreur', description: message, variant: 'destructive' })
      }
    })()
  }, [toast])

  const resetForm = () => {
    setSelectedId(null)
    setNom('')
    setCorps('')
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      if (selectedId) {
        const updated = await updateContractTemplate({ id: selectedId, nom, corps })
        setTemplates((prev) => prev.map((tpl) => (tpl.id === updated.id ? updated : tpl)))
        toast({ title: 'Template mis à jour', description: `Version ${updated.version}` })
      } else {
        const created = await createContractTemplate({ nom, corps })
        setTemplates((prev) => [created, ...prev])
        setSelectedId(created.id)
        toast({ title: 'Template créé', description: created.nom })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de sauvegarder le template.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      await deleteContractTemplate(id)
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== id))
      if (selectedId === id) resetForm()
      toast({ title: 'Template supprimé' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Suppression impossible.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Templates de contrat</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetForm} disabled={loading}>
            Nouveau
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading || !nom.trim() || !corps.trim()}>
            {selectedId ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-muted-foreground">Templates existants</label>
            <div className="flex flex-wrap gap-2">
              {templates.map((tpl) => (
                <Button
                  key={tpl.id}
                  variant={tpl.id === selectedId ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedId(tpl.id)
                    setNom(tpl.nom)
                    setCorps(tpl.corps)
                  }}
                  disabled={loading}
                >
                  {tpl.nom} (v{tpl.version})
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-muted-foreground">Nom</label>
            <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Contrat de location" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-muted-foreground">ID sélectionné</label>
            <Input value={selectedId || 'Nouveau'} disabled />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase text-muted-foreground">
            {"Contenu (placeholders {{client.nom}}, {{bail.debut}}, etc.)"}
          </label>
          <Textarea
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            rows={10}
            placeholder="Bonjour {{client.nom}}, voici votre contrat..."
          />
        </div>

        {selected && (
          <Button variant="destructive" size="sm" onClick={() => void handleDelete(selected.id)} disabled={loading}>
            Supprimer
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
