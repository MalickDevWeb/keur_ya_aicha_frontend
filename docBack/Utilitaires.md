# Utilitaires (pret a copier-coller)

## 1. `lib/db.js` - connexion PostgreSQL

```js
import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
})

export async function query(text, params = []) {
  const result = await db.query(text, params)
  return result
}

export async function tx(fn) {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
```

## 2. `lib/cloudinary.js` - signature + URL protegee

```js
import crypto from 'crypto'

export function parseCloudinaryUrl(url = '') {
  const raw = String(url || '').trim()
  if (!raw.startsWith('cloudinary://')) return null

  try {
    const withoutProto = raw.slice('cloudinary://'.length)
    const [authPart, cloudNamePart] = withoutProto.split('@')
    const [apiKeyPart, apiSecretPart] = String(authPart || '').split(':')

    const apiKey = String(apiKeyPart || '').trim()
    const apiSecret = String(apiSecretPart || '').trim()
    const cloudName = String(cloudNamePart || '').trim()

    if (!apiKey || !apiSecret || !cloudName) return null
    return { apiKey, apiSecret, cloudName }
  } catch {
    return null
  }
}

export function getCloudinaryConfig() {
  const fromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL || '')
  return {
    apiKey: fromUrl?.apiKey || process.env.CLOUDINARY_API_KEY || '',
    apiSecret: fromUrl?.apiSecret || process.env.CLOUDINARY_API_SECRET || '',
    cloudName: fromUrl?.cloudName || process.env.CLOUDINARY_CLOUD_NAME || '',
  }
}

export function signCloudinaryParams(params, apiSecret) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  return crypto
    .createHash('sha1')
    .update(toSign + apiSecret)
    .digest('hex')
}

export function parseCloudinaryDeliveryUrl(assetUrl = '') {
  const raw = String(assetUrl || '').trim()
  if (!raw) return null

  try {
    const parsed = new URL(raw)
    const host = String(parsed.hostname || '').toLowerCase()
    if (!host.endsWith('cloudinary.com')) return null

    const segments = String(parsed.pathname || '')
      .split('/')
      .filter(Boolean)
      .map((s) => decodeURIComponent(s))

    if (segments.length < 4) return null

    const cloudName = segments[0]
    const resourceType = segments[1]
    const deliveryType = segments[2]
    const tail = segments.slice(3)

    let cursor = 0
    if (/^s--[A-Za-z0-9_-]{8}--$/.test(tail[cursor] || '')) cursor += 1

    const versionOffset = tail
      .slice(cursor)
      .findIndex((part) => /^v\d+$/.test(part || ''))

    if (versionOffset >= 0) cursor += versionOffset + 1

    const publicPath = tail.slice(cursor).join('/')
    if (!publicPath) return null

    const lastSlash = publicPath.lastIndexOf('/')
    const fileName = lastSlash >= 0 ? publicPath.slice(lastSlash + 1) : publicPath
    const dotIndex = fileName.lastIndexOf('.')

    const hasFormat = dotIndex > 0
    const format = hasFormat ? fileName.slice(dotIndex + 1) : ''
    const baseName = hasFormat ? fileName.slice(0, dotIndex) : fileName
    const publicId = lastSlash >= 0 ? `${publicPath.slice(0, lastSlash + 1)}${baseName}` : baseName

    return { cloudName, resourceType, deliveryType, publicId, format }
  } catch {
    return null
  }
}

export function buildCloudinaryDownloadUrl(assetUrl) {
  const cfg = getCloudinaryConfig()
  if (!cfg.apiKey || !cfg.apiSecret || !cfg.cloudName) {
    throw new Error('Cloudinary not configured')
  }

  const parsedAsset = parseCloudinaryDeliveryUrl(assetUrl)
  if (!parsedAsset) throw new Error('Invalid Cloudinary delivery url')
  if (parsedAsset.cloudName !== cfg.cloudName) {
    throw new Error('Cloudinary cloud name mismatch')
  }

  const now = Math.floor(Date.now() / 1000)
  const expiresAt = now + 5 * 60

  const paramsToSign = {
    public_id: parsedAsset.publicId,
    ...(parsedAsset.format ? { format: parsedAsset.format } : {}),
    ...(parsedAsset.deliveryType ? { type: parsedAsset.deliveryType } : {}),
    expires_at: expiresAt,
    timestamp: now,
  }

  const signature = signCloudinaryParams(paramsToSign, cfg.apiSecret)
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(paramsToSign).map(([k, v]) => [k, String(v)])),
    api_key: cfg.apiKey,
    signature,
  })

  return {
    url: `https://api.cloudinary.com/v1_1/${cfg.cloudName}/${parsedAsset.resourceType}/download?${query.toString()}`,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  }
}
```

## 3. `lib/normalizers.js` (reutiliser logique actuelle)

```js
export function normalizePhone(value = '') {
  const digits = String(value).replace(/[^\d]/g, '')
  const withoutCountry = digits.startsWith('221') ? digits.slice(3) : digits
  return withoutCountry.slice(-9)
}

export function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase()
}

export function normalizeText(value = '') {
  return String(value).trim().toLowerCase()
}

export function toMonthKey(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now())
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}
```
