import { Download, Eye, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
          <div className="overflow-x-auto">
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
                {rows.map((row) => (
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
                        <p className="text-xs text-muted-foreground">{row.name}</p>
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
