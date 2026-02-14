import { Eye, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ArchiveClient } from '../types'

type ArchiveTableSectionProps = {
  clients: ArchiveClient[]
  onViewClient: (id: string) => void
  onRestoreClient: (id: string) => void
  formatDate: (date: string) => string
}

export function ArchiveTableSection({ clients, onViewClient, onRestoreClient, formatDate }: ArchiveTableSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4" />
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>CNI</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Archivé</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{client.lastName}</TableCell>
                    <TableCell>{client.firstName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{client.phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{client.cni}</TableCell>
                    <TableCell>
                      {client.status === 'archived' ? (
                        <Badge variant="outline" className="bg-gray-100">
                          Archivé
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-600">
                          Blacklist
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{client.rentals.length}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(client.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => onViewClient(client.id)} title="Voir le dossier">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Restaurer" onClick={() => onRestoreClient(client.id)}>
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Aucun client archivé ou blacklisté
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {clients.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Affichage de {clients.length} client{clients.length > 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
