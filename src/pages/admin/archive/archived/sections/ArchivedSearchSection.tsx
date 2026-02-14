import { Archive, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import type { ArchiveClient } from '../../types'

type ArchivedSearchSectionProps = {
  searchQuery: string
  results: ArchiveClient[]
  onSearchChange: (value: string) => void
  onClear: () => void
  onArchive: (clientId: string) => void
}

export function ArchivedSearchSection({ searchQuery, results, onSearchChange, onClear, onArchive }: ArchivedSearchSectionProps) {
  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-blue-600" />
          Archiver un Client
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input
                placeholder="Rechercher par nom, prénom, téléphone ou CNI..."
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {searchQuery && (
              <Button variant="outline" onClick={onClear} className="border-blue-200 hover:bg-blue-50">
                Effacer
              </Button>
            )}
          </div>

          {searchQuery && (
            <div className="space-y-2">
              {results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border border-dashed">
                  <p className="text-sm">Aucun client trouvé</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-50 to-transparent">
                        <TableHead>Nom Complet</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>CNI</TableHead>
                        <TableHead className="text-center">Propriétés</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((client) => (
                        <TableRow key={client.id} className="hover:bg-blue-50/30">
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
                            <Badge variant="outline" className="bg-blue-50">
                              {client.rentals.length}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                                >
                                  <Archive className="h-4 w-4" />
                                  Archiver
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogTitle>Archiver le client ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir archiver{' '}
                                  <span className="font-semibold text-slate-900">
                                    {client.firstName} {client.lastName}
                                  </span>
                                  ? Cette action peut être annulée en réactivant le client.
                                </AlertDialogDescription>
                                <div className="flex justify-end gap-2">
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onArchive(client.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Archiver
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {!searchQuery && (
            <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border border-dashed border-blue-200">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tapez le nom, prénom, téléphone ou CNI du client à archiver</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
