import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BadgeStatut } from '@/components/BadgeStatut'
import { Download, Edit, Eye, MessageCircle, Phone } from 'lucide-react'
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
        {rows.map((payment, index) => {
          const { daysLate, isInDerogation, isLate } = getPaymentDetails(payment)
          const isPaid = payment.status === 'paid'
          const isPartial = payment.status === 'partial'
          const clientName = getClientName(payment)
          const remaining = Math.max(0, payment.amount - payment.paidAmount)

          return (
            <Card
              key={payment.id}
              style={{ animationDelay: `${index * 60}ms` }}
              className="group overflow-hidden border-[#121B53]/18 bg-white shadow-[0_12px_30px_rgba(12,18,60,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(12,18,60,0.2)] animate-fade-in"
            >
              <div
                className={
                  `p-4 text-white relative overflow-hidden ${
                    isPaid
                      ? 'bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-700'
                      : isPartial
                        ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500'
                        : 'bg-gradient-to-br from-rose-500 via-rose-500 to-red-600'
                  }`
                }
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/15 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                <div className="absolute -left-8 -bottom-10 w-20 h-20 bg-black/5 rounded-full group-hover:scale-125 transition-transform duration-500" />
                <div className="relative z-10">
                  <h3 className="font-black text-4xl leading-none tracking-tight text-white truncate">{clientName}</h3>
                  <p className="mt-1 text-white/90 text-lg truncate">{payment.propertyName || 'Bien inconnu'}</p>
                </div>
              </div>

              <div className="p-4 space-y-3 bg-gradient-to-b from-white to-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#405A9A] uppercase tracking-[0.16em]">Période</span>
                  <span className="text-xs bg-[#ECF3FF] border border-[#D7E4FF] px-3 py-1 rounded-md font-semibold text-[#121B53]">
                    {format(new Date(payment.periodStart), 'd MMM', { locale: fr })} →{' '}
                    {format(new Date(payment.periodEnd), 'd MMM yyyy', { locale: fr })}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-[#D8E4F5] bg-[#F2F7FD] p-3">
                    <p className="text-xs text-[#526FA8] font-semibold">Montant</p>
                    <p className="text-2xl leading-none mt-1 font-black text-[#121B53]">{(payment.amount / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="rounded-lg border border-[#D8E4F5] bg-[#F2F7FD] p-3">
                    <p className="text-xs text-[#526FA8] font-semibold">Payé</p>
                    <p className="text-2xl leading-none mt-1 font-black text-[#121B53]">{(payment.paidAmount / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="rounded-lg border border-[#D8E4F5] bg-[#F2F7FD] p-3">
                    <p className="text-xs text-[#526FA8] font-semibold">Reste</p>
                    <p className="text-2xl leading-none mt-1 font-black text-[#121B53]">
                      {(remaining / 1000).toFixed(0)}K
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
                  {payment.clientPhone ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EDF3FF] px-2 py-1 text-[11px] font-medium text-[#355091]">
                      <Phone className="h-3 w-3" />
                      {payment.clientPhone}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#D7E2F3]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(payment)}
                    className="border-[#CEDBF2] bg-white hover:bg-[#EEF4FF] font-semibold"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir plus
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(payment)}
                    className="border-[#CEDBF2] bg-white hover:bg-[#EEF4FF] font-semibold"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Éditer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenReceipt(payment)}
                    className="border-[#CEDBF2] bg-white hover:bg-[#EEF4FF] font-semibold"
                    title="Télécharger et envoyer sur WhatsApp"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    <MessageCircle className="w-4 h-4" />
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
