import type { ClientDTO } from '@/dto/backend/responses'
import type { PaymentDistributionEntry, PaymentStats } from './types'

export const buildPaymentStats = (clients: ClientDTO[]): PaymentStats => {
  const stats: PaymentStats = { paid: 0, unpaid: 0, partial: 0 }

  for (const client of clients) {
    if (client.status === 'archived' || client.status === 'blacklisted') continue
    for (const rental of client.rentals ?? []) {
      for (const payment of rental.payments ?? []) {
        if (payment.status === 'paid') stats.paid += 1
        else if (payment.status === 'partial') stats.partial += 1
        else stats.unpaid += 1
      }
    }
  }

  return stats
}

export const buildPaymentDistribution = (stats: PaymentStats): PaymentDistributionEntry[] => [
  { name: 'Payées', value: stats.paid },
  { name: 'Non payées', value: stats.unpaid },
  { name: 'Partielles', value: stats.partial },
]
