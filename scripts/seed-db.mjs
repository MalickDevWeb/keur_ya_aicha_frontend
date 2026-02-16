#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Helper functions
const generateId = () => Math.random().toString(36).substring(2, 15)

function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function subMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return d
}

function format(date, fmt) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (fmt === 'yyyyMM') return `${year}${month}`
  return `${year}-${month}-${day}`
}

// Generate monthly payments
function generateMonthlyPayments(rental, monthsCount = 6) {
  const payments = []
  const startDate = rental.startDate || new Date()

  for (let i = 0; i < monthsCount; i++) {
    const periodStart = addMonths(new Date(startDate), i)
    const periodEnd = addDays(addMonths(new Date(periodStart), 1), -1)
    const dueDate = addDays(new Date(periodEnd), 5)

    let paidAmount = 0
    const monthlyRent = rental.monthlyRent || 75000

    if (i < monthsCount - 2) {
      paidAmount = monthlyRent
    } else if (i === monthsCount - 2) {
      paidAmount = Math.random() > 0.3 ? monthlyRent : Math.floor(monthlyRent * 0.6)
    }

    const payment = {
      id: generateId(),
      rentalId: rental.id || '',
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      dueDate: dueDate.toISOString(),
      amount: monthlyRent,
      paidAmount,
      status: paidAmount >= monthlyRent ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      payments:
        paidAmount > 0
          ? [
              {
                id: generateId(),
                amount: paidAmount,
                date: addDays(new Date(periodStart), Math.floor(Math.random() * 15)).toISOString(),
                receiptNumber: `REC-${format(periodStart, 'yyyyMM')}-${generateId().substring(0, 6).toUpperCase()}`,
              },
            ]
          : [],
    }

    payments.push(payment)
  }

  return payments
}

// Mock clients data
const mockClients = [
  {
    id: 'client-1',
    firstName: 'Amadou',
    lastName: 'Diallo',
    phone: '+221 77 123 45 67',
    cni: '1234567890123',
    status: 'active',
    createdAt: subMonths(new Date(), 8).toISOString(),
    rentals: [],
  },
  {
    id: 'client-2',
    firstName: 'Fatou',
    lastName: 'Sow',
    phone: '+221 78 234 56 78',
    cni: '2345678901234',
    status: 'active',
    createdAt: subMonths(new Date(), 6).toISOString(),
    rentals: [],
  },
  {
    id: 'client-3',
    firstName: 'Moussa',
    lastName: 'Ndiaye',
    phone: '+221 76 345 67 89',
    cni: '3456789012345',
    status: 'active',
    createdAt: subMonths(new Date(), 4).toISOString(),
    rentals: [],
  },
  {
    id: 'client-4',
    firstName: 'Aissatou',
    lastName: 'Ba',
    phone: '+221 70 456 78 90',
    cni: '4567890123456',
    status: 'active',
    createdAt: subMonths(new Date(), 3).toISOString(),
    rentals: [],
  },
  {
    id: 'client-5',
    firstName: 'Ibrahima',
    lastName: 'Fall',
    phone: '+221 77 567 89 01',
    cni: '5678901234567',
    status: 'archived',
    createdAt: subMonths(new Date(), 12).toISOString(),
    rentals: [],
  },
  {
    id: 'client-6',
    firstName: 'Mariama',
    lastName: 'Diop',
    phone: '+221 78 678 90 12',
    cni: '6789012345678',
    status: 'active',
    createdAt: subMonths(new Date(), 2).toISOString(),
    rentals: [],
  },
  {
    id: 'client-7',
    firstName: 'Ousmane',
    lastName: 'Sarr',
    phone: '+221 76 789 01 23',
    cni: '7890123456789',
    status: 'blacklisted',
    createdAt: subMonths(new Date(), 10).toISOString(),
    rentals: [],
  },
]

// Rental data
const rentalsData = [
  {
    clientId: 'client-1',
    rentals: [
      {
        propertyType: 'apartment',
        propertyName: 'Appartement A1',
        monthlyRent: 150000,
        startDate: subMonths(new Date(), 8),
      },
      {
        propertyType: 'studio',
        propertyName: 'Studio B2',
        monthlyRent: 75000,
        startDate: subMonths(new Date(), 3),
      },
    ],
  },
  {
    clientId: 'client-2',
    rentals: [
      {
        propertyType: 'villa',
        propertyName: 'Villa Palmier',
        monthlyRent: 300000,
        startDate: subMonths(new Date(), 6),
      },
    ],
  },
  {
    clientId: 'client-3',
    rentals: [
      {
        propertyType: 'room',
        propertyName: 'Chambre C1',
        monthlyRent: 50000,
        startDate: subMonths(new Date(), 4),
      },
    ],
  },
  {
    clientId: 'client-4',
    rentals: [
      {
        propertyType: 'studio',
        propertyName: 'Studio A3',
        monthlyRent: 80000,
        startDate: subMonths(new Date(), 3),
      },
    ],
  },
  {
    clientId: 'client-5',
    rentals: [
      {
        propertyType: 'apartment',
        propertyName: 'Appartement B1',
        monthlyRent: 120000,
        startDate: subMonths(new Date(), 12),
      },
    ],
  },
  {
    clientId: 'client-6',
    rentals: [
      {
        propertyType: 'apartment',
        propertyName: 'Appartement C2',
        monthlyRent: 100000,
        startDate: subMonths(new Date(), 2),
      },
      {
        propertyType: 'room',
        propertyName: 'Chambre D1',
        monthlyRent: 45000,
        startDate: subMonths(new Date(), 1),
      },
    ],
  },
  {
    clientId: 'client-7',
    rentals: [
      {
        propertyType: 'villa',
        propertyName: 'Villa Cocotier',
        monthlyRent: 250000,
        startDate: subMonths(new Date(), 10),
      },
    ],
  },
]

// Populate rentals with payments and deposits
rentalsData.forEach(({ clientId, rentals }) => {
  const client = mockClients.find((c) => c.id === clientId)
  if (!client) return

  client.rentals = rentals.map((rentalData, index) => {
    const rental = {
      id: `${clientId}-rental-${index}`,
      clientId,
      propertyType: rentalData.propertyType || 'apartment',
      propertyName: rentalData.propertyName || 'Unknown',
      monthlyRent: rentalData.monthlyRent || 100000,
      startDate: rentalData.startDate.toISOString(),
      deposit: {
        total: (rentalData.monthlyRent || 100000) * 2,
        paid:
          Math.random() > 0.3
            ? (rentalData.monthlyRent || 100000) * 2
            : Math.floor((rentalData.monthlyRent || 100000) * (1 + Math.random())),
        payments: [],
      },
      payments: [],
      documents: [],
    }

    // Add deposit payment records
    if (rental.deposit.paid > 0) {
      const startDate = new Date(rental.startDate)
      rental.deposit.payments = [
        {
          id: generateId(),
          amount: rental.deposit.paid,
          date: startDate.toISOString(),
          receiptNumber: `DEP-${format(startDate, 'yyyyMM')}-${generateId().substring(0, 6).toUpperCase()}`,
        },
      ]
    }

    // Generate monthly payments
    rental.payments = generateMonthlyPayments(rental)

    return rental
  })
})

// Build final database
const db = {
  clients: mockClients,
  documents: [],
  payments: [],
  deposits: [],
  users: [
    {
      id: 'superadmin-001',
      username: '771718013',
      password: 'pmtadmin2024',
      name: 'Super Admin',
      email: 'superadmin@kya.sn',
      phone: '+221771718013',
      role: 'SUPER_ADMIN',
      status: 'ACTIF',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  admins: [],
  superadmins: [
    {
      id: 'superadmin-001',
      userId: 'superadmin-001',
      name: 'Super Admin',
      email: 'superadmin@kya.sn',
      status: 'ACTIF',
      createdAt: new Date().toISOString(),
    },
  ],
  admin_clients: [],
  rentals: [],
  notifications: [],
  otp: [],
  audit_logs: [],
  entreprises: [],
  blocked_ips: [],
}

// Write to db.json
const dbPath = path.join(__dirname, '../backend/db/db.json')
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))

console.log(`✅ db.json générée avec ${mockClients.length} clients`)
console.log(`   - Total rentals: ${mockClients.reduce((sum, c) => sum + c.rentals.length, 0)}`)
mockClients.forEach((c) => {
  const totalPayments = c.rentals.reduce((sum, r) => sum + r.payments.length, 0)
  console.log(
    `   - ${c.firstName} ${c.lastName}: ${c.rentals.length} rentals, ${totalPayments} payments`
  )
})
