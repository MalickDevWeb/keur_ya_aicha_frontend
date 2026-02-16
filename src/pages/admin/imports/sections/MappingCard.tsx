import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ClientImportMapping } from '@/lib/importClients'
import { CLIENT_IMPORT_FIELDS, FIELD_LABELS } from '@/lib/importClients'

type MappingCardProps = {
  headers: string[]
  mapping: ClientImportMapping
  requiredFields: Array<keyof ClientImportMapping>
  onMappingChange: (next: ClientImportMapping) => void
  onAnalyze: () => void
  onImport: () => void
  isImporting: boolean
}

export function MappingCard({
  headers,
  mapping,
  requiredFields,
  onMappingChange,
  onAnalyze,
  onImport,
  isImporting,
}: MappingCardProps) {
  const optionalFields = CLIENT_IMPORT_FIELDS.filter((field) => !requiredFields.includes(field))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapping des colonnes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {requiredFields.map((field) => (
            <div key={field} className="space-y-2">
              <Label>Obligatoire: {FIELD_LABELS[field] || field}</Label>
              <Select
                value={mapping[field] !== undefined ? String(mapping[field]) : undefined}
                onValueChange={(val) => onMappingChange({ ...mapping, [field]: Number(val) })}
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
          <Button onClick={onAnalyze} className="w-full md:w-auto whitespace-normal text-center">
            Analyser
          </Button>
          <Button
            variant="secondary"
            onClick={onImport}
            disabled={isImporting}
            className="w-full md:w-auto whitespace-normal text-center"
          >
            Importer les lignes valides
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
