import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ClientImportMapping } from '@/lib/importClients'

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

type MappingCardProps = {
  headers: string[]
  mapping: ClientImportMapping
  onMappingChange: (next: ClientImportMapping) => void
  onAnalyze: () => void
  onImport: () => void
  isImporting: boolean
}

export function MappingCard({ headers, mapping, onMappingChange, onAnalyze, onImport, isImporting }: MappingCardProps) {
  return (
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

        <div className="grid md:grid-cols-3 gap-4">
          {OPTIONAL_FIELDS.map((field) => (
            <div key={field} className="space-y-2">
              <Label>Optionnel: {field}</Label>
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

        <div className="flex gap-2">
          <Button onClick={onAnalyze}>Analyser</Button>
          <Button variant="secondary" onClick={onImport} disabled={isImporting}>
            Importer les lignes valides
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
