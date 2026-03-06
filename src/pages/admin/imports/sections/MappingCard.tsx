import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { ClientImportMapping } from '@/lib/importClients'
import { CLIENT_IMPORT_FIELDS, FIELD_LABELS } from '@/lib/importClients'

type MappingCardProps = {
  headers: string[]
  mapping: ClientImportMapping
  requiredFields: Array<keyof ClientImportMapping>
  onMappingChange: (next: ClientImportMapping) => void
  onAnalyze: () => void
  onImport: () => void
  isAnalyzing: boolean
  isImporting: boolean
}

export function MappingCard({
  headers,
  mapping,
  requiredFields,
  onMappingChange,
  onAnalyze,
  onImport,
  isAnalyzing,
  isImporting,
}: MappingCardProps) {
  const optionalFields = CLIENT_IMPORT_FIELDS.filter((field) => !requiredFields.includes(field))
  const isBusy = isAnalyzing || isImporting
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapping des colonnes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-[#121B53]/10 bg-[#F7F9FF] p-3 text-sm">
          <p className="font-medium text-[#121B53]">Comment mapper simplement</p>
          <p className="mt-1 text-muted-foreground">
            Associez d’abord tous les champs <strong>Obligatoire</strong>. Les champs
            <strong> Optionnel</strong> peuvent rester sur <em>Aucune</em>.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {requiredFields.map((field) => (
            <div key={field} className="space-y-2">
              <Label>Obligatoire: {FIELD_LABELS[field] || field}</Label>
              <Select
                value={mapping[field] !== undefined ? String(mapping[field]) : undefined}
                onValueChange={(val) => onMappingChange({ ...mapping, [field]: Number(val) })}
                disabled={isBusy}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une colonne" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((h, i) => (
                    <SelectItem key={`${h}-${i}`} value={String(i)}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {optionalFields.map((field) => (
            <div key={field} className="space-y-2">
              <Label>Optionnel: {FIELD_LABELS[field] || field}</Label>
              <Select
                value={mapping[field] !== undefined ? String(mapping[field]) : '__none__'}
                onValueChange={(val) =>
                  onMappingChange({ ...mapping, [field]: val === '__none__' ? undefined : Number(val) })
                }
                disabled={isBusy}
              >
                <SelectTrigger>
                  <SelectValue placeholder="(optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucune</SelectItem>
                  {headers.map((h, i) => (
                    <SelectItem key={`${h}-${i}`} value={String(i)}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 md:flex md:flex-row md:flex-wrap">
          <Button onClick={onAnalyze} disabled={isBusy} className="w-full md:w-auto whitespace-normal text-center">
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isAnalyzing ? 'Analyse en cours...' : 'Analyser'}
          </Button>
          <Button
            variant="secondary"
            onClick={onImport}
            disabled={isBusy}
            className="w-full md:w-auto whitespace-normal text-center"
          >
            {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isImporting ? 'Import en cours...' : 'Importer les lignes valides'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
