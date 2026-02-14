import { Archive, Edit, Eye } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BadgeStatut } from '@/components/BadgeStatut'
import type { ClientRow } from '../types'

type ClientsTableSectionProps = {
  rows: ClientRow[]
  onView: (clientId: string) => void
  onEdit: (clientId: string) => void
  onArchive: (clientId: string) => void
  t: (key: string) => string
}

export function ClientsTableSection({ rows, onView, onEdit, onArchive, t }: ClientsTableSectionProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('clients.name')}</TableHead>
            <TableHead>{t('clients.firstName')}</TableHead>
            <TableHead>{t('clients.phone')}</TableHead>
            <TableHead>{t('addClient.propertyType')}</TableHead>
            <TableHead className="text-center">{t('clients.rentals')}</TableHead>
            <TableHead>{t('clients.status')}</TableHead>
            <TableHead className="text-right">{t('clients.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ client, status, propertyTypes }) => {
            const propertyDisplay = propertyTypes.map((type) => t(`property.${type}`)).join(', ')
            return (
              <TableRow key={client.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{client.lastName}</TableCell>
                <TableCell>{client.firstName}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{propertyDisplay}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{client.rentals.length}</Badge>
                </TableCell>
                <TableCell>
                  <BadgeStatut status={status} size="sm" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(client.id)}
                      title={t('clients.details')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(client.id)}
                      title={t('clients.edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Archiver le client"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Archiver le client ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir archiver {client.firstName} {client.lastName} ? Cette action peut être annulée en réactivant le client depuis la section des clients archivés.
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
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
