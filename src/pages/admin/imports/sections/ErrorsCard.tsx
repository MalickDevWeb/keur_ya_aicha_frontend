import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ClientImportError } from '@/lib/importClients'
import type { RowOverrides } from '../types'

type ErrorsCardProps = {
  errors: ClientImportError[]
  showFix: boolean
  overrides: RowOverrides
  onShowFix: () => void
  onSaveErrors: () => void
  onUpdateOverride: (rowIndex: number, field: 'firstName' | 'lastName' | 'phone' | 'cni', value: string) => void
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
        <div className="grid grid-cols-1 gap-2 md:flex md:flex-row md:flex-wrap">
          <Button variant="outline" onClick={onShowFix} className="w-full md:w-auto whitespace-normal text-center">
            Corriger maintenant
          </Button>
          <Button variant="secondary" onClick={onSaveErrors} className="w-full md:w-auto whitespace-normal text-center">
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
                    <div className="text-sm text-muted-foreground break-words">
                      <p>Ligne {err.rowNumber}</p>
                      <ul className="list-disc pl-5">
                        {err.errors.map((errorMessage) => (
                          <li key={`${err.rowIndex}-${errorMessage}`}>{errorMessage}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Prénom</Label>
                        <Input
                          placeholder="Prénom"
                          value={overrides[err.rowIndex]?.firstName ?? err.parsed.firstName ?? ''}
                          onChange={(event) => onUpdateOverride(err.rowIndex, 'firstName', event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Nom</Label>
                        <Input
                          placeholder="Nom"
                          value={overrides[err.rowIndex]?.lastName ?? err.parsed.lastName ?? ''}
                          onChange={(event) => onUpdateOverride(err.rowIndex, 'lastName', event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Téléphone</Label>
                        <Input
                          placeholder="Téléphone"
                          value={overrides[err.rowIndex]?.phone ?? err.parsed.phone ?? ''}
                          onChange={(event) => onUpdateOverride(err.rowIndex, 'phone', event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">CNI</Label>
                        <Input
                          placeholder="CNI"
                          value={overrides[err.rowIndex]?.cni ?? err.parsed.cni ?? ''}
                          onChange={(event) => onUpdateOverride(err.rowIndex, 'cni', event.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            <div className="grid grid-cols-1 gap-2 md:flex md:flex-row md:flex-wrap">
              <Button onClick={onRevalidate} className="w-full md:w-auto whitespace-normal text-center">
                Re‑valider
              </Button>
              {errors.length === 0 && (
                <Button
                  variant="secondary"
                  onClick={onImport}
                  disabled={isImporting}
                  className="w-full md:w-auto whitespace-normal text-center"
                >
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
