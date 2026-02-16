import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import type { ArchiveClient } from '../../types'

type BlacklistedListSectionProps = {
  clients: ArchiveClient[]
  formatDate: (value: string) => string
  onRemove: (clientId: string) => void
  onView: (clientId: string) => void
}

type RemoveBlacklistDialogProps = {
  client: ArchiveClient
  onRemove: (clientId: string) => void
  fullWidth?: boolean
}

function RemoveBlacklistDialog({ client, onRemove, fullWidth = false }: RemoveBlacklistDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 hover:bg-green-50 hover:text-green-700 ${fullWidth ? 'w-full justify-center' : ''}`}
        >
          <RotateCcw className="h-4 w-4" />
          Retirer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Retirer de la Liste Noire ?</AlertDialogTitle>
        <AlertDialogDescription>
          Êtes-vous sûr de vouloir retirer{' '}
          <span className="font-semibold text-slate-900">
            {client.firstName} {client.lastName}
          </span>{' '}
          de la liste noire ? Ce client pourra à nouveau louer des propriétés.
        </AlertDialogDescription>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onRemove(client.id)}
            className="bg-green-600 hover:bg-green-700"
          >
            Retirer de la Liste Noire
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function BlacklistedListSection({ clients, formatDate, onRemove, onView }: BlacklistedListSectionProps) {
  return (
    <Card className="border-red-200">
      <CardHeader className="bg-gradient-to-r from-red-50 to-transparent pb-4">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Clients Blacklistés
        </CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Aucun client blacklisté</p>
              <p className="text-sm mt-2">Les clients blacklistés apparaîtront ici</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {clients.map((client) => (
                <div key={client.id} className="rounded-lg border border-red-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{client.phone}</p>
                      <p className="mt-1 text-sm text-slate-600 font-mono break-all">{client.cni || '—'}</p>
                    </div>
                    <Badge variant="destructive" className="bg-red-600 shrink-0">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Blacklisté
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Badge variant="outline" className="bg-red-50">
                      {client.rentals.length} propriété(s)
                    </Badge>
                    <p className="text-xs text-slate-600">{formatDate(client.createdAt)}</p>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <RemoveBlacklistDialog client={client} onRemove={onRemove} fullWidth />
                    <Button variant="outline" size="sm" onClick={() => onView(client.id)}>
                      Détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-red-50 to-transparent">
                    <TableHead>Nom Complet</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>CNI</TableHead>
                    <TableHead className="text-center">Propriétés</TableHead>
                    <TableHead>Date d'Ajout</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-red-50/30">
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
                        <Badge variant="outline" className="bg-red-50">
                          {client.rentals.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600">{formatDate(client.createdAt)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="bg-red-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Blacklisté
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <RemoveBlacklistDialog client={client} onRemove={onRemove} />
                          <Button variant="ghost" size="sm" onClick={() => onView(client.id)} className="hover:bg-blue-50 hover:text-blue-700">
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
