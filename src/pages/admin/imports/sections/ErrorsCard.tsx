import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { ClientImportError } from '@/lib/importClients'
import type { RowOverrides } from '../types'

type ErrorsCardProps = {
  errors: ClientImportError[]
  showFix: boolean
  overrides: RowOverrides
  onShowFix: () => void
  onSaveErrors: () => void
  onUpdateOverride: (rowIndex: number, field: 'firstName' | 'lastName' | 'phone', value: string) => void
  onRevalidate: () => void
  onImport: () => void
  isImporting: boolean
}

export function ErrorsCard({
  errors,
  showFix,
  overrides,
  onShowFix,
  onSaveErrors,
  onUpdateOverride,
  onRevalidate,
  onImport,
  isImporting,
}: ErrorsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          {errors.length} ligne(s) en erreur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onShowFix}>
            Corriger maintenant
          </Button>
          <Button variant="secondary" onClick={onSaveErrors}>
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
              errors.map((err) => (
                <Card key={err.rowIndex} className="border-destructive/40">
                  <CardContent className="pt-4 space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Ligne {err.rowNumber} — {err.errors.join(', ')}
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <Input
                        placeholder="Prénom"
                        value={overrides[err.rowIndex]?.firstName ?? err.parsed.firstName ?? ''}
                        onChange={(event) => onUpdateOverride(err.rowIndex, 'firstName', event.target.value)}
                      />
                      <Input
                        placeholder="Nom"
                        value={overrides[err.rowIndex]?.lastName ?? err.parsed.lastName ?? ''}
                        onChange={(event) => onUpdateOverride(err.rowIndex, 'lastName', event.target.value)}
                      />
                      <Input
                        placeholder="Téléphone"
                        value={overrides[err.rowIndex]?.phone ?? err.parsed.phone ?? ''}
                        onChange={(event) => onUpdateOverride(err.rowIndex, 'phone', event.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            <div className="flex gap-2">
              <Button onClick={onRevalidate}>Re‑valider</Button>
              {errors.length === 0 && (
                <Button variant="secondary" onClick={onImport} disabled={isImporting}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Importer
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
