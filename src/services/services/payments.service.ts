import type { ClientUpdateDTO } from '@/dto/backend/requests'
import { fetchClients, updateClient } from '../api/clients.api'
import { createPaymentRecord } from '../api/payments.api'
import { generateId } from '../utils/ids'

export async function postPaymentRecord(rentalId: string, paymentId: string, amount: number) {
  const clients = await fetchClients()

  const client = clients.find(
    (c) => Array.isArray(c.rentals) && c.rentals.some((r) => r.id === rentalId)
  )
  if (!client) throw new Error('Client with rentalId not found')

  const rental = client.rentals.find((r) => r.id === rentalId)
  if (!rental) throw new Error('Rental not found on client')

  const payment = rental.payments.find((p) => p.id === paymentId)
  if (!payment) throw new Error('Monthly payment entry not found')

  const receipt = {
    id: generateId(),
    amount,
    date: new Date().toISOString(),
    receiptNumber: `REC-${Date.now()}`,
  }

  payment.paidAmount = (payment.paidAmount || 0) + amount
  payment.payments = payment.payments ?? []
  payment.payments.push(receipt)

  if (payment.paidAmount >= payment.amount) {
    payment.paidAmount = payment.amount
    payment.status = 'paid'
  } else if (payment.paidAmount > 0) {
    payment.status = 'partial'
  }

  const updatedClient = await updateClient(client.id, client as ClientUpdateDTO)

  try {
    await createPaymentRecord({
      rentalId,
      paymentId,
      amount,
      receiptId: receipt.id,
      date: receipt.date,
    })
  } catch {
    // ignore flat record errors
  }

  return { updatedClient, receipt }
}

export async function updateMonthlyPayment(rentalId: string, paymentId: string, amount: number) {
  const clients = await fetchClients()

  const client = clients.find(
    (c) => Array.isArray(c.rentals) && c.rentals.some((r) => r.id === rentalId)
  )
  if (!client) throw new Error('Client with rentalId not found')

  const rental = client.rentals.find((r) => r.id === rentalId)
  if (!rental) throw new Error('Rental not found on client')

  const payment = rental.payments.find((p) => p.id === paymentId)
  if (!payment) throw new Error('Monthly payment entry not found')

  const safeAmount = Math.max(0, Number(amount) || 0)
  payment.paidAmount = safeAmount
  payment.payments = [
    {
      id: generateId(),
      amount: safeAmount,
      date: new Date().toISOString(),
      receiptNumber: `CORR-${Date.now()}`,
      note: 'Correction',
    },
  ]

  if (safeAmount >= payment.amount) {
    payment.paidAmount = payment.amount
    payment.status = 'paid'
  } else if (safeAmount > 0) {
    payment.status = 'partial'
  } else {
    payment.status = 'unpaid'
  }

  return updateClient(client.id, client as ClientUpdateDTO)
}
