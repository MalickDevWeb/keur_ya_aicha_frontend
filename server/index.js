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
