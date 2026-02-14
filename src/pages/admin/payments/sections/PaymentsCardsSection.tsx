import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BadgeStatut } from '@/components/BadgeStatut'
import { Download, Edit, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { PaymentRow } from '../types'

type PaymentsCardsSectionProps = {
  rows: PaymentRow[]
  getClientName: (payment: PaymentRow) => string
  getPaymentDetails: (payment: PaymentRow) => { daysLate: number; isInDerogation: boolean; isLate: boolean }
  onView: (payment: PaymentRow) => void
  onEdit: (payment: PaymentRow) => void
  onOpenReceipt: (payment: PaymentRow) => void
}

export function PaymentsCardsSection({
  rows,
  getClientName,
  getPaymentDetails,
  onView,
  onEdit,
  onOpenReceipt,
}: PaymentsCardsSectionProps) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📋</div>
        <p className="text-foreground font-medium">Aucun paiement trouvé</p>
        <p className="text-muted-foreground text-sm mt-1">Ajoutez un nouveau paiement pour commencer</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((payment) => {
          const { daysLate, isInDerogation, isLate } = getPaymentDetails(payment)
          const isPaid = payment.status === 'paid'
          const isPartial = payment.status === 'partial'
          const clientName = getClientName(payment)

          return (
            <Card
              key={payment.id}
              className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer border-muted-foreground/20"
            >
              <div
                className={
                  `p-4 text-white relative overflow-hidden ${
                    isPaid
                      ? 'bg-gradient-to-br from-success to-success'
                      : isPartial
                        ? 'bg-gradient-to-br from-warning to-warning'
                        : 'bg-gradient-to-br from-destructive to-destructive'
                  }`
                }
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform" />
                <div className="relative z-10">
                  <h3 className="font-black text-lg text-white">{clientName}</h3>
                  <p className="text-white/90 text-sm">{payment.propertyName || 'Bien inconnu'}</p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Période</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded font-medium text-foreground">
                    {format(new Date(payment.periodStart), 'd MMM', { locale: fr })} →{' '}
                    {format(new Date(payment.periodEnd), 'd MMM yyyy', { locale: fr })}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-semibold">Montant</p>
                    <p className="text-sm font-black text-foreground">{(payment.amount / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-semibold">Payé</p>
                    <p className="text-sm font-black text-foreground">{(payment.paidAmount / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-semibold">Reste</p>
                    <p className="text-sm font-black text-foreground">
                      {((payment.amount - payment.paidAmount) / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    <BadgeStatut status={payment.status} size="sm" />
                    {isInDerogation && (
                      <Badge variant="outline" className="text-warning font-semibold">
                        -5j
                      </Badge>
                    )}
                    {isLate && !isInDerogation && (
                      <Badge variant="outline" className="text-destructive font-semibold">
                        +{daysLate}j
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button variant="ghost" size="sm" onClick={() => onView(payment)} className="flex-1 hover:bg-muted">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(payment)} className="flex-1 hover:bg-muted">
                    <Edit className="w-4 h-4 mr-2" />
                    Éditer
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onOpenReceipt(payment)} className="hover:bg-muted">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      <div className="mt-6 pt-4 border-t text-center text-sm font-medium text-muted-foreground">
        📊 Affichage de {rows.length} paiement{rows.length > 1 ? 's' : ''}
      </div>
    </div>
  )
}
