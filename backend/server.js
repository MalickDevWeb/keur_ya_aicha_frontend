import express from 'express'
import fs from 'fs'
import path from 'path'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 4000
const DB_PATH = path.join(process.cwd(), 'db', 'db.json')

app.use(cors())
app.use(express.json({ limit: '20mb' }))

function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8')
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

app.get('/api', (req, res) => {
  res.json({ ok: true, message: 'KeurYaAicha JSON API' })
})

app.get('/api/clients', (req, res) => {
  const db = readDb()
  res.json(db.clients || [])
})

app.get('/api/clients/:id', (req, res) => {
  const db = readDb()
  const client = (db.clients || []).find((c) => c.id === req.params.id)
  if (!client) return res.status(404).json({ error: 'Client not found' })
  res.json(client)
})

app.post('/api/clients', (req, res) => {
  const db = readDb()
  db.clients = db.clients || []
  const client = req.body
  client.id = client.id || `client_${Date.now()}`
  client.createdAt = new Date().toISOString()
  db.clients.push(client)
  writeDb(db)
  res.json({ success: true, client })
})

app.put('/api/clients/:id', (req, res) => {
  const db = readDb()
  db.clients = db.clients || []
  const idx = db.clients.findIndex((c) => c.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Client not found' })
  db.clients[idx] = { ...db.clients[idx], ...req.body }
  writeDb(db)
  res.json({ success: true, client: db.clients[idx] })
})

app.delete('/api/clients/:id', (req, res) => {
  const db = readDb()
  db.clients = db.clients || []
  db.clients = db.clients.filter((c) => c.id !== req.params.id)
  writeDb(db)
  res.json({ success: true })
})

app.get('/api/documents', (req, res) => {
  const db = readDb()
  res.json(db.documents || [])
})

app.get('/api/payments', (req, res) => {
  const db = readDb()
  res.json(db.payments || [])
})

app.delete('/api/documents/:id', (req, res) => {
  const db = readDb()
  db.documents = db.documents || []
  db.documents = db.documents.filter((d) => d.id !== req.params.id)
  writeDb(db)
  res.json({ success: true })
})
// Add a payment record (monthly payment receipt)
app.post('/api/payments', (req, res) => {
  const db = readDb()
  const { rentalId, paymentId, amount } = req.body
  // locate payment inside clients -> rentals -> payments
  const clients = db.clients || []
  let updatedPayment = null
  for (const client of clients) {
    for (const rental of client.rentals || []) {
      if (rental.id !== rentalId) continue
      for (const payment of rental.payments || []) {
        if (payment.id !== paymentId) continue
        const paidAmount = (payment.paidAmount || 0) + amount
        payment.paidAmount = Math.min(paidAmount, payment.amount || 0)
        // push a payment record
        const record = {
          id: `pr_${Date.now()}`,
          amount,
          date: new Date().toISOString(),
          receiptNumber: `REC-${new Date().toISOString()}`,
        }
        payment.payments = payment.payments || []
        payment.payments.push(record)
        // update status
        payment.status =
          payment.paidAmount >= payment.amount
            ? 'paid'
            : payment.paidAmount > 0
              ? 'partial'
              : 'unpaid'
        updatedPayment = payment
        break
      }
    }
  }
  writeDb(db)
  if (!updatedPayment) return res.status(404).json({ error: 'Payment not found' })
  res.json({ success: true, payment: updatedPayment })
})

// Add deposit payment
app.post('/api/deposits', (req, res) => {
  const db = readDb()
  const { rentalId, amount } = req.body
  const clients = db.clients || []
  let updatedDeposit = null
  for (const client of clients) {
    for (const rental of client.rentals || []) {
      if (rental.id !== rentalId) continue
      rental.deposit = rental.deposit || { total: 0, paid: 0, payments: [] }
      rental.deposit.paid = (rental.deposit.paid || 0) + amount
      const record = {
        id: `dep_${Date.now()}`,
        amount,
        date: new Date().toISOString(),
        receiptNumber: `DEP-${Date.now()}`,
      }
      rental.deposit.payments = rental.deposit.payments || []
      rental.deposit.payments.push(record)
      updatedDeposit = rental.deposit
      break
    }
  }
  writeDb(db)
  if (!updatedDeposit) return res.status(404).json({ error: 'Rental not found' })
  res.json({ success: true, deposit: updatedDeposit })
})

// Add a document (file is expected as base64 in body for simplicity)
app.post('/api/documents', (req, res) => {
  const db = readDb()
  db.documents = db.documents || []
  const doc = req.body
  doc.id = doc.id || `doc_${Date.now()}`
  doc.uploadedAt = new Date().toISOString()
  db.documents.push(doc)
  writeDb(db)
  res.json({ success: true, document: doc })
})

// Simple ping
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() })
})

app.listen(PORT, () => {
  console.log(`KeurYaAicha JSON API listening on http://localhost:${PORT}`)
})
