import { AlertTriangle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import type { ArchiveClient } from '../../types'

type BlacklistedSearchSectionProps = {
  searchQuery: string
  results: ArchiveClient[]
  onSearchChange: (value: string) => void
  onClear: () => void
  onBlacklist: (clientId: string) => void
}

export function BlacklistedSearchSection({ searchQuery, results, onSearchChange, onClear, onBlacklist }: BlacklistedSearchSectionProps) {
  return (
    <Card className="border-destructive/30 bg-gradient-to-br from-red-50/50 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Ajouter à la Liste Noire
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-400" />
              <Input
                placeholder="Rechercher par nom, prénom, téléphone ou CNI..."
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-10 border-red-200 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            {searchQuery && (
              <Button variant="outline" onClick={onClear} className="border-red-200 hover:bg-red-50">
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
                      <TableRow className="bg-gradient-to-r from-red-50 to-transparent">
                        <TableHead>Nom Complet</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>CNI</TableHead>
                        <TableHead className="text-center">Propriétés</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((client) => (
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
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                  Blacklister
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogTitle>Ajouter à la Liste Noire ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir ajouter{' '}
                                  <span className="font-semibold text-slate-900">
                                    {client.firstName} {client.lastName}
                                  </span>{' '}
                                  à la liste noire ? Ce client ne pourra plus louer de propriétés.
                                </AlertDialogDescription>
                                <div className="flex justify-end gap-2">
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onBlacklist(client.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Ajouter à la Liste Noire
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
            <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border border-dashed border-red-200">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tapez le nom, prénom, téléphone ou CNI du client à blacklister</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
