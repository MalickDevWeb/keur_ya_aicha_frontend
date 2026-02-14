import type { Client, DashboardStats } from '@/lib/types'

export function calculateDashboardStats(clients: Client[]): DashboardStats {
  let totalRentals = 0
  let paidRentals = 0
  let unpaidRentals = 0
  let partialRentals = 0
  let monthlyIncome = 0

  clients.forEach((client) => {
    if (client.status === 'archived' || client.status === 'blacklisted') return
    client.rentals.forEach((rental) => {
      totalRentals++
      rental.payments.forEach((payment) => {
        if (payment.status === 'paid') {
          paidRentals++
          monthlyIncome += payment.paidAmount
        } else if (payment.status === 'partial') {
          partialRentals++
          monthlyIncome += payment.paidAmount
        } else {
          unpaidRentals++
        }
      })
    })
  })

  return {
    totalClients: clients.filter((c) => c.status === 'active').length,
    totalRentals,
    paidRentals,
    unpaidRentals,
    partialRentals,
    monthlyIncome,
  }
}
