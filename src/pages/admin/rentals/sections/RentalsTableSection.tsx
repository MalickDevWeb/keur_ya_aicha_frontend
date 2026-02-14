import { Edit, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, calculateDepositStatus } from '@/lib/types'
import { format } from 'date-fns'
import type { RentalRow } from '../types'
import { getPropertyTypeLabel } from '../utils'

type RentalsTableSectionProps = {
  rows: RentalRow[]
  onView: (clientId: string) => void
  onEdit: (rentalId: string) => void
}

export function RentalsTableSection({ rows, onView, onEdit }: RentalsTableSectionProps) {
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
