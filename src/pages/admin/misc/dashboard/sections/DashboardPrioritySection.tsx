import { AlertCircle, ArrowRight, Clock, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BadgeStatut } from '@/components/BadgeStatut'
import type { OverdueClient } from '../types'

const getLateBadge = (daysOverdue: number) =>
  daysOverdue > 0 ? (
    <Badge variant="destructive" className="gap-1">
      <Clock className="w-3 h-3" />
      {daysOverdue} jour(s)
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      À jour
    </Badge>
  )

type DashboardPrioritySectionProps = {
  items: OverdueClient[]
  amountFormatter: (value: number) => string
  periodFormatter: (value?: string) => string
  onPay: (item: OverdueClient) => void
  onViewClient: (clientId: string) => void
  onViewPayments: () => void
}

export function DashboardPrioritySection({
  items,
  amountFormatter,
  periodFormatter,
  onPay,
  onViewClient,
  onViewPayments,
}: DashboardPrioritySectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Paiements en attente
          </CardTitle>
          <p className="text-sm text-muted-foreground">{items.length} client(s) en priorité</p>
        </div>
        <Button variant="outline" size="sm" onClick={onViewPayments}>
          Voir tous les paiements
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Bien</TableHead>
                <TableHead>Période</TableHead>
                <TableHead className="text-right">Montant dû</TableHead>
                <TableHead>Délai</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.slice(0, 10).map((item, index) => (
                <TableRow key={`${item.client.id}-${item.rental.id}-${index}`} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {item.client.firstName} {item.client.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{item.client.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.rental.propertyName}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{periodFormatter(item.payment?.periodStart)}</TableCell>
                  <TableCell className="text-right font-medium">{amountFormatter(item.amountDue)}</TableCell>
                  <TableCell>{getLateBadge(item.daysOverdue)}</TableCell>
                  <TableCell>
                    <BadgeStatut status={item.paymentStatus} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPay(item)}
                        title="Enregistrer un paiement"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Payer
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onViewClient(item.client.id)}>
                        Voir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
