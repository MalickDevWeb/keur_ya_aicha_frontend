import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { ClientImportMapping } from '@/lib/importClients'
import { buildRow } from '@/lib/importClients'

interface ParsedRow {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  propertyType?: string
  propertyName?: string
  startDate?: Date
  monthlyRent?: number
  depositTotal?: number
  depositPaid?: number
  status?: string
  [key: string]: unknown
}

interface ImportClientsReviewDataSectionProps {
  rows: (string | number | Date | null)[][]
  mapping: ClientImportMapping
  onImport: () => Promise<void>
  isLoading?: boolean
}

/**
 * Review data section for import clients
 * Displays parsed and mapped data before import
 */
export function ImportClientsReviewDataSection({
  rows,
  mapping,
  onImport,
  isLoading = false,
}: ImportClientsReviewDataSectionProps) {
  const [expanded, setExpanded] = useState(false)

  const mappedRows = useMemo(() => rows.map((row) => buildRow(row, mapping)), [rows, mapping])

  const displayRows = expanded ? mappedRows : mappedRows.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aperçu des données</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <strong>{rows.length}</strong> ligne(s) à importer
        </div>

        {displayRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-2 py-1 text-left font-medium">Prénom</th>
                  <th className="px-2 py-1 text-left font-medium">Nom</th>
                  <th className="px-2 py-1 text-left font-medium">Téléphone</th>
                  <th className="px-2 py-1 text-left font-medium">Email</th>
                  <th className="px-2 py-1 text-left font-medium">Type bien</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row: ParsedRow, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-1">{row.firstName || '-'}</td>
                    <td className="px-2 py-1">{row.lastName || '-'}</td>
                    <td className="px-2 py-1">{row.phone || '-'}</td>
                    <td className="px-2 py-1 text-xs">{row.email || '-'}</td>
                    <td className="px-2 py-1">{row.propertyType || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Afficher moins
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Afficher {rows.length - 5} ligne(s) supplémentaire(s)
              </>
            )}
          </button>
        )}

        <div className="border-t pt-4">
          <Button onClick={onImport} disabled={isLoading} className="w-full">
            {isLoading ? 'Importation en cours...' : 'Confirmer l\'importation'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
