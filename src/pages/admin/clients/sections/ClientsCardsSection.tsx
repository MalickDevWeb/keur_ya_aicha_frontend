import { Archive, Edit, Eye } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BadgeStatut } from '@/components/BadgeStatut'
import type { ClientRow } from '../types'

type ClientsCardsSectionProps = {
  rows: ClientRow[]
  onView: (clientId: string) => void
  onEdit: (clientId: string) => void
  onArchive: (clientId: string) => void
  t: (key: string) => string
}

export function ClientsCardsSection({ rows, onView, onEdit, onArchive, t }: ClientsCardsSectionProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
      {rows.map(({ client, status, propertyTypes }) => {
        const propertyDisplay = propertyTypes.map((type) => t(`property.${type}`))
        return (
          <Card
            key={client.id}
            className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-0"
            onClick={() => onView(client.id)}
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform" />
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="font-black text-2xl text-white">{client.firstName}</h3>
                    <p className="text-slate-300 font-semibold">{client.lastName}</p>
                  </div>
                  <BadgeStatut status={status} size="sm" />
                </div>
                <p className="text-sm text-slate-300">{client.phone}</p>
              </div>
            </div>

            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 uppercase tracking-wider font-bold mb-1">CNI</p>
                  <p className="font-mono text-sm font-semibold text-slate-900">{client.cni}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-600 uppercase tracking-wider font-bold mb-1">Locations</p>
                  <p className="text-2xl font-black text-purple-600">{client.rentals.length}</p>
                </div>
              </div>

              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <p className="text-xs text-emerald-600 uppercase tracking-wider font-bold mb-2">Types de bien</p>
                <div className="flex flex-wrap gap-2">
                  {propertyDisplay.length > 0 ? (
                    propertyDisplay.map((type) => (
                      <Badge key={type} className="bg-emerald-600 hover:bg-emerald-700">
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-600">Aucun bien</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <Button
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={(event) => {
                    event.stopPropagation()
                    onView(client.id)
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Voir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(event) => {
                    event.stopPropagation()
                    onEdit(client.id)
                  }}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Modifier
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(event) => event.stopPropagation()}
                      title="Archiver le client"
                    >
                      <Archive className="w-3 h-3" />
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
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
