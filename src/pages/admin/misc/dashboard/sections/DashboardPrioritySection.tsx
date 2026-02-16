import { AlertCircle, ArrowRight, Clock, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BadgeStatut } from '@/components/BadgeStatut'
import { useIsMobile } from '@/hooks/use-mobile'
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
  const isMobile = useIsMobile()
  const visibleItems = items.slice(0, 10)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Paiements en attente
          </CardTitle>
          <p className="text-sm text-muted-foreground">{items.length} client(s) en priorité</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onViewPayments} className="w-full sm:w-auto">
          Voir tous les paiements
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardHeader>
      <CardContent className={isMobile ? 'p-3 space-y-3' : 'p-0'}>
        {isMobile ? (
          visibleItems.map((item, index) => (
            <Card key={`${item.client.id}-${item.rental.id}-${index}`} className="border border-border/70">
              <CardContent className="p-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {item.client.firstName} {item.client.lastName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{item.client.phone}</p>
                  </div>
                  <BadgeStatut status={item.paymentStatus} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="col-span-2">
                    <span className="text-muted-foreground">Bien:</span>{' '}
                    <Badge variant="outline">{item.rental.propertyName}</Badge>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Période:</span>{' '}
                    {periodFormatter(item.payment?.periodStart)}
                  </p>
                  <p className="text-right break-words">
                    <span className="text-muted-foreground">Montant:</span>{' '}
                    <span className="font-semibold">{amountFormatter(item.amountDue)}</span>
                  </p>
                </div>

                <div>{getLateBadge(item.daysOverdue)}</div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      onViewClient(item.client.id)
                    }}
                  >
                    Détails
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      onPay(item)
                    }}
                    title="Enregistrer un paiement"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Payer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
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
                {visibleItems.map((item, index) => (
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
                          type="button"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onPay(item)
                          }}
                          title="Enregistrer un paiement"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Payer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onViewClient(item.client.id)
                          }}
                        >
                          Détails
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
