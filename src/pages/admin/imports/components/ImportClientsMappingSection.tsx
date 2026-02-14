import { useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ClientImportMapping } from '@/lib/importClients'

const REQUIRED_FIELDS = ['firstName', 'lastName', 'phone'] as const
const ALL_FIELDS = [
  'firstName',
  'lastName',
  'phone',
  'email',
  'propertyType',
  'propertyName',
  'startDate',
  'monthlyRent',
  'depositTotal',
  'depositPaid',
  'status',
] as const

interface ImportClientsMappingSectionProps {
  headers: string[]
  mapping: ClientImportMapping
  onChange: (mapping: ClientImportMapping) => void
  onAnalyze: () => void
}

/**
 * Mapping section for import clients
 * Allows users to map CSV headers to client fields
 */
export function ImportClientsMappingSection({
  headers,
  mapping,
  onChange,
  onAnalyze,
}: ImportClientsMappingSectionProps) {
  const handleFieldChange = useCallback(
    (field: string, header: string | null) => {
      const nextMapping = { ...mapping }
      if (header === null) {
        delete nextMapping[field as keyof ClientImportMapping]
      } else {
        nextMapping[field as keyof ClientImportMapping] = header
      }
      onChange(nextMapping)
    },
    [mapping, onChange]
  )

  const missingRequired = (REQUIRED_FIELDS as readonly string[]).filter((field) => !(field in mapping))
  const requirementsMet = missingRequired.length === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapper les colonnes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display current mappings */}
        {Object.entries(mapping).map(([field, header]) => (
          <div key={field} className="flex items-center gap-2">
            <div className="min-w-24 text-sm font-medium">{field}</div>
            <div className="flex-1 text-sm text-gray-600">→ {header}</div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleFieldChange(field, null)}
            >
              ✕
            </Button>
          </div>
        ))}

        {/* Mapping selectors for unmapped fields */}
        {(ALL_FIELDS as readonly string[])
          .filter((field) => !(field in mapping))
          .map((field) => (
            <div key={field} className="flex items-center gap-2">
              <label className="min-w-24 text-sm font-medium">{field}</label>
              <Select
                onValueChange={(value) => handleFieldChange(field, value === '_none' ? null : value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Sauter ce champ —</SelectItem>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

        {/* Status indicator */}
        <div className="border-t pt-4">
          {missingRequired.length > 0 && (
            <div className="text-sm text-red-600 mb-3">
              ⚠️ Manquant: {missingRequired.join(', ')}
            </div>
          )}
          <Button
            onClick={onAnalyze}
            disabled={!requirementsMet}
            className="w-full"
          >
            {requirementsMet ? 'Analyser les données' : 'Complétez le mapping'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
