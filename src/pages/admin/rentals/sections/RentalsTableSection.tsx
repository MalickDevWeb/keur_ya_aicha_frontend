import { Edit, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, calculateDepositStatus } from '@/lib/types'
import { format } from 'date-fns'
import { useIsMobile } from '@/hooks/use-mobile'
import type { RentalRow } from '../types'
import { getPropertyTypeLabel } from '../utils'

type RentalsTableSectionProps = {
  rows: RentalRow[]
  onView: (clientId: string) => void
  onEdit: (rentalId: string) => void
}

export function RentalsTableSection({ rows, onView, onEdit }: RentalsTableSectionProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="space-y-3">
        {rows.map((rental) => {
          const depositStatus = calculateDepositStatus(rental.deposit)
          return (
            <Card key={rental.id} className="border border-border/60">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{rental.clientName}</p>
                    <p className="truncate text-sm text-muted-foreground">{rental.propertyName}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {getPropertyTypeLabel(rental.propertyType)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">Loyer:</span>{' '}
                    <span className="font-semibold">{formatCurrency(rental.monthlyRent)} FCFA</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Début:</span>{' '}
                    <span className="font-semibold">{format(new Date(rental.startDate), 'dd/MM/yyyy')}</span>
                  </p>
                  <p className="col-span-2">
                    <span className="text-muted-foreground">Caution:</span>{' '}
                    <span className={depositStatus === 'paid' ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                      {formatCurrency(rental.deposit.paid)} / {formatCurrency(rental.deposit.total)}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button variant="outline" onClick={() => onView(rental.clientId)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Détails
                  </Button>
                  <Button onClick={() => onEdit(rental.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Éditer
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Bien</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Loyer</TableHead>
            <TableHead>Début</TableHead>
            <TableHead>Caution</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((rental) => {
            const depositStatus = calculateDepositStatus(rental.deposit)
            return (
              <TableRow key={rental.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{rental.clientName}</TableCell>
                <TableCell className="text-sm">{rental.propertyName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {getPropertyTypeLabel(rental.propertyType)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(rental.monthlyRent)} FCFA</TableCell>
                <TableCell className="text-sm">{format(new Date(rental.startDate), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className={depositStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}>
                      {formatCurrency(rental.deposit.paid)} / {formatCurrency(rental.deposit.total)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => onView(rental.clientId)} title="Voir les détails">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(rental.id)} title="Éditer">
                      <Edit className="w-4 h-4" />
                    </Button>
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
