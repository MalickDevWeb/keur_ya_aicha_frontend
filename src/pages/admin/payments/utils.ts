import type { ClientDTO } from '@/dto/backend/responses'
import type { PaymentFilters, PaymentRow, PaymentStats, ReceiptDocument } from './types'

export const buildPaymentRows = (clients: ClientDTO[]): PaymentRow[] => {
  const rows: PaymentRow[] = []

  clients.forEach((client) => {
    const clientName = `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim()
    if (!clientName) return

    client.rentals.forEach((rental) => {
      if (!rental.propertyName) return

      rental.payments.forEach((payment) => {
        if (!payment.id || !payment.amount) return

        rows.push({
          ...payment,
          clientName,
          clientId: client.id,
          clientPhone: client.phone || '',
          rentalId: rental.id,
          propertyName: rental.propertyName,
          propertyType: rental.propertyType,
          monthlyRent: rental.monthlyRent,
        })
      })
    })
  })

  return rows
    .filter((row) => row.clientName && row.propertyName && row.clientId)
    .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime())
}

export const filterPaymentRows = (rows: PaymentRow[], filters: PaymentFilters) => {
  const needle = filters.search.trim().toLowerCase()

  return rows.filter((payment) => {
    const matchesSearch =
      !needle ||
      payment.clientName.toLowerCase().includes(needle) ||
      payment.propertyName.toLowerCase().includes(needle) ||
      String(payment.clientPhone || '').toLowerCase().includes(needle)

    const matchesStatus = filters.statusFilter === 'all' || payment.status === filters.statusFilter

    return matchesSearch && matchesStatus
  })
}

export const buildPaymentStats = (rows: PaymentRow[]): PaymentStats => {
  const total = rows.length
  const paid = rows.filter((p) => p.status === 'paid').length
  const partial = rows.filter((p) => p.status === 'partial').length
  const unpaid = rows.filter((p) => p.status === 'unpaid' || p.status === 'late').length
  const totalAmount = rows.reduce((sum, p) => sum + p.amount, 0)
  const paidAmount = rows.reduce((sum, p) => sum + p.paidAmount, 0)
  const remainingAmount = totalAmount - paidAmount

  return { total, paid, partial, unpaid, totalAmount, paidAmount, remainingAmount }
}

export const getPaymentDetails = (payment: PaymentRow) => {
  const daysLate = Math.max(
    0,
    Math.floor((Date.now() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
  )
  const isInDerogation = daysLate <= 5 && daysLate > 0
  const isLate = payment.status === 'late' || daysLate > 0

  return { daysLate, isInDerogation, isLate }
}

export const buildReceiptDocument = (
  payment: PaymentRow,
  client?: ClientDTO,
  recordIndex?: number
): ReceiptDocument => {
  const record = payment.payments?.length
    ? payment.payments[recordIndex ?? payment.payments.length - 1]
    : null

  return {
    payerName: client ? `${client.firstName} ${client.lastName}` : payment.clientName,
    payerPhone: client?.phone,
    clientPhone: client?.phone,
    amount: record ? record.amount : payment.paidAmount || payment.amount,
    uploadedAt: record ? record.date : new Date(),
    name: `Reçu-${payment.id}`,
    note: payment.propertyName || '',
  }
}
