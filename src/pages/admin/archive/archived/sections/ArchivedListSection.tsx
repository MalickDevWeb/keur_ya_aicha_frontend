import { Archive, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ArchiveClient } from '../../types'

type ArchivedListSectionProps = {
  clients: ArchiveClient[]
  formatDate: (value: string) => string
  onReactivate: (clientId: string) => void
  onView: (clientId: string) => void
}

export function ArchivedListSection({ clients, formatDate, onReactivate, onView }: ArchivedListSectionProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent pb-4">
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-slate-600" />
          Clients Archivés
        </CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Aucun client archivé</p>
              <p className="text-sm mt-2">Les clients archivés apparaîtront ici</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {clients.map((client) => (
                <div key={client.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{client.phone}</p>
                      <p className="mt-1 text-sm text-slate-600 font-mono break-all">{client.cni || '—'}</p>
                    </div>
                    <Badge variant="secondary" className="bg-slate-700 text-white shrink-0">
                      <Archive className="h-3 w-3 mr-1" />
                      Archivé
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Badge variant="outline" className="bg-slate-50">
                      {client.rentals.length} propriété(s)
                    </Badge>
                    <p className="text-xs text-slate-600">{formatDate(client.createdAt)}</p>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => onReactivate(client.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Réactiver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(client.id)}
                    >
                      Détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-transparent">
                    <TableHead>Nom Complet</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>CNI</TableHead>
                    <TableHead className="text-center">Propriétés</TableHead>
                    <TableHead>Date d'Archivage</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <p className="font-medium text-slate-900">
                          {client.firstName} {client.lastName}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600">{client.phone}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600 font-mono">{client.cni}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-slate-50">
                          {client.rentals.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600">{formatDate(client.createdAt)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-700 text-white">
                          <Archive className="h-3 w-3 mr-1" />
                          Archivé
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 hover:bg-green-50 hover:text-green-700"
                            onClick={() => onReactivate(client.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Réactiver
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(client.id)}
                            className="hover:bg-blue-50 hover:text-blue-700"
                          >
                            Détails
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
