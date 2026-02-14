require('dotenv').config()
const express = require('express')
const crypto = require('crypto')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

function parseCloudinaryUrl(url) {
  // CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  if (!url) return null
  try {
    const withoutProto = url.replace('cloudinary://', '')
    const [auth, cloudName] = withoutProto.split('@')
    const [apiKey, apiSecret] = auth.split(':')
    return { apiKey, apiSecret, cloudName }
  } catch (e) {
    return null
  }
}

const cfg = parseCloudinaryUrl(process.env.CLOUDINARY_URL)
if (!cfg) {
  console.warn('CLOUDINARY_URL not found or invalid in /server/.env')
}

const logAction = (userId, action, details) => {
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  const query = `INSERT INTO AuditLogs (user_id, action, ip_address, details) VALUES ($1, $2, $3, $4)`
  db.query(query, [userId, action, ipAddress, details])
}

const monitorAnomalies = () => {
  const failedLoginQuery = `SELECT user_id, COUNT(*) AS failed_attempts FROM AuditLogs WHERE action = 'FAILED_LOGIN' AND timestamp > NOW() - INTERVAL '1 HOUR' GROUP BY user_id HAVING COUNT(*) > 5;`
  db.query(failedLoginQuery, (err, results) => {
    if (err) console.error('Error monitoring failed logins:', err)
    results.rows.forEach((row) => {
      console.log(`Alert: User ${row.user_id} has ${row.failed_attempts} failed login attempts.`)
      // Add logic to block user or notify admin
    })
  })

  const unusualActivityQuery = `SELECT ip_address, COUNT(*) AS action_count FROM AuditLogs WHERE timestamp > NOW() - INTERVAL '1 HOUR' GROUP BY ip_address HAVING COUNT(*) > 100;`
  db.query(unusualActivityQuery, (err, results) => {
    if (err) console.error('Error monitoring unusual activity:', err)
    results.rows.forEach((row) => {
      console.log(`Alert: IP ${row.ip_address} has ${row.action_count} actions in the last hour.`)
      // Add logic to block IP or notify admin
    })
  })
}

app.post('/sign', (req, res) => {
  if (!cfg) return res.status(500).json({ error: 'Cloudinary not configured' })
  // Minimal signature: timestamp only. Add params here if needed (folder, public_id...)
  const timestamp = Math.floor(Date.now() / 1000)
  const toSign = `timestamp=${timestamp}`
  const signature = crypto
    .createHash('sha1')
    .update(toSign + cfg.apiSecret)
    .digest('hex')
  res.json({ api_key: cfg.apiKey, timestamp, signature })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Cloudinary sign server listening on http://localhost:${PORT}`))

// Schedule anomaly monitoring every hour
setInterval(monitorAnomalies, 3600000)
