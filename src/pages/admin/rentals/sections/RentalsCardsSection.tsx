import { Edit, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BadgeStatut } from '@/components/BadgeStatut'
import { cn } from '@/lib/utils'
import { formatCurrency, calculateDepositStatus } from '@/lib/types'
import { format } from 'date-fns'
import type { RentalRow } from '../types'
import { getPropertyTypeLabel, getPropertyTypeColor } from '../utils'

type RentalsCardsSectionProps = {
  rows: RentalRow[]
  onView: (clientId: string) => void
  onEdit: (rentalId: string) => void
}

export function RentalsCardsSection({ rows, onView, onEdit }: RentalsCardsSectionProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((rental) => {
        const depositStatus = calculateDepositStatus(rental.deposit)
        const depositProgress = (rental.deposit.paid / rental.deposit.total) * 100

        return (
          <Card
            key={rental.id}
            className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-0"
            onClick={() => onView(rental.clientId)}
          >
            <div
              className={cn(
                'bg-gradient-to-br p-6 text-white relative overflow-hidden',
                rental.propertyType === 'villa'
                  ? 'from-emerald-900 to-emerald-800'
                  : rental.propertyType === 'apartment'
                    ? 'from-blue-900 to-blue-800'
                    : rental.propertyType === 'studio'
                      ? 'from-purple-900 to-purple-800'
                      : 'from-slate-900 to-slate-800'
              )}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform" />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <Badge className={`${getPropertyTypeColor(rental.propertyType)} mb-3`}>
                      {getPropertyTypeLabel(rental.propertyType)}
                    </Badge>
                    <h3 className="font-black text-2xl text-white">{rental.propertyName}</h3>
                    <p className="text-slate-200 font-semibold mt-1">{rental.clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-white">{formatCurrency(rental.monthlyRent)}</p>
                    <p className="text-xs text-slate-300">/mois</p>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 uppercase tracking-wider font-bold mb-1">Début</p>
                  <p className="font-semibold text-sm text-slate-900">
                    {format(new Date(rental.startDate), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 uppercase tracking-wider font-bold mb-1">ID</p>
                  <p className="font-mono text-xs font-semibold text-slate-900 break-all">{rental.id}</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-amber-700 uppercase tracking-wider font-bold">Caution</p>
                  <span className="text-sm font-bold text-amber-900">
                    {formatCurrency(rental.deposit.paid)} / {formatCurrency(rental.deposit.total)}
                  </span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-3 overflow-hidden mb-3">
                  <div
                    className={cn(
                      'h-full transition-all rounded-full font-bold flex items-center justify-center text-xs text-white',
                      depositProgress === 100
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : depositProgress > 0
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                          : 'bg-gradient-to-r from-red-500 to-rose-500'
                    )}
                    style={{ width: `${depositProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <BadgeStatut status={depositStatus} size="sm" />
                  <p className="text-sm font-black text-amber-900">{Math.round(depositProgress)}%</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <Button
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={(event) => {
                    event.stopPropagation()
                    onView(rental.clientId)
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
                    onEdit(rental.id)
                  }}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
