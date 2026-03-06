import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, PencilLine } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { buildRow, type ClientImportMapping } from '@/lib/importClients'
import type { RowOverrides } from '../types'

type ReviewBeforeImportCardProps = {
  rows: (string | number | Date | null)[][]
  mapping: ClientImportMapping
  overrides: RowOverrides
  onUpdateOverride: (
    rowIndex: number,
    field: 'firstName' | 'lastName' | 'phone' | 'email' | 'cni',
    value: string
  ) => void
}

const COLLAPSED_LIMIT = 8

export function ReviewBeforeImportCard({
  rows,
  mapping,
  overrides,
  onUpdateOverride,
}: ReviewBeforeImportCardProps) {
  const [expanded, setExpanded] = useState(false)

  const previewRows = useMemo(
    () =>
      rows.map((row, rowIndex) => ({
        rowIndex,
        parsed: buildRow(row, mapping, overrides[rowIndex]),
      })),
    [mapping, overrides, rows]
  )

  const visibleRows = expanded ? previewRows : previewRows.slice(0, COLLAPSED_LIMIT)
  const remaining = Math.max(0, previewRows.length - COLLAPSED_LIMIT)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PencilLine className="h-5 w-5" />
          Prévisualisation avant import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
          Le fichier est ouvert dans l’application. Vous pouvez relire et ajuster les champs
          principaux avant l’analyse ou l’import.
        </div>

        <div className="space-y-3">
          {visibleRows.map(({ rowIndex, parsed }) => (
            <div key={rowIndex} className="rounded-xl border border-border/70 bg-card p-3">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold">Ligne {rowIndex + 2}</p>
                <p className="text-xs text-muted-foreground break-all">
                  {parsed.propertyName || parsed.propertyType || 'Sans location liée'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-5">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Prénom</Label>
                  <Input
                    value={parsed.firstName || ''}
                    onChange={(event) => onUpdateOverride(rowIndex, 'firstName', event.target.value)}
                    placeholder="Prénom"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nom</Label>
                  <Input
                    value={parsed.lastName || ''}
                    onChange={(event) => onUpdateOverride(rowIndex, 'lastName', event.target.value)}
                    placeholder="Nom"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Téléphone</Label>
                  <Input
                    value={parsed.phone || ''}
                    onChange={(event) => onUpdateOverride(rowIndex, 'phone', event.target.value)}
                    placeholder="Téléphone"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    value={parsed.email || ''}
                    onChange={(event) => onUpdateOverride(rowIndex, 'email', event.target.value)}
                    placeholder="Email"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">CNI</Label>
                  <Input
                    value={parsed.cni || ''}
                    onChange={(event) => onUpdateOverride(rowIndex, 'cni', event.target.value)}
                    placeholder="CNI"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {remaining > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setExpanded((prev) => !prev)}
            className="w-full sm:w-auto"
          >
            {expanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {expanded ? 'Afficher moins' : `Afficher ${remaining} ligne(s) de plus`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
