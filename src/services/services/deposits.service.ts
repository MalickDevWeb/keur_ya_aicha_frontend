import type { ClientUpdateDTO } from '@/dto/backend/requests'
import { fetchClients, updateClient } from '../api/clients.api'
import { createDepositRecord } from '../api/deposits.api'
import { generateId } from '../utils/ids'

export async function postDepositPayment(rentalId: string, amount: number) {
  const clients = await fetchClients()

  const client = clients.find(
    (c) => Array.isArray(c.rentals) && c.rentals.some((r) => r.id === rentalId)
  )
  if (!client) throw new Error('Client with rentalId not found')

  const rental = client.rentals.find((r) => r.id === rentalId)
  if (!rental) throw new Error('Rental not found on client')

  if (!rental.deposit) throw new Error('Deposit not found on rental')

  const receipt = {
    id: generateId(),
    amount,
    date: new Date().toISOString(),
    receiptNumber: `DEP-${Date.now()}`,
  }

  rental.deposit.paid = (rental.deposit.paid || 0) + amount
  rental.deposit.payments = rental.deposit.payments ?? []
  rental.deposit.payments.push(receipt)

  if (rental.deposit.paid >= rental.deposit.total) {
    rental.deposit.paid = rental.deposit.total
  }

  const updatedClient = await updateClient(client.id, client as ClientUpdateDTO)

  try {
    await createDepositRecord({
      rentalId,
      amount,
      receiptId: receipt.id,
      date: receipt.date,
    })
  } catch {
    // ignore flat record errors
  }

  return { updatedClient, receipt }
}
