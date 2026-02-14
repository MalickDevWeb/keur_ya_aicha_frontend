import type { Client, Rental, PaymentStatus, MonthlyPayment } from '@/lib/types'

export type OverdueClient = {
  client: Client
  rental: Rental
  payment: MonthlyPayment
  paymentStatus: PaymentStatus
  amountDue: number
  daysOverdue: number
}
