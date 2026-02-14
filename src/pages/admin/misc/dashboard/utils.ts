import { calculatePaymentStatus, formatCurrency, type Client, type PaymentStatus } from '@/lib/types'
import type { OverdueClient } from './types'

const PAYMENT_PRIORITY: Record<PaymentStatus, number> = {
  late: 0,
  unpaid: 1,
  partial: 2,
  paid: 3,
}

export const buildPriorityClients = (clients: Client[]): OverdueClient[] => {
  const overdueList: OverdueClient[] = []

  for (const client of clients) {
    if (client.status !== 'active') continue

    for (const rental of client.rentals) {
      for (const payment of rental.payments) {
        const status = calculatePaymentStatus(payment)
        if (status === 'paid') continue

        const amountDue = Math.max(0, payment.amount - payment.paidAmount)
        if (amountDue <= 0) continue

        const dueDate = payment.dueDate ? new Date(payment.dueDate) : null
        const today = new Date()
        const daysOverdue =
          dueDate && !Number.isNaN(dueDate.getTime())
            ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0

        overdueList.push({
          client,
          rental,
          payment,
          paymentStatus: status,
          amountDue,
          daysOverdue: Math.max(0, daysOverdue),
        })
      }
    }
  }

  return overdueList.sort((a, b) => {
    const prioDiff = PAYMENT_PRIORITY[a.paymentStatus] - PAYMENT_PRIORITY[b.paymentStatus]
    if (prioDiff !== 0) return prioDiff
    if (a.paymentStatus === 'late' && b.paymentStatus === 'late') {
      return b.daysOverdue - a.daysOverdue
    }
    return b.amountDue - a.amountDue
  })
}

export const formatAmount = (value: number) => `${formatCurrency(value)} FCFA`

export const formatPaymentPeriod = (dateValue?: string) => {
  const date = dateValue ? new Date(dateValue) : new Date()
  return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}
