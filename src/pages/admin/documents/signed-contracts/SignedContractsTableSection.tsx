import { Download, Eye, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { buildReadableDocumentName } from '@/lib/documentDisplay'
import type { SignedContractRow } from './utils'

type SignedContractsTableSectionProps = {
  rows: SignedContractRow[]
  formatDate: (value: string) => string
  formatCurrency: (value?: number) => string
  onOpenDownload: (row: SignedContractRow) => void
  onPreview: (row: SignedContractRow) => void
  onDelete: (row: SignedContractRow) => void
}

export function SignedContractsTableSection({
  rows,
  formatDate,
  formatCurrency,
  onOpenDownload,
  onPreview,
  onDelete,
}: SignedContractsTableSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des contrats signés</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">Aucun contrat signé trouvé</div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {rows.map((row) => {
                const displayName = buildReadableDocumentName({
                  name: row.name,
                  type: 'contract',
                  context: row.rentalName || row.clientName,
                  uploadedAt: row.uploadedAt,
                })

                return (
                  <div key={row.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{row.clientName}</p>
                        <p className="text-xs text-muted-foreground">{row.clientPhone}</p>
                      </div>
                      <Badge className="bg-green-600">✓ Signé</Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Propriété:</span> {row.rentalName}</p>
                      <p><span className="text-muted-foreground">Document:</span> {displayName}</p>
                      <p><span className="text-muted-foreground">Loyer:</span> {formatCurrency(row.rentalRent)} XOF</p>
                      <p><span className="text-muted-foreground">Date signature:</span> {formatDate(row.uploadedAt)}</p>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onOpenDownload(row)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onPreview(row)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(row)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Propriété</TableHead>
                  <TableHead>Loyer</TableHead>
                  <TableHead>Date signature</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const displayName = buildReadableDocumentName({
                    name: row.name,
                    type: 'contract',
                    context: row.rentalName || row.clientName,
                    uploadedAt: row.uploadedAt,
                  })

                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.clientName}</p>
                          <p className="text-xs text-muted-foreground">{row.clientPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.rentalName}</p>
                          <p className="text-xs text-muted-foreground">{displayName}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(row.rentalRent)} XOF</TableCell>
                      <TableCell>{formatDate(row.uploadedAt)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-600">✓ Signé</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => onOpenDownload(row)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onPreview(row)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(row)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
