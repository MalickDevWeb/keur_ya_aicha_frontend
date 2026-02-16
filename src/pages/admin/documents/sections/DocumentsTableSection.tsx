import { Download, Edit, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { DocumentGroup, DocumentRow } from '../types'

type DocumentsTableSectionProps = {
  group: DocumentGroup
  onDownload: (doc: DocumentRow) => void
  onEdit: (doc: DocumentRow) => void
  onDelete: (doc: DocumentRow) => void
  formatDate: (value: string) => string
}

export function DocumentsTableSection({ group, onDownload, onEdit, onDelete, formatDate }: DocumentsTableSectionProps) {
  if (group.items.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{group.icon}</span> {group.label} ({group.items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:hidden">
          {group.items.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-[#121B53]/10 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0" />
                    <p className="truncate text-sm font-semibold text-[#121B53]">{doc.name}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{doc.clientName}</p>
                </div>
                {group.type === 'contract' ? (
                  doc.signed ? (
                    <Badge className="bg-green-600">✓</Badge>
                  ) : (
                    <Badge variant="secondary">Non</Badge>
                  )
                ) : null}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Propriété</p>
                  <p className="font-medium text-[#121B53]">{doc.rentalName || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date upload</p>
                  <p className="font-medium text-[#121B53]">{formatDate(doc.uploadedAt)}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => onDownload(doc)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(doc)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(doc)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Propriété</TableHead>
                <TableHead>Date Upload</TableHead>
                {group.type === 'contract' ? <TableHead>Signé</TableHead> : null}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.items.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <p className="max-w-xs truncate font-medium">{doc.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>{doc.clientName}</TableCell>
                  <TableCell>{doc.rentalName}</TableCell>
                  <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                  {group.type === 'contract' ? (
                    <TableCell>
                      {doc.signed ? <Badge className="bg-green-600">✓</Badge> : <Badge variant="secondary">Non</Badge>}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onEdit(doc)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(doc)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
