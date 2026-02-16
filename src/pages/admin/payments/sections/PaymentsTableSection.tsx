import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BadgeStatut } from '@/components/BadgeStatut'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Edit, Eye, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useIsMobile } from '@/hooks/use-mobile'
import type { PaymentRow } from '../types'

type PaymentsTableSectionProps = {
  rows: PaymentRow[]
  getClientName: (payment: PaymentRow) => string
  getPaymentDetails: (payment: PaymentRow) => { daysLate: number; isInDerogation: boolean; isLate: boolean }
  onView: (payment: PaymentRow) => void
  onEdit: (payment: PaymentRow) => void
  onOpenReceipt: (payment: PaymentRow) => void
}

export function PaymentsTableSection({
  rows,
  getClientName,
  getPaymentDetails,
  onView,
  onEdit,
  onOpenReceipt,
}: PaymentsTableSectionProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    if (rows.length === 0) {
      return (
        <div>
          <div className="rounded-xl border border-border/60 bg-card p-10 text-center text-muted-foreground">
            <div className="mb-2 text-4xl">📋</div>
            <p className="font-medium">Aucun paiement trouvé</p>
            <p className="text-xs">Ajoutez un nouveau paiement pour commencer</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {rows.map((payment) => {
          const { daysLate, isInDerogation, isLate } = getPaymentDetails(payment)
          const isPaid = payment.status === 'paid'
          const isPartial = payment.status === 'partial'
          const clientName = getClientName(payment)
          const remaining = Math.max(0, payment.amount - payment.paidAmount)

          return (
            <Card key={payment.id} className="border border-border/60">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">{clientName}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {payment.propertyName || 'Bien inconnu'}
                    </p>
                  </div>
                  <BadgeStatut status={payment.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <p className="col-span-2">
                    <span className="text-muted-foreground">Période:</span>{' '}
                    <span className="font-semibold">
                      {format(new Date(payment.periodStart), 'd MMM', { locale: fr })} →{' '}
                      {format(new Date(payment.periodEnd), 'd MMM yyyy', { locale: fr })}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Montant:</span>{' '}
                    <span className="font-semibold">{(payment.amount / 1000).toFixed(0)}K</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Payé:</span>{' '}
                    <span
                      className={
                        isPaid
                          ? 'font-semibold text-success'
                          : isPartial
                            ? 'font-semibold text-warning'
                            : 'font-semibold text-destructive'
                      }
                    >
                      {(payment.paidAmount / 1000).toFixed(0)}K
                    </span>
                  </p>
                  <p className="col-span-2">
                    <span className="text-muted-foreground">Reste:</span>{' '}
                    <span className="font-semibold">{(remaining / 1000).toFixed(0)}K</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isInDerogation ? (
                    <Badge variant="outline" className="text-warning font-semibold">
                      -5j
                    </Badge>
                  ) : null}
                  {isLate && !isInDerogation ? (
                    <Badge variant="outline" className="text-destructive font-semibold">
                      +{daysLate}j
                    </Badge>
                  ) : null}
                  {payment.clientPhone ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {payment.clientPhone}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => onView(payment)}>
                    <Eye className="mr-1 h-4 w-4" />
                    Détails
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onEdit(payment)}>
                    <Edit className="mr-1 h-4 w-4" />
                    Éditer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onOpenReceipt(payment)}>
                    <Download className="mr-1 h-4 w-4" />
                    Reçu
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Client</TableHead>
              <TableHead className="font-bold">Bien</TableHead>
              <TableHead className="font-bold">Période</TableHead>
              <TableHead className="text-right font-bold">Montant</TableHead>
              <TableHead className="text-right font-bold">Payé</TableHead>
              <TableHead className="font-bold">Statut</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((payment) => {
                const { daysLate, isInDerogation, isLate } = getPaymentDetails(payment)
                const isPaid = payment.status === 'paid'
                const isPartial = payment.status === 'partial'
                const clientName = getClientName(payment)

                return (
                  <TableRow key={payment.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <TableCell className="font-semibold text-foreground">{clientName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-medium">
                      {payment.propertyName || 'Bien inconnu'}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="text-xs bg-muted px-2 py-1 rounded font-medium">
                        {format(new Date(payment.periodStart), 'd MMM', { locale: fr })} →{' '}
                        {format(new Date(payment.periodEnd), 'd MMM yyyy', { locale: fr })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {(payment.amount / 1000).toFixed(0)}K
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-bold text-sm ${
                          isPaid ? 'text-success' : isPartial ? 'text-warning' : 'text-destructive'
                        }`}
                      >
                        {(payment.paidAmount / 1000).toFixed(0)}K
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
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
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => onView(payment)} title="Voir les détails">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(payment)} title="Éditer le paiement">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onOpenReceipt(payment)} title="Télécharger reçu">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl">📋</div>
                    <p className="font-medium">Aucun paiement trouvé</p>
                    <p className="text-xs">Ajoutez un nouveau paiement pour commencer</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {rows.length > 0 && (
        <div className="px-6 py-3 border-t bg-muted/50 text-xs font-medium text-muted-foreground">
          📊 Affichage de {rows.length} paiement{rows.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
