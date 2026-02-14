import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BadgeStatut } from '@/components/BadgeStatut'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Edit, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
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
