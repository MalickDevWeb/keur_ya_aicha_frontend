import { App } from '@tinyhttp/app'
import { cors } from '@tinyhttp/cors'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { json } from 'milliparsec'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Observer } from 'json-server/lib/observer.js'
import { Service, isItem } from 'json-server/lib/service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const raw = fs.readFileSync(filePath, 'utf-8')
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .forEach((line) => {
      const separatorIndex = line.indexOf('=')
      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!key) return
      if (typeof process.env[key] !== 'undefined') return
      process.env[key] = value
    })
}

const ENV_CANDIDATES = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../server/.env'),
  path.resolve(__dirname, '../../.env'),
]

ENV_CANDIDATES.forEach(loadEnvFile)

const dbFile = path.resolve(__dirname, '../db/db.json')
const adapter = new JSONFile(dbFile)
const observer = new Observer(adapter)
const db = new Low(observer, {})

const SLOW_REQUEST_MS = 1500
const FAILED_LOGIN_THRESHOLD = 5
const FAILED_LOGIN_WINDOW_MS = 60 * 60 * 1000
const UNDO_WINDOW_MS = 60 * 24 * 60 * 60 * 1000
const UNDO_HISTORY_LIMIT = 300
const UNDO_EXCLUDED_RESOURCES = new Set(['audit_logs', 'undo_actions', 'deposits', 'payments'])
const ADMIN_SUBSCRIPTION_GRACE_DAYS = 5
const DEFAULT_DOCUMENT_RETENTION_DAYS = 365
const DEFAULT_AUDIT_RETENTION_DAYS = 365
const SUPER_ADMIN_SECOND_AUTH_TTL_MS = 30 * 60 * 1000
const SYSTEM_POLICY_SETTING_KEY = 'platform_config_v1'
const RETENTION_SWEEP_INTERVAL_MS = 60 * 1000
const ADMIN_PAYMENT_METHODS = new Set(['wave', 'orange_money', 'cash'])
const ADMIN_PAYMENT_ACTIVE_STATUSES = new Set(['pending', 'paid'])
const MOBILE_PAYMENT_METHODS = new Set(['wave', 'orange_money'])
const PAYMENT_PROVIDER_NAME = String(process.env.PAYMENT_PROVIDER || 'stripe')
  .trim()
  .toLowerCase()
const PAYMENT_ALLOW_SIMULATION = String(
  process.env.PAYMENT_ALLOW_SIMULATION ??
    (String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production' ? 'false' : 'true')
)
  .trim()
  .toLowerCase() === 'true'

function parseCloudinaryUrl(url = '') {
  const raw = String(url || '').trim()
  if (!raw || !raw.startsWith('cloudinary://')) return null
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

function parseCloudinaryAssetDeliveryUrl(assetUrl = '') {
  const raw = String(assetUrl || '').trim()
  if (!raw) return null
  try {
    const parsed = new URL(raw)
    const host = String(parsed.hostname || '').toLowerCase()
    if (!host.endsWith('cloudinary.com')) return null

    const segments = String(parsed.pathname || '')
      .split('/')
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment))

    if (segments.length < 4) return null

    const cloudName = segments[0]
    const resourceType = segments[1]
    const deliveryType = segments[2]
    const tail = segments.slice(3)

    if (!cloudName || !resourceType || !deliveryType || tail.length === 0) return null

    let cursor = 0
    if (/^s--[A-Za-z0-9_-]{8}--$/.test(tail[cursor] || '')) {
      cursor += 1
    }

    const versionOffset = tail
      .slice(cursor)
      .findIndex((part) => /^v\d+$/.test(part || ''))

    if (versionOffset >= 0) {
      cursor += versionOffset + 1
    }

    const publicPath = tail.slice(cursor).join('/')
    if (!publicPath) return null

    const lastSlash = publicPath.lastIndexOf('/')
    const fileName = lastSlash >= 0 ? publicPath.slice(lastSlash + 1) : publicPath
    const dotIndex = fileName.lastIndexOf('.')
    const hasFormat = dotIndex > 0
    const format = hasFormat ? fileName.slice(dotIndex + 1) : ''
    const baseName = hasFormat ? fileName.slice(0, dotIndex) : fileName
    const publicId = lastSlash >= 0 ? `${publicPath.slice(0, lastSlash + 1)}${baseName}` : baseName

    if (!publicId) return null

    return {
      cloudName,
      resourceType,
      deliveryType,
      publicId,
      format,
    }
  } catch {
    return null
  }
}

const cloudinaryFromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL || '')
const CLOUDINARY_SIGNATURE_CONFIG = {
  apiKey: String(cloudinaryFromUrl?.apiKey || process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || '').trim(),
  apiSecret: String(cloudinaryFromUrl?.apiSecret || process.env.CLOUDINARY_API_SECRET || '').trim(),
  cloudName: String(cloudinaryFromUrl?.cloudName || process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim(),
}

function signCloudinaryParams(params, apiSecret) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return crypto
    .createHash('sha1')
    .update(toSign + apiSecret)
    .digest('hex')
}

function ensureDbCollections(data = {}) {
  data.users ||= []
  data.admins ||= []
  data.superadmins ||= []
  data.clients ||= []
  data.admin_clients ||= []
  data.rentals ||= []
  data.notifications ||= []
  data.otp ||= []
  data.audit_logs ||= []
  data.settings ||= []
  data.entreprises ||= []
  data.blocked_ips ||= []
  data.admin_payments ||= []
  data.import_runs ||= []
  data.import_errors ||= []
  data.documents ||= []
  data.undo_actions ||= []
  return data
}

await db.read()
db.data = ensureDbCollections(db.data || {})

const authContext = { userId: null, impersonation: null, updatedAt: null, superAdminSecondAuthAt: null }
const sessions = []

const service = new Service(db)
const app = new App()
const TRUSTED_IPS = new Set(['127.0.0.1', '::1'])
let lastRetentionSweepAt = 0

function normalizePhone(phone = '') {
  const digits = String(phone).replace(/[^\d]/g, '')
  const withoutCountry = digits.startsWith('221') ? digits.slice(3) : digits
  return withoutCountry.slice(-9)
}

function getSettingValue(key = '') {
  const safeKey = String(key || '').trim()
  if (!safeKey) return null
  const settings = Array.isArray(db.data?.settings) ? db.data.settings : []
  const found = settings.find((item) => String(item?.key || item?.id || '').trim() === safeKey)
  if (!found) return null
  return String(found?.value || '').trim() || null
}

function parseSystemPolicy() {
  const fallback = {
    maintenance: {
      enabled: false,
      message: 'Maintenance en cours. Les actions d’écriture sont temporairement désactivées.',
    },
    sessionSecurity: {
      maxFailedLogins: FAILED_LOGIN_THRESHOLD,
      lockoutMinutes: Math.max(1, Math.round(FAILED_LOGIN_WINDOW_MS / (60 * 1000))),
    },
    paymentRules: {
      graceDays: ADMIN_SUBSCRIPTION_GRACE_DAYS,
      blockOnOverdue: true,
    },
    documents: {
      retentionDays: DEFAULT_DOCUMENT_RETENTION_DAYS,
    },
    auditCompliance: {
      retentionDays: DEFAULT_AUDIT_RETENTION_DAYS,
    },
  }

  const raw = getSettingValue(SYSTEM_POLICY_SETTING_KEY)
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    const maintenance = parsed?.maintenance || {}
    const sessionSecurity = parsed?.sessionSecurity || {}
    const paymentRules = parsed?.paymentRules || {}
    const documents = parsed?.documents || {}
    const auditCompliance = parsed?.auditCompliance || {}
    return {
      maintenance: {
        enabled: Boolean(maintenance.enabled),
        message: String(maintenance.message || fallback.maintenance.message).trim() || fallback.maintenance.message,
      },
      sessionSecurity: {
        maxFailedLogins: Math.max(1, Number(sessionSecurity.maxFailedLogins) || fallback.sessionSecurity.maxFailedLogins),
        lockoutMinutes: Math.max(1, Number(sessionSecurity.lockoutMinutes) || fallback.sessionSecurity.lockoutMinutes),
      },
      paymentRules: {
        graceDays: Math.max(0, Number(paymentRules.graceDays) || fallback.paymentRules.graceDays),
        blockOnOverdue:
          typeof paymentRules.blockOnOverdue === 'boolean'
            ? paymentRules.blockOnOverdue
            : fallback.paymentRules.blockOnOverdue,
      },
      documents: {
        retentionDays: Math.max(1, Number(documents.retentionDays) || fallback.documents.retentionDays),
      },
      auditCompliance: {
        retentionDays: Math.max(1, Number(auditCompliance.retentionDays) || fallback.auditCompliance.retentionDays),
      },
    }
  } catch {
    return fallback
  }
}

function extractRetentionTimestamp(entry) {
  if (!entry || typeof entry !== 'object') return 0
  const candidates = [
    entry.uploadedAt,
    entry.createdAt,
    entry.created_at,
    entry.updatedAt,
    entry.date,
  ]
  for (const candidate of candidates) {
    const ms = new Date(candidate || 0).getTime()
    if (Number.isFinite(ms) && ms > 0) return ms
  }
  return 0
}

function applyCollectionRetention(items, cutoffMs) {
  if (!Array.isArray(items)) return []
  return items.filter((item) => {
    const stamp = extractRetentionTimestamp(item)
    if (!stamp) return true
    return stamp >= cutoffMs
  })
}

async function applyRetentionPolicies({ force = false } = {}) {
  const now = Date.now()
  if (!force && now - lastRetentionSweepAt < RETENTION_SWEEP_INTERVAL_MS) return
  lastRetentionSweepAt = now

  const policy = parseSystemPolicy()
  const documentRetentionDays = Math.max(1, Number(policy.documents?.retentionDays || DEFAULT_DOCUMENT_RETENTION_DAYS))
  const auditRetentionDays = Math.max(1, Number(policy.auditCompliance?.retentionDays || DEFAULT_AUDIT_RETENTION_DAYS))

  const documents = Array.isArray(db.data?.documents) ? db.data.documents : []
  const logs = Array.isArray(db.data?.audit_logs) ? db.data.audit_logs : []

  const documentCutoffMs = now - documentRetentionDays * 24 * 60 * 60 * 1000
  const logsCutoffMs = now - auditRetentionDays * 24 * 60 * 60 * 1000

  const retainedDocuments = applyCollectionRetention(documents, documentCutoffMs)
  const retainedLogs = applyCollectionRetention(logs, logsCutoffMs)

  const hasDocumentChange = retainedDocuments.length !== documents.length
  const hasLogsChange = retainedLogs.length !== logs.length
  if (!hasDocumentChange && !hasLogsChange) return

  if (hasDocumentChange) {
    db.data.documents = retainedDocuments
  }
  if (hasLogsChange) {
    db.data.audit_logs = retainedLogs
  }
  await db.write()
}

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase()
}

function normalizeText(value = '') {
  return String(value).trim().toLowerCase()
}

function toMonthKey(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now())
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function parseMonthKey(key) {
  const match = String(key || '').match(/^(\d{4})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null
  return new Date(year, month - 1, 1)
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1)
}

function getSubscriptionDueDateForMonth(monthKey) {
  const monthDate = parseMonthKey(monthKey)
  if (!monthDate) return null
  const policy = parseSystemPolicy()
  const graceDays = Math.max(0, Number(policy.paymentRules?.graceDays || ADMIN_SUBSCRIPTION_GRACE_DAYS))
  return new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, graceDays, 23, 59, 59, 999)
}

function normalizePaymentMethod(method = '') {
  const normalized = String(method || '').trim().toLowerCase()
  if (!ADMIN_PAYMENT_METHODS.has(normalized)) return ''
  return normalized
}

function normalizeProviderName(provider = '') {
  const value = String(provider || '').trim().toLowerCase()
  if (value === 'orange_money') return 'orange'
  if (value === 'om') return 'orange'
  if (value === 'manual') return 'manual'
  if (value === 'stripe') return 'stripe'
  if (value === 'wave') return 'wave'
  if (value === 'orange') return 'orange'
  return value
}

function getProviderForPaymentMethod(paymentMethod = '', fallbackProvider = PAYMENT_PROVIDER_NAME) {
  const method = normalizePaymentMethod(paymentMethod)
  if (method === 'wave') return 'wave'
  if (method === 'orange_money') return 'orange'
  if (method === 'cash') return 'manual'
  return normalizeProviderName(fallbackProvider || 'stripe')
}

function normalizeAdminPaymentStatus(status = '') {
  const value = String(status || '').trim().toLowerCase()
  if (value === 'pending') return 'pending'
  if (value === 'failed') return 'failed'
  if (value === 'cancelled') return 'cancelled'
  if (value === 'paid') return 'paid'
  return 'paid'
}

function normalizeImportRunRecord(run = {}) {
  const inserted = Array.isArray(run?.inserted) ? run.inserted : []
  const errors = Array.isArray(run?.errors) ? run.errors : []
  const ignored = Boolean(run?.ignored)
  const readSuccess =
    typeof run?.readSuccess === 'boolean'
      ? run.readSuccess
      : inserted.length === 0
  const readErrors =
    typeof run?.readErrors === 'boolean'
      ? run.readErrors
      : ignored || errors.length === 0

  return {
    ...run,
    adminId: String(run?.adminId || ''),
    fileName: String(run?.fileName || ''),
    totalRows: Number(run?.totalRows || inserted.length + errors.length || 0),
    inserted,
    errors,
    ignored,
    readSuccess,
    readErrors,
    createdAt: run?.createdAt || new Date().toISOString(),
  }
}

function canAccessImportRun(run, role, adminId) {
  if (!role) return false
  if (role === 'SUPER_ADMIN' && !adminId) return true
  return String(run?.adminId || '') === String(adminId || '')
}

function resolveImportRunOwnerAdminId(role, adminId, payload = {}) {
  if (role === 'SUPER_ADMIN' && !adminId) {
    return String(payload?.adminId || '').trim()
  }
  return String(adminId || '').trim()
}

function isPaymentSettled(payment) {
  const status = normalizeAdminPaymentStatus(payment?.status || '')
  if (!payment?.status) return true
  return status === 'paid'
}

function getPublicBaseUrl(req) {
  const envBase = String(process.env.APP_BASE_URL || process.env.PUBLIC_BASE_URL || '').trim()
  if (envBase) return envBase.replace(/\/$/, '')
  const forwardedProto = String(req?.headers?.['x-forwarded-proto'] || '').split(',')[0]?.trim()
  const proto = forwardedProto || 'http'
  const host = String(req?.headers?.host || `localhost:${process.env.PORT || 4000}`).trim()
  return `${proto}://${host}`.replace(/\/$/, '')
}

function safeTimingEqual(a, b) {
  const left = Buffer.from(String(a || ''))
  const right = Buffer.from(String(b || ''))
  if (left.length !== right.length || left.length === 0) return false
  return crypto.timingSafeEqual(left, right)
}

function parseJsonSafe(text = '') {
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

async function readJsonSafe(response) {
  const text = await response.text().catch(() => '')
  return parseJsonSafe(text || '{}')
}

function buildSimulationInitiation(provider, data) {
  return {
    provider,
    status: 'paid',
    externalId: `${provider}-sim-${Date.now().toString(36)}`,
    checkoutUrl: '',
    raw: {
      simulated: true,
      amount: Number(data?.amount || 0),
      month: data?.month || '',
      adminId: data?.adminId || '',
    },
  }
}

function createStripePaymentService() {
  const baseUrl = String(process.env.STRIPE_BASE_URL || 'https://api.stripe.com').replace(/\/$/, '')
  const secretKey = String(process.env.STRIPE_SECRET_KEY || '').trim()
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim()

  return {
    name: 'stripe',
    async initiate(data) {
      if (PAYMENT_ALLOW_SIMULATION) {
        return buildSimulationInitiation('stripe', data)
      }
      if (!secretKey) {
        throw new Error('Configuration Stripe manquante: STRIPE_SECRET_KEY.')
      }

      const params = new URLSearchParams()
      params.set('mode', 'payment')
      params.set('success_url', data.successUrl)
      params.set('cancel_url', data.cancelUrl)
      params.set('line_items[0][price_data][currency]', String(data.currency || 'xof').toLowerCase())
      params.set('line_items[0][price_data][product_data][name]', 'Abonnement admin')
      params.set('line_items[0][price_data][unit_amount]', String(Math.max(1, Math.round(Number(data.amount || 0) * 100))))
      params.set('line_items[0][quantity]', '1')
      Object.entries(data.metadata || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        params.set(`metadata[${key}]`, String(value))
      })

      const auth = Buffer.from(`${secretKey}:`).toString('base64')
      const response = await fetch(`${baseUrl}/v1/checkout/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })
      const payload = await readJsonSafe(response)
      if (!response.ok) {
        const detail = payload?.error?.message || payload?.message || 'Stripe initiation failed'
        throw new Error(detail)
      }

      return {
        provider: 'stripe',
        status: 'pending',
        externalId: String(payload.id || ''),
        checkoutUrl: String(payload.url || ''),
        raw: payload,
      }
    },
    verifyWebhook(payload, signatureHeader) {
      if (!webhookSecret) return false
      const signature = String(signatureHeader || '')
      if (!signature) return false
      const parts = signature
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
      const timestamp = parts.find((entry) => entry.startsWith('t='))?.slice(2) || ''
      const signatures = parts.filter((entry) => entry.startsWith('v1=')).map((entry) => entry.slice(3))
      if (!timestamp || signatures.length === 0) return false
      const signedPayload = `${timestamp}.${payload}`
      const expected = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex')
      return signatures.some((candidate) => safeTimingEqual(candidate, expected))
    },
    parseWebhookEvent(body) {
      const event = body && typeof body === 'object' ? body : {}
      const type = String(event?.type || '').toLowerCase()
      const obj = event?.data?.object || {}
      const metadata = obj?.metadata || {}
      const isPaidEvent = type === 'checkout.session.completed' || type === 'payment_intent.succeeded'
      return {
        paid: isPaidEvent,
        externalId: String(obj?.id || obj?.payment_intent || ''),
        paymentId: String(metadata?.adminPaymentId || metadata?.paymentId || ''),
        adminId: String(metadata?.adminId || ''),
        month: String(metadata?.month || ''),
        raw: event,
      }
    },
  }
}

function createWavePaymentService() {
  const baseUrl = String(process.env.WAVE_BASE_URL || '').replace(/\/$/, '')
  const secret = String(process.env.WAVE_SECRET || '').trim()
  const webhookSecret = String(process.env.WAVE_WEBHOOK_SECRET || '').trim()

  return {
    name: 'wave',
    async initiate(data) {
      if (PAYMENT_ALLOW_SIMULATION) {
        return buildSimulationInitiation('wave', data)
      }
      if (!baseUrl || !secret) {
        throw new Error('Configuration Wave manquante: WAVE_BASE_URL et/ou WAVE_SECRET.')
      }

      const response = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(data.amount || 0),
          currency: String(data.currency || 'XOF').toUpperCase(),
          phone: data.payerPhone || '',
          callback_url: data.webhookUrl || '',
          success_url: data.successUrl || '',
          cancel_url: data.cancelUrl || '',
          metadata: data.metadata || {},
        }),
      })
      const payload = await readJsonSafe(response)
      if (!response.ok) {
        const detail = payload?.error?.message || payload?.error || payload?.message || 'Wave initiation failed'
        throw new Error(detail)
      }

      return {
        provider: 'wave',
        status: 'pending',
        externalId: String(payload?.id || payload?.transaction_id || payload?.reference || ''),
        checkoutUrl: String(payload?.checkout_url || payload?.payment_url || ''),
        raw: payload,
      }
    },
    verifyWebhook(payload, signatureHeader) {
      if (!webhookSecret) return false
      const expected = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex')
      return safeTimingEqual(signatureHeader || '', expected)
    },
    parseWebhookEvent(body) {
      const data = body?.data || body || {}
      const status = String(data?.status || body?.status || '').toLowerCase()
      const paid = ['paid', 'success', 'succeeded', 'completed'].includes(status)
      const metadata = data?.metadata || body?.metadata || {}
      return {
        paid,
        externalId: String(data?.id || data?.transaction_id || data?.reference || body?.id || ''),
        paymentId: String(metadata?.adminPaymentId || metadata?.paymentId || ''),
        adminId: String(metadata?.adminId || ''),
        month: String(metadata?.month || ''),
        raw: body,
      }
    },
  }
}

function createOrangePaymentService() {
  const baseUrl = String(process.env.ORANGE_BASE_URL || '').replace(/\/$/, '')
  const secret = String(process.env.ORANGE_SECRET || '').trim()
  const webhookSecret = String(process.env.ORANGE_WEBHOOK_SECRET || '').trim()

  return {
    name: 'orange',
    async initiate(data) {
      if (PAYMENT_ALLOW_SIMULATION) {
        return buildSimulationInitiation('orange', data)
      }
      if (!baseUrl || !secret) {
        throw new Error('Configuration Orange Money manquante: ORANGE_BASE_URL et/ou ORANGE_SECRET.')
      }

      const response = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(data.amount || 0),
          currency: String(data.currency || 'XOF').toUpperCase(),
          phone: data.payerPhone || '',
          callback_url: data.webhookUrl || '',
          success_url: data.successUrl || '',
          cancel_url: data.cancelUrl || '',
          metadata: data.metadata || {},
        }),
      })
      const payload = await readJsonSafe(response)
      if (!response.ok) {
        const detail = payload?.error?.message || payload?.error || payload?.message || 'Orange Money initiation failed'
        throw new Error(detail)
      }

      return {
        provider: 'orange',
        status: 'pending',
        externalId: String(payload?.id || payload?.transaction_id || payload?.reference || ''),
        checkoutUrl: String(payload?.checkout_url || payload?.payment_url || ''),
        raw: payload,
      }
    },
    verifyWebhook(payload, signatureHeader) {
      if (!webhookSecret) return false
      const expected = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex')
      return safeTimingEqual(signatureHeader || '', expected)
    },
    parseWebhookEvent(body) {
      const data = body?.data || body || {}
      const status = String(data?.status || body?.status || '').toLowerCase()
      const paid = ['paid', 'success', 'succeeded', 'completed'].includes(status)
      const metadata = data?.metadata || body?.metadata || {}
      return {
        paid,
        externalId: String(data?.id || data?.transaction_id || data?.reference || body?.id || ''),
        paymentId: String(metadata?.adminPaymentId || metadata?.paymentId || ''),
        adminId: String(metadata?.adminId || ''),
        month: String(metadata?.month || ''),
        raw: body,
      }
    },
  }
}

function createPaymentService(providerName = PAYMENT_PROVIDER_NAME) {
  const provider = normalizeProviderName(providerName)
  if (provider === 'stripe') return createStripePaymentService()
  if (provider === 'wave') return createWavePaymentService()
  if (provider === 'orange') return createOrangePaymentService()
  throw new Error(`Invalid payment provider: ${providerName}`)
}

function getPaymentMonthKey(payment) {
  return String(payment?.month || '').match(/^\d{4}-\d{2}$/) ? String(payment.month) : toMonthKey(payment?.paidAt || Date.now())
}

function getAdminSubscriptionStatus(adminId, now = new Date()) {
  const safeAdminId = String(adminId || '').trim()
  if (!safeAdminId) return { blocked: false, overdueMonth: null, dueAt: null, requiredMonth: toMonthKey(now) }

  const admins = Array.isArray(db.data?.admins) ? db.data.admins : []
  const users = Array.isArray(db.data?.users) ? db.data.users : []
  const payments = Array.isArray(db.data?.admin_payments) ? db.data.admin_payments : []
  const admin = admins.find((item) => String(item?.id || '') === safeAdminId) || null
  const user = users.find((item) => String(item?.id || '') === safeAdminId) || null

  const createdAtRaw = admin?.createdAt || user?.createdAt || now.toISOString()
  const createdAt = new Date(createdAtRaw)
  const startMonth = new Date(createdAt.getFullYear(), createdAt.getMonth(), 1)
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const paidMonths = new Set(
    payments
      .filter((payment) => String(payment?.adminId || '') === safeAdminId)
      .filter((payment) => isPaymentSettled(payment))
      .map((payment) => getPaymentMonthKey(payment))
  )
  const policy = parseSystemPolicy()
  const blockOnOverdue =
    typeof policy?.paymentRules?.blockOnOverdue === 'boolean' ? policy.paymentRules.blockOnOverdue : true

  if (blockOnOverdue) {
    for (let cursor = new Date(startMonth); cursor <= currentMonth; cursor = addMonths(cursor, 1)) {
      const monthKey = toMonthKey(cursor)
      const dueAt = getSubscriptionDueDateForMonth(monthKey)
      if (!dueAt) continue
      if (now.getTime() <= dueAt.getTime()) continue
      if (!paidMonths.has(monthKey)) {
        return {
          blocked: true,
          overdueMonth: monthKey,
          dueAt: dueAt.toISOString(),
          requiredMonth: monthKey,
        }
      }
    }
  }

  return {
    blocked: false,
    overdueMonth: null,
    dueAt: getSubscriptionDueDateForMonth(toMonthKey(now))?.toISOString() || null,
    requiredMonth: toMonthKey(now),
  }
}

function isSubscriptionAllowedPath(reqPath = '') {
  const path = String(reqPath || '').split('?')[0]
  if (path === '/auth' || path.startsWith('/auth/')) return true
  if (path === '/authContext' || path.startsWith('/authContext/')) return true
  if (path === '/admin_payments' || path.startsWith('/admin_payments/')) return true
  if (path === '/audit_logs' || path.startsWith('/audit_logs/')) return true
  if (path === '/undo-actions' || path.startsWith('/undo-actions/')) return true
  if (/^\/admins\/[^/]+$/.test(path)) return true
  return false
}

function isSecondAuthExemptPath(reqPath = '') {
  const path = String(reqPath || '').split('?')[0]
  if (path === '/auth' || path.startsWith('/auth/')) return true
  if (path === '/authContext' || path.startsWith('/authContext/')) return true
  if (path.startsWith('/admin_payments/webhook/')) return true
  return false
}

function clearSuperAdminSecondAuth() {
  authContext.superAdminSecondAuthAt = null
}

function isSuperAdminSecondAuthValid(userId) {
  const safeUserId = String(userId || '')
  if (!safeUserId) return false
  if (String(authContext.userId || '') !== safeUserId) return false

  const verifiedAtMs = new Date(authContext.superAdminSecondAuthAt || 0).getTime()
  if (!Number.isFinite(verifiedAtMs) || verifiedAtMs <= 0) {
    clearSuperAdminSecondAuth()
    return false
  }

  const notExpired = Date.now() - verifiedAtMs <= SUPER_ADMIN_SECOND_AUTH_TTL_MS
  if (!notExpired) {
    clearSuperAdminSecondAuth()
    return false
  }
  return true
}

function enrichAuthUserWithSubscription(user) {
  const safeUser = { ...user }
  const role = String(safeUser?.role || '').toUpperCase()
  const superAdminSecondAuthRequired =
    role === 'SUPER_ADMIN' ? !isSuperAdminSecondAuthValid(safeUser?.id) : false

  if (role !== 'ADMIN' || !safeUser?.id) {
    return {
      ...safeUser,
      subscriptionBlocked: false,
      subscriptionOverdueMonth: null,
      subscriptionDueAt: null,
      subscriptionRequiredMonth: null,
      superAdminSecondAuthRequired,
    }
  }
  const status = getAdminSubscriptionStatus(safeUser.id)
  return {
    ...safeUser,
    subscriptionBlocked: status.blocked,
    subscriptionOverdueMonth: status.overdueMonth,
    subscriptionDueAt: status.dueAt,
    subscriptionRequiredMonth: status.requiredMonth,
    superAdminSecondAuthRequired,
  }
}

function splitName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function buildRentalView(rental) {
  const depositTotal = Number(rental.deposit || 0)
  return {
    id: rental.id,
    clientId: rental.clientId,
    propertyType: rental.propertyType,
    propertyName: rental.propertyName,
    monthlyRent: rental.monthlyRent,
    startDate: rental.startDate,
    deposit: {
      total: depositTotal,
      paid: 0,
      payments: [],
    },
    payments: [],
    documents: [],
  }
}

function buildClientView(client, users, rentalsByClient, adminId) {
  const user = users.find((u) => u.id === client.id)
  const fallbackName = user?.name || ''
  const { firstName, lastName } = splitName(fallbackName)
  const rentals =
    Array.isArray(client.rentals) && client.rentals.length > 0
      ? client.rentals
      : rentalsByClient.get(client.id) || []
  return {
    id: client.id,
    adminId: adminId ?? client.adminId,
    firstName: client.firstName || firstName,
    lastName: client.lastName || lastName,
    phone: client.phone || user?.phone || '',
    email: client.email || user?.email,
    cni: client.cni || '',
    status: client.status || user?.status || 'active',
    createdAt: client.createdAt || user?.createdAt || new Date().toISOString(),
    rentals: Array.isArray(rentals) && rentals.length > 0 && rentals[0]?.deposit?.total !== undefined
      ? rentals
      : rentals.map(buildRentalView),
  }
}

function buildAdminView(admin, users) {
  const user = users.find((u) => u.id === admin.id)
  return {
    id: admin.id,
    userId: admin.id,
    username: admin.username || user?.username || '',
    name: admin.name || user?.name || '',
    email: admin.email || user?.email || '',
    status: user?.status || 'ACTIF',
    entrepriseId: admin.entrepriseId || '',
    paid: admin.paid || false,
    paidAt: admin.paidAt || null,
    createdAt: admin.createdAt || user?.createdAt || null,
  }
}

function getAdminClientIds(adminId, adminClients) {
  return adminClients.filter((ac) => ac.adminId === adminId).map((ac) => ac.clientId)
}

function findUserByLogin(users, login, password) {
  const byUsername = users.find((u) => u.username === login && u.password === password)
  if (byUsername) return byUsername
  const loginPhone = normalizePhone(login)
  if (!loginPhone) return null
  return users.find((u) => normalizePhone(u.phone) === loginPhone && u.password === password) || null
}

function findPendingAdminRequestByPhone(data, login, password) {
  const loginPhone = normalizePhone(login)
  if (!loginPhone) return null
  const users = Array.isArray(data?.users) ? data.users : []
  return users.find((u) => {
    const role = String(u.role || '').toUpperCase()
    const status = String(u.status || '').toUpperCase()
    const isPending = role === 'ADMIN' && (!status || status === 'EN_ATTENTE')
    return isPending && normalizePhone(u.phone) === loginPhone && (!password || u.password === password)
  }) || null
}

function getAuthContextUser() {
  const ctx = authContext
  if (!ctx.userId) return { user: null, role: null, adminId: null, impersonation: ctx.impersonation || null }
  const users = Array.isArray(db.data?.users) ? db.data.users : []
  const user = users.find((u) => u.id === ctx.userId) || null
  const role = user ? String(user.role || '').toUpperCase() : null
  let adminId = null
  if (role === 'SUPER_ADMIN' && ctx.impersonation?.adminId) {
    adminId = ctx.impersonation.adminId
  } else if (role === 'ADMIN') {
    adminId = user?.id || null
  }
  return { user, role, adminId, impersonation: ctx.impersonation || null }
}

function appendAuditLog({ actorId, action, targetType, targetId, message, ipAddress }) {
  const logs = Array.isArray(db.data?.audit_logs) ? db.data.audit_logs : []
  logs.push({
    id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    actor: actorId || 'system',
    action,
    targetType,
    targetId,
    message,
    ipAddress,
    createdAt: new Date().toISOString(),
  })
  db.data.audit_logs = logs
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function createUndoSnapshot(data) {
  const snapshot = deepClone(ensureDbCollections(data || {}))
  delete snapshot.undo_actions
  return snapshot
}

function findById(collection, id) {
  return collection.find((item) => String(item?.id || '') === String(id || '')) || null
}

function buildRollbackPlan({ resource, resourceId, method, beforeState }) {
  if (!resource || !resourceId) return null
  const snapshotCollection = Array.isArray(beforeState?.[resource]) ? beforeState[resource] : null
  if (!snapshotCollection) return null
  const actionMethod = String(method || 'PATCH').toUpperCase()

  if (actionMethod === 'POST') {
    return { type: 'delete', id: resourceId }
  }

  if (actionMethod === 'PUT' || actionMethod === 'PATCH') {
    const beforeItem = findById(snapshotCollection, resourceId)
    if (!beforeItem) return null
    return { type: 'upsert', item: beforeItem }
  }

  if (actionMethod === 'DELETE') {
    const beforeItem = findById(snapshotCollection, resourceId)
    if (!beforeItem) return null
    return { type: 'create', item: beforeItem }
  }

  return null
}

function buildRollbackSideEffects({ resource, resourceId, beforeState }) {
  if (resource !== 'clients' || !resourceId) return null
  const beforeUsers = Array.isArray(beforeState?.users) ? beforeState.users : []
  const beforeAdminClients = Array.isArray(beforeState?.admin_clients) ? beforeState.admin_clients : []
  return {
    user: findById(beforeUsers, resourceId),
    adminClientLinks: beforeAdminClients.filter((link) => String(link?.clientId || '') === String(resourceId)),
  }
}

function applyRollbackSideEffects(entry) {
  const sideEffects = entry?.sideEffects || null
  if (!sideEffects || entry.resource !== 'clients') return
  const clientId = entry.resourceId
  if (!clientId) return

  if (Array.isArray(db.data?.users)) {
    const users = [...db.data.users]
    const withoutClientUser = users.filter((item) => String(item?.id || '') !== String(clientId))
    if (sideEffects.user) {
      withoutClientUser.push(deepClone(sideEffects.user))
    }
    db.data.users = withoutClientUser
  }

  if (Array.isArray(db.data?.admin_clients)) {
    const current = db.data.admin_clients.filter((link) => String(link?.clientId || '') !== String(clientId))
    const restored = Array.isArray(sideEffects.adminClientLinks)
      ? sideEffects.adminClientLinks.map((link) => deepClone(link))
      : []
    db.data.admin_clients = [...current, ...restored]
  }
}

function applyRollbackPlan(entry) {
  const plan = entry?.rollback
  const resource = entry?.resource
  if (!plan || !resource) return { ok: false, error: 'Action rollback invalide.' }
  const collection = Array.isArray(db.data?.[resource]) ? db.data[resource] : null
  if (!collection) return { ok: false, error: 'Ressource rollback non supportée.' }

  if (plan.type === 'delete') {
    db.data[resource] = collection.filter((item) => String(item?.id || '') !== String(plan.id || ''))
    applyRollbackSideEffects(entry)
    return { ok: true }
  }

  if (plan.type === 'upsert') {
    const item = deepClone(plan.item)
    const exists = collection.some((current) => String(current?.id || '') === String(item?.id || ''))
    db.data[resource] = exists
      ? collection.map((current) => (String(current?.id || '') === String(item?.id || '') ? item : current))
      : [...collection, item]
    applyRollbackSideEffects(entry)
    return { ok: true }
  }

  if (plan.type === 'create') {
    const item = deepClone(plan.item)
    const exists = collection.some((current) => String(current?.id || '') === String(item?.id || ''))
    db.data[resource] = exists ? collection : [...collection, item]
    applyRollbackSideEffects(entry)
    return { ok: true }
  }

  return { ok: false, error: 'Plan rollback inconnu.' }
}

function resolveRollbackEntry(entry) {
  if (!entry) return null
  if (entry.rollback) return entry

  // Backward compatibility for undo entries created before rollback plans existed.
  const fallbackPlan = buildRollbackPlan({
    resource: entry.resource,
    resourceId: entry.resourceId,
    method: entry.method,
    beforeState: entry.beforeState,
  })
  if (!fallbackPlan) return null

  const fallbackSideEffects =
    entry.sideEffects ||
    buildRollbackSideEffects({
      resource: entry.resource,
      resourceId: entry.resourceId,
      beforeState: entry.beforeState,
    })

  return {
    ...entry,
    rollback: fallbackPlan,
    sideEffects: fallbackSideEffects,
  }
}

function isUndoExpired(entry, nowMs = Date.now()) {
  const expiresAtMs = new Date(entry?.expiresAt || 0).getTime()
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs
}

function cleanUndoActions(list = []) {
  const now = Date.now()
  return list.filter((entry) => !isUndoExpired(entry, now)).slice(0, UNDO_HISTORY_LIMIT)
}

function attachUndoHeaders(res, entry) {
  if (!entry?.id) return
  res.setHeader('x-undo-id', entry.id)
  res.setHeader('x-undo-expires-at', entry.expiresAt)
  res.setHeader('x-undo-resource', entry.resource)
  if (entry.resourceId) res.setHeader('x-undo-resource-id', entry.resourceId)
}

function registerUndoAction(req, res, { resource, resourceId = null, method, beforeState }) {
  if (!resource || UNDO_EXCLUDED_RESOURCES.has(resource)) return null
  if (!beforeState) return null
  const rollback = buildRollbackPlan({ resource, resourceId, method, beforeState })
  if (!rollback) return null
  const sideEffects = buildRollbackSideEffects({ resource, resourceId, beforeState })
  const { user: actor } = getAuthContextUser()
  const now = new Date()
  const entry = {
    id: `undo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    resource,
    resourceId,
    method: String(method || req.method || 'PATCH').toUpperCase(),
    actorId: actor?.id || null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + UNDO_WINDOW_MS).toISOString(),
    path: req.url,
    rollback,
    sideEffects,
  }
  const list = cleanUndoActions(Array.isArray(db.data?.undo_actions) ? db.data.undo_actions : [])
  db.data.undo_actions = [entry, ...list].slice(0, UNDO_HISTORY_LIMIT)
  attachUndoHeaders(res, entry)
  return entry
}

// Request timing + server error logs
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    if (req.url?.startsWith('/audit_logs')) return
    const duration = Date.now() - start
    const { user: actor } = getAuthContextUser()
    if (duration >= SLOW_REQUEST_MS) {
      appendAuditLog({
        actorId: actor?.id,
        action: 'SLOW_REQUEST',
        targetType: 'request',
        targetId: req.url,
        message: `Requête lente ${req.method} ${req.url} (${duration}ms)`,
        ipAddress: getClientIp(req),
      })
    }
    if (res.statusCode >= 500) {
      appendAuditLog({
        actorId: actor?.id,
        action: 'SERVER_ERROR',
        targetType: 'request',
        targetId: req.url,
        message: `Erreur serveur ${req.method} ${req.url} (${res.statusCode})`,
        ipAddress: getClientIp(req),
      })
    }
  })
  next?.()
})

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || ''
}

function isLocalIp(ip) {
  if (!ip) return true
  if (TRUSTED_IPS.has(ip)) return true
  return ip === '::ffff:127.0.0.1'
}

function getFailedLoginCount(ip, sinceMs = FAILED_LOGIN_WINDOW_MS) {
  const policy = parseSystemPolicy()
  const computedSinceMs =
    Number.isFinite(Number(sinceMs)) && Number(sinceMs) > 0
      ? Number(sinceMs)
      : Math.max(1, Number(policy.sessionSecurity?.lockoutMinutes || 60)) * 60 * 1000
  const logs = Array.isArray(db.data?.audit_logs) ? db.data.audit_logs : []
  const since = Date.now() - computedSinceMs
  return logs.filter((l) => l.action === 'FAILED_LOGIN' && l.ipAddress === ip && new Date(l.createdAt || 0).getTime() >= since).length
}

function isBlockedIp(ip) {
  const blocked = Array.isArray(db.data?.blocked_ips) ? db.data.blocked_ips : []
  return blocked.some((b) => b.ip === ip)
}

function blockIp(ip, reason) {
  const blocked = Array.isArray(db.data?.blocked_ips) ? db.data.blocked_ips : []
  const existing = blocked.find((b) => b.ip === ip)
  if (existing) return existing
  const entry = {
    id: `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ip,
    reason,
    createdAt: new Date().toISOString(),
  }
  blocked.push(entry)
  db.data.blocked_ips = blocked
  return entry
}

function unblockIpById(id) {
  const blocked = Array.isArray(db.data?.blocked_ips) ? db.data.blocked_ips : []
  const next = blocked.filter((b) => b.id !== id)
  db.data.blocked_ips = next
  return blocked.find((b) => b.id === id) || null
}

function notifySuperAdmins(type, message, createdAt = new Date().toISOString()) {
  const users = Array.isArray(db.data?.users) ? db.data.users : []
  const notifications = Array.isArray(db.data?.notifications) ? db.data.notifications : []
  const superAdmins = users.filter((u) => String(u.role || '').toUpperCase() === 'SUPER_ADMIN')
  superAdmins.forEach((sa) => {
    notifications.push({
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: sa.id,
      type,
      message,
      is_read: false,
      created_at: createdAt,
    })
  })
  db.data.notifications = notifications
}

function hasDuplicateClient(data, payload, selfId) {
  const list = Array.isArray(data?.clients) ? data.clients : []
  const pPhone = normalizePhone(payload?.phone)
  const pEmail = normalizeEmail(payload?.email)
  return list.some((c) => {
    if (selfId && c.id === selfId) return false
    const cPhone = normalizePhone(c.phone)
    const cEmail = normalizeEmail(c.email)
    if (pPhone && cPhone && pPhone === cPhone) return true
    if (pEmail && cEmail && pEmail === cEmail) return true
    return false
  })
}

function hasDuplicateUser(data, payload, selfId) {
  const users = Array.isArray(data?.users) ? data.users : []
  const admins = Array.isArray(data?.admins) ? data.admins : []
  const pUsername = normalizeText(payload?.username)
  const pPhone = normalizePhone(payload?.phone)
  const pEmail = normalizeEmail(payload?.email)

  if (pUsername) {
    const conflict =
      users.some((u) => (selfId && u.id === selfId ? false : normalizeText(u.username) === pUsername)) ||
      admins.some((a) => normalizeText(a.username) === pUsername)
    if (conflict) return 'Ce nom d’utilisateur existe déjà.'
  }

  if (pEmail) {
    const emailConflict =
      users.some((u) => (selfId && u.id === selfId ? false : normalizeEmail(u.email) === pEmail)) ||
      admins.some((a) => normalizeEmail(a.email) === pEmail)
    if (emailConflict) return 'Cet email existe déjà.'
  }

  if (pPhone) {
    const phoneConflict =
      users.some((u) => (selfId && u.id === selfId ? false : normalizePhone(u.phone) === pPhone))
    if (phoneConflict) return 'Ce numéro existe déjà.'
  }
  return ''
}

function hasDuplicateAdmin(data, payload, selfId) {
  const admins = Array.isArray(data?.admins) ? data.admins : []
  const pUsername = normalizeText(payload?.username)

  if (pUsername) {
    const usernameConflict =
      admins.some((a) => (selfId && a.id === selfId ? false : normalizeText(a.username) === pUsername))
    if (usernameConflict) return 'Ce nom d’utilisateur existe déjà.'

    // Allow admin.username to match its linked userId
    if (payload?.userId) {
      const users = Array.isArray(data?.users) ? data.users : []
      const sameUser = users.find((u) => u.id === payload.userId)
      if (sameUser && normalizeText(sameUser.username) === pUsername) {
        return ''
      }
    }
    const users = Array.isArray(data?.users) ? data.users : []
    const userConflict = users.some((u) => normalizeText(u.username) === pUsername)
    if (userConflict) return 'Ce nom d’utilisateur existe déjà.'
  }
  return ''
}

function hasDuplicateEntreprise(data, payload, selfId) {
  const entreprises = Array.isArray(data?.entreprises) ? data.entreprises : []
  const admins = Array.isArray(data?.admins) ? data.admins : []
  const pName = normalizeText(payload?.name)

  if (!pName) return ''
  const conflict =
    entreprises.some((e) => (selfId && e.id === selfId ? false : normalizeText(e.name) === pName)) ||
    admins.some((a) => (selfId && a.id === selfId ? false : normalizeText(a.entrepriseId) === pName))
  return conflict ? 'Cette entreprise existe déjà.' : ''
}

// CORS
app
  .use((req, res, next) => {
    return cors({
      allowedHeaders: req.headers['access-control-request-headers']
        ?.split(',')
        .map((h) => h.trim()),
    })(req, res, next)
  })
  .options('*', cors())

// Body parser
app.use(json())

app.post('/sign', (req, res) => {
  if (!CLOUDINARY_SIGNATURE_CONFIG.apiKey || !CLOUDINARY_SIGNATURE_CONFIG.apiSecret || !CLOUDINARY_SIGNATURE_CONFIG.cloudName) {
    return res.status(500).json({
      error: 'Cloudinary signature service is not configured on backend.',
    })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = typeof req.body?.folder === 'string' ? req.body.folder.trim() : ''
  const publicId = typeof req.body?.public_id === 'string' ? req.body.public_id.trim() : ''
  const paramsToSign = {
    ...(folder ? { folder } : {}),
    ...(publicId ? { public_id: publicId } : {}),
    timestamp,
  }
  const signature = signCloudinaryParams(paramsToSign, CLOUDINARY_SIGNATURE_CONFIG.apiSecret)

  return res.json({
    api_key: CLOUDINARY_SIGNATURE_CONFIG.apiKey,
    timestamp,
    signature,
    ...(folder ? { folder } : {}),
    ...(publicId ? { public_id: publicId } : {}),
  })
})

app.post('/cloudinary/open-url', (req, res) => {
  const { role } = getAuthContextUser()
  if (!role) return res.status(401).json({ error: 'Not authenticated' })

  if (!CLOUDINARY_SIGNATURE_CONFIG.apiKey || !CLOUDINARY_SIGNATURE_CONFIG.apiSecret || !CLOUDINARY_SIGNATURE_CONFIG.cloudName) {
    return res.status(500).json({
      error: 'Cloudinary signature service is not configured on backend.',
    })
  }

  const rawUrl = String(req.body?.url || '').trim()
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing document url' })
  }

  const parsedAsset = parseCloudinaryAssetDeliveryUrl(rawUrl)
  if (!parsedAsset) {
    return res.status(400).json({ error: 'Invalid Cloudinary delivery url' })
  }

  if (parsedAsset.cloudName !== CLOUDINARY_SIGNATURE_CONFIG.cloudName) {
    return res.status(400).json({ error: 'Cloudinary cloud name mismatch' })
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

  const signature = signCloudinaryParams(paramsToSign, CLOUDINARY_SIGNATURE_CONFIG.apiSecret)
  const query = new URLSearchParams({
    ...Object.fromEntries(
      Object.entries(paramsToSign).map(([key, value]) => [key, String(value)])
    ),
    api_key: CLOUDINARY_SIGNATURE_CONFIG.apiKey,
    signature,
  })

  const signedUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_SIGNATURE_CONFIG.cloudName}/${parsedAsset.resourceType}/download?${query.toString()}`

  return res.json({
    url: signedUrl,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  })
})

// Blocked IP protection
app.use((req, res, next) => {
  const ip = getClientIp(req)
  if (!ip || isLocalIp(ip)) return next?.()
  if (!isBlockedIp(ip)) return next?.()
  appendAuditLog({
    actorId: 'system',
    action: 'BLOCKED_IP_HIT',
    targetType: 'ip',
    targetId: ip,
    message: `Requête bloquée depuis IP ${ip}`,
    ipAddress: ip,
  })
  return res.status(403).json({ error: 'Adresse IP bloquée pour raisons de sécurité.' })
})

function isWriteMethod(method = '') {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(String(method || '').toUpperCase())
}

function isMaintenanceAllowedPath(path = '') {
  const normalized = String(path || '').split('?')[0]
  if (normalized === '/auth' || normalized.startsWith('/auth/')) return true
  if (normalized === '/authContext' || normalized.startsWith('/authContext/')) return true
  if (normalized === '/settings' || normalized.startsWith('/settings/')) return true
  if (normalized === '/audit_logs' || normalized.startsWith('/audit_logs/')) return true
  if (normalized === '/undo-actions' || normalized.startsWith('/undo-actions/')) return true
  if (normalized === '/sign') return true
  if (normalized === '/cloudinary/open-url') return true
  if (normalized.startsWith('/admin_payments/webhook/')) return true
  return false
}

app.use((req, res, next) => {
  if (!isWriteMethod(req.method || '')) return next?.()
  const policy = parseSystemPolicy()
  if (!policy.maintenance?.enabled) return next?.()
  const path = String(req.path || req.url || '')
  if (isMaintenanceAllowedPath(path)) return next?.()
  return res.status(503).json({
    error: policy.maintenance.message || 'Maintenance en cours. Actions d’écriture indisponibles.',
    code: 'MAINTENANCE_MODE',
  })
})

app.use(async (req, res, next) => {
  try {
    await applyRetentionPolicies()
  } catch {
    // ignore retention sweep failures
  }
  next?.()
})

// Minimal auth endpoint
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' })
  }
  const users = Array.isArray(db.data?.users) ? db.data.users : []
  const user = findUserByLogin(users, username, password)
  if (!user) {
    const pending = findPendingAdminRequestByPhone(db.data, username, password)
    if (pending) {
      return res.status(403).json({ error: "Demande en attente d'approbation" })
    }
    const ip = getClientIp(req)
    appendAuditLog({
      actorId: 'anonymous',
      action: 'FAILED_LOGIN',
      targetType: 'auth',
      targetId: normalizePhone(username) || String(username),
      message: 'Tentative de connexion échouée',
      ipAddress: ip,
    })
    if (ip && !isLocalIp(ip)) {
      const policy = parseSystemPolicy()
      const threshold = Math.max(1, Number(policy.sessionSecurity?.maxFailedLogins || FAILED_LOGIN_THRESHOLD))
      const windowMs = Math.max(1, Number(policy.sessionSecurity?.lockoutMinutes || 60)) * 60 * 1000
      const failures = getFailedLoginCount(ip, windowMs)
      if (failures >= threshold && !isBlockedIp(ip)) {
        blockIp(ip, `Trop de tentatives (${failures})`)
        appendAuditLog({
          actorId: 'system',
          action: 'IP_BLOCKED',
          targetType: 'ip',
          targetId: ip,
          message: `IP bloquée automatiquement après ${failures} échecs`,
          ipAddress: ip,
        })
        notifySuperAdmins('SECURITY_ALERT', `IP bloquée automatiquement après ${failures} échecs: ${ip}`)
      }
    }
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const role = String(user.role || '').toUpperCase()
  const status = String(user.status || '').toUpperCase()
  if (role === 'ADMIN') {
    if (status !== 'ACTIF') {
      return res.status(403).json({ error: 'Accès interdit. Décision du Super Admin.' })
    }
    const admins = Array.isArray(db.data?.admins) ? db.data.admins : []
    const admin = admins.find((a) => a.id === user.id)
    if (!admin) {
      return res.status(403).json({ error: 'Accès interdit. Décision du Super Admin.' })
    }
  }
  const safeUser = enrichAuthUserWithSubscription({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  })
  sessions.length = 0
  sessions.push({ id: 'session-current', userId: user.id, createdAt: new Date().toISOString() })
  clearSuperAdminSecondAuth()
  return res.json({ user: safeUser })
})

// Pending check: returns pending when credentials match a pending admin
app.post('/auth/pending-check', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ pending: false })
  }
  const pending = findPendingAdminRequestByPhone(db.data, username, password)
  return res.json({ pending: !!pending })
})

// AuthContext simulated API (frontend consumes this)
app.get('/authContext', (req, res) => {
  const ctx = authContext
  if (!ctx.userId) return res.json({ user: null, impersonation: null })
  const users = Array.isArray(db.data?.users) ? db.data.users : []
  const user = users.find((u) => u.id === ctx.userId)
  const role = String(user?.role || '').toUpperCase()
  const status = String(user?.status || '').toUpperCase()
  if (user && role === 'ADMIN') {
    const admins = Array.isArray(db.data?.admins) ? db.data.admins : []
    const admin = admins.find((a) => a.id === user.id)
    if (status !== 'ACTIF' || !admin) {
      authContext.userId = null
      authContext.impersonation = null
      authContext.updatedAt = new Date().toISOString()
      clearSuperAdminSecondAuth()
      return res.status(403).json({ error: 'Accès interdit. Décision du Super Admin.' })
    }
  }
  const safeUser = user
    ? enrichAuthUserWithSubscription({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      })
    : null
  return res.json({ user: safeUser, impersonation: ctx.impersonation || null })
})

app.post('/authContext/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' })
  const users = Array.isArray(db.data?.users) ? db.data.users : []
  const user = findUserByLogin(users, username, password)
  if (!user) {
    const pending = findPendingAdminRequestByPhone(db.data, username, password)
    if (pending) {
      return res.status(403).json({ error: "Demande en attente d'approbation" })
    }
    const ip = getClientIp(req)
    appendAuditLog({
      actorId: 'anonymous',
      action: 'FAILED_LOGIN',
      targetType: 'auth',
      targetId: normalizePhone(username) || String(username),
      message: 'Tentative de connexion échouée',
      ipAddress: ip,
    })
    if (ip && !isLocalIp(ip)) {
      const policy = parseSystemPolicy()
      const threshold = Math.max(1, Number(policy.sessionSecurity?.maxFailedLogins || FAILED_LOGIN_THRESHOLD))
      const windowMs = Math.max(1, Number(policy.sessionSecurity?.lockoutMinutes || 60)) * 60 * 1000
      const failures = getFailedLoginCount(ip, windowMs)
      if (failures >= threshold && !isBlockedIp(ip)) {
        blockIp(ip, `Trop de tentatives (${failures})`)
        appendAuditLog({
          actorId: 'system',
          action: 'IP_BLOCKED',
          targetType: 'ip',
          targetId: ip,
          message: `IP bloquée automatiquement après ${failures} échecs`,
          ipAddress: ip,
        })
        notifySuperAdmins('SECURITY_ALERT', `IP bloquée automatiquement après ${failures} échecs: ${ip}`)
      }
    }
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const role = String(user.role || '').toUpperCase()
  const status = String(user.status || '').toUpperCase()
  if (role === 'ADMIN') {
    if (status !== 'ACTIF') {
      return res.status(403).json({ error: "Demande en attente d'approbation" })
    }
    const admins = Array.isArray(db.data?.admins) ? db.data.admins : []
    const admin = admins.find((a) => a.id === user.id)
    const adminStatus = String(admin?.status || '').toUpperCase()
    if (!admin) {
      return res.status(403).json({ error: "Demande en attente d'approbation" })
    }
    if (adminStatus && adminStatus !== 'ACTIF') {
      return res.status(403).json({ error: "Demande en attente d'approbation" })
    }
  }
  authContext.userId = user.id
  authContext.impersonation = null
  authContext.updatedAt = new Date().toISOString()
  clearSuperAdminSecondAuth()
  return res.json({
    user: enrichAuthUserWithSubscription({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    }),
    impersonation: null,
  })
})

app.post('/authContext/super-admin/second-auth', async (req, res) => {
  const ctx = authContext
  if (!ctx.userId) return res.status(401).json({ error: 'Not authenticated' })

  const password = String(req.body?.password || '')
  if (!password) return res.status(400).json({ error: 'Missing password' })

  const users = Array.isArray(db.data?.users) ? db.data.users : []
  const user = users.find((entry) => String(entry?.id || '') === String(ctx.userId || '')) || null
  const role = String(user?.role || '').toUpperCase()

  if (!user || role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Accès réservé au Super Admin.' })
  }

  if (String(user.password || '') !== password) {
    appendAuditLog({
      actorId: user.id,
      action: 'SUPER_ADMIN_SECOND_AUTH_FAILED',
      targetType: 'auth',
      targetId: user.id,
      message: 'Échec de seconde authentification Super Admin',
      ipAddress: getClientIp(req),
    })
    return res.status(401).json({ error: 'Mot de passe invalide.' })
  }

  authContext.superAdminSecondAuthAt = new Date().toISOString()
  authContext.updatedAt = new Date().toISOString()

  appendAuditLog({
    actorId: user.id,
    action: 'SUPER_ADMIN_SECOND_AUTH_SUCCESS',
    targetType: 'auth',
    targetId: user.id,
    message: 'Seconde authentification Super Admin validée',
    ipAddress: getClientIp(req),
  })
  await db.write()

  return res.json({
    ok: true,
    user: enrichAuthUserWithSubscription({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    }),
    impersonation: authContext.impersonation || null,
  })
})

app.post('/authContext/logout', async (req, res) => {
  authContext.userId = null
  authContext.impersonation = null
  authContext.updatedAt = new Date().toISOString()
  clearSuperAdminSecondAuth()
  return res.json({ ok: true })
})

app.post('/authContext/impersonate', async (req, res) => {
  const { adminId, adminName, userId } = req.body || {}
  if (!adminId || !adminName) return res.status(400).json({ error: 'Missing admin' })
  const { user, role } = getAuthContextUser()
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  if (String(role || '').toUpperCase() === 'SUPER_ADMIN' && !isSuperAdminSecondAuthValid(user.id)) {
    return res.status(403).json({ error: 'Seconde authentification Super Admin requise.' })
  }
  authContext.impersonation = { adminId, adminName, userId: userId || null }
  authContext.updatedAt = new Date().toISOString()
  return res.json({ ok: true })
})

app.post('/authContext/clear-impersonation', async (req, res) => {
  const { user, role } = getAuthContextUser()
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  if (String(role || '').toUpperCase() === 'SUPER_ADMIN' && !isSuperAdminSecondAuthValid(user.id)) {
    return res.status(403).json({ error: 'Seconde authentification Super Admin requise.' })
  }
  authContext.impersonation = null
  authContext.updatedAt = new Date().toISOString()
  return res.json({ ok: true })
})

app.delete('/blocked_ips/:id', async (req, res) => {
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'Missing id' })
  const removed = unblockIpById(id)
  if (!removed) return res.status(404).json({ error: 'Not found' })
  const { user: actor } = getAuthContextUser()
  appendAuditLog({
    actorId: actor?.id,
    action: 'IP_UNBLOCKED',
    targetType: 'ip',
    targetId: removed.ip,
    message: `IP débloquée: ${removed.ip}`,
    ipAddress: getClientIp(req),
  })
  notifySuperAdmins('SECURITY_ALERT', `IP débloquée manuellement: ${removed.ip}`)
  await db.write()
  return res.json({ ok: true })
})

app.post('/blocked_ips', async (req, res) => {
  const { user, role } = getAuthContextUser()
  if (!user || role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Access forbidden' })
  const ip = String(req.body?.ip || '').trim()
  const reason = String(req.body?.reason || '').trim()
  if (!ip) return res.status(400).json({ error: 'Missing ip' })
  const entry = blockIp(ip, reason || 'Blocage manuel')
  appendAuditLog({
    actorId: user.id,
    action: 'IP_BLOCKED',
    targetType: 'ip',
    targetId: ip,
    message: `IP bloquée manuellement: ${ip}`,
    ipAddress: getClientIp(req),
  })
  notifySuperAdmins('SECURITY_ALERT', `IP bloquée manuellement: ${ip}`)
  await db.write()
  return res.status(201).json(entry)
})

app.get('/auth/session', async (req, res) => {
  const session = sessions[0]
  if (!session) {
    return res.status(401).json({ error: 'No active session' })
  }
  const users = Array.isArray(db.data?.users) ? db.data.users : []
  const user = users.find((u) => u.id === session.userId)
  if (!user) {
    return res.status(401).json({ error: 'Session user not found' })
  }
  const role = String(user.role || '').toUpperCase()
  const status = String(user.status || '').toUpperCase()
  if (role === 'ADMIN') {
    const admins = Array.isArray(db.data?.admins) ? db.data.admins : []
    const admin = admins.find((a) => a.id === user.id)
    if (status !== 'ACTIF' || !admin) {
      sessions.length = 0
      return res.status(403).json({ error: 'Accès interdit. Décision du Super Admin.' })
    }
  }
  const safeUser = enrichAuthUserWithSubscription({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  })
  return res.json({ user: safeUser })
})

app.post('/auth/logout', async (req, res) => {
  sessions.length = 0
  clearSuperAdminSecondAuth()
  return res.json({ ok: true })
})

app.get('/admin_payments/status', async (req, res) => {
  const { role, adminId } = getAuthContextUser()
  if (!role) return res.status(401).json({ error: 'Not authenticated' })

  const queryAdminId = String(req.query.adminId || '').trim()
  const targetAdminId = String(role).toUpperCase() === 'ADMIN' ? adminId : queryAdminId
  if (!targetAdminId) return res.status(400).json({ error: 'Admin manquant' })

  const status = getAdminSubscriptionStatus(targetAdminId)
  const policy = parseSystemPolicy()
  const graceDays = Math.max(0, Number(policy.paymentRules?.graceDays || ADMIN_SUBSCRIPTION_GRACE_DAYS))
  return res.json({
    adminId: targetAdminId,
    blocked: status.blocked,
    overdueMonth: status.overdueMonth,
    dueAt: status.dueAt,
    requiredMonth: status.requiredMonth,
    currentMonth: toMonthKey(new Date()),
    graceDays,
  })
})

app.post('/admin_payments/webhook/:provider?', async (req, res) => {
  const providerName = normalizeProviderName(req.params?.provider || PAYMENT_PROVIDER_NAME)
  let service
  try {
    service = createPaymentService(providerName)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provider invalide'
    return res.status(400).json({ error: message })
  }

  const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
  const signatureHeader =
    providerName === 'stripe'
      ? String(req.headers['stripe-signature'] || req.headers['x-signature'] || '')
      : String(req.headers['x-signature'] || req.headers['x-webhook-signature'] || '')

  if (!service.verifyWebhook(payload, signatureHeader)) {
    return res.status(401).json({ error: 'Signature webhook invalide.' })
  }

  const event = service.parseWebhookEvent(req.body || {})
  if (!event?.paid) {
    return res.json({ ok: true, ignored: true })
  }

  const payments = Array.isArray(db.data?.admin_payments) ? db.data.admin_payments : []
  let payment =
    (event.paymentId && payments.find((item) => String(item?.id || '') === String(event.paymentId))) ||
    null

  if (!payment && event.externalId) {
    payment = payments.find((item) => String(item?.providerReference || '') === String(event.externalId)) || null
  }

  if (!payment && event.adminId && event.month) {
    payment =
      payments.find(
        (item) =>
          String(item?.adminId || '') === String(event.adminId) &&
          String(getPaymentMonthKey(item)) === String(event.month) &&
          normalizeAdminPaymentStatus(item?.status || '') !== 'paid'
      ) || null
  }

  if (!payment) {
    return res.status(404).json({ error: 'Paiement admin introuvable pour ce webhook.' })
  }

  const nowIso = new Date().toISOString()
  payment.status = 'paid'
  payment.provider = providerName
  payment.providerReference = event.externalId || payment.providerReference || ''
  payment.paidAt = payment.paidAt || nowIso
  payment.approvedAt = nowIso
  payment.approvedBy = 'provider_webhook'
  payment.updatedAt = nowIso

  const admins = Array.isArray(db.data?.admins) ? db.data.admins : []
  const admin = admins.find((item) => String(item?.id || '') === String(payment.adminId || ''))
  if (admin) {
    admin.paid = true
    admin.paidAt = payment.paidAt
  }

  appendAuditLog({
    actorId: 'provider_webhook',
    action: 'ADMIN_PAYMENT_CONFIRMED',
    targetType: 'admin_payment',
    targetId: payment.id,
    message: `Paiement admin confirmé via ${providerName}`,
  })

  await db.write()
  return res.json({ ok: true, paymentId: payment.id, status: payment.status })
})

app.use((req, res, next) => {
  const path = String(req.path || req.url || '')
  if (isSecondAuthExemptPath(path)) return next?.()

  const { user, role, adminId } = getAuthContextUser()
  if (String(role || '').toUpperCase() !== 'SUPER_ADMIN' || adminId) return next?.()
  if (isSuperAdminSecondAuthValid(user?.id)) return next?.()

  return res.status(403).json({
    error: 'Seconde authentification Super Admin requise.',
    code: 'SUPER_ADMIN_SECOND_AUTH_REQUIRED',
  })
})

app.use((req, res, next) => {
  const path = String(req.path || req.url || '')
  if (isSubscriptionAllowedPath(path)) return next?.()

  const { role, adminId } = getAuthContextUser()
  if (String(role || '').toUpperCase() !== 'ADMIN' || !adminId) return next?.()
  const policy = parseSystemPolicy()
  const blockOnOverdue =
    typeof policy.paymentRules?.blockOnOverdue === 'boolean' ? policy.paymentRules.blockOnOverdue : true
  if (!blockOnOverdue) return next?.()

  const subscriptionStatus = getAdminSubscriptionStatus(adminId)
  if (!subscriptionStatus.blocked) return next?.()

  return res.status(402).json({
    error: `Abonnement mensuel impayé (${subscriptionStatus.overdueMonth}). Paiement requis avant déblocage.`,
    code: 'ADMIN_SUBSCRIPTION_BLOCKED',
    overdueMonth: subscriptionStatus.overdueMonth,
    dueAt: subscriptionStatus.dueAt,
    requiredMonth: subscriptionStatus.requiredMonth,
  })
})

app.get('/undo-actions', async (req, res) => {
  const { user, role } = getAuthContextUser()
  if (!user || !role) return res.status(401).json({ error: 'Not authenticated' })

  const limitRaw = Number(req.query.limit ?? req.query._limit ?? 10)
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 10

  const actions = Array.isArray(db.data?.undo_actions) ? db.data.undo_actions : []
  const cleaned = cleanUndoActions(actions)
  if (cleaned.length !== actions.length) {
    db.data.undo_actions = cleaned
    await db.write()
  }

  const visible = (role === 'SUPER_ADMIN' ? cleaned : cleaned.filter((entry) => entry.actorId === user.id))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id,
      resource: entry.resource,
      resourceId: entry.resourceId,
      method: entry.method,
      actorId: entry.actorId,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      path: entry.path,
    }))

  return res.json(visible)
})

app.post('/undo-actions/:id/rollback', async (req, res) => {
  const { user, role } = getAuthContextUser()
  if (!user || !role) return res.status(401).json({ error: 'Not authenticated' })

  const undoId = String(req.params?.id || '').trim()
  if (!undoId) return res.status(400).json({ error: 'ID de rollback manquant.' })

  const actions = Array.isArray(db.data?.undo_actions) ? db.data.undo_actions : []
  const entry = actions.find((item) => item.id === undoId)
  if (!entry) return res.status(404).json({ error: 'Action rollback introuvable.' })

  if (role !== 'SUPER_ADMIN' && entry.actorId !== user.id) {
    return res.status(403).json({ error: 'Rollback non autorisé pour cette action.' })
  }

  if (isUndoExpired(entry)) {
    return res.status(410).json({ error: 'Rollback expiré: action trop ancienne (plus de 2 mois).' })
  }

  const resolvedEntry = resolveRollbackEntry(entry)
  if (!resolvedEntry) {
    return res.status(422).json({ error: "Cette action ne peut pas être annulée." })
  }

  const applyResult = applyRollbackPlan(resolvedEntry)
  if (!applyResult.ok) {
    return res.status(422).json({ error: applyResult.error || 'Rollback impossible.' })
  }

  const remainingUndoActions = cleanUndoActions(actions.filter((item) => item.id !== undoId))
  db.data.undo_actions = remainingUndoActions

  appendAuditLog({
    actorId: user.id,
    action: 'UNDO_ROLLBACK',
    targetType: entry.resource || 'resource',
    targetId: entry.resourceId || undoId,
    message: `Rollback effectué pour ${entry.method || 'ACTION'} ${entry.resource || ''}`,
    ipAddress: getClientIp(req),
  })

  await db.write()
  return res.json({ ok: true, rolledBackId: undoId })
})

// CRUD routes (based on json-server v1 app)
app.get('/:name', (req, res, next) => {
  const { name = '' } = req.params
  const query = {}
  Object.keys(req.query).forEach((key) => {
    let value = req.query[key]
    if (['_start', '_end', '_limit', '_page', '_per_page'].includes(key) && typeof value === 'string') {
      value = parseInt(value, 10)
    }
    if (!Number.isNaN(value)) {
      query[key] = value
    }
  })
  let data = service.find(name, query)
  if (name === 'admin_requests') {
    const users = Array.isArray(db.data?.users) ? db.data.users : []
    data = users
      .filter((u) => String(u.role || '').toUpperCase() === 'ADMIN' && String(u.status || '').toUpperCase() === 'EN_ATTENTE')
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        entrepriseName: u.entrepriseName || '',
        status: u.status || 'EN_ATTENTE',
        username: u.username,
        password: u.password,
        paid: u.paid || false,
        paidAt: u.paidAt || null,
        createdAt: u.createdAt,
      }))
  } else if (name === 'admin_payments') {
    const { role, adminId } = getAuthContextUser()
    const payments = Array.isArray(db.data?.admin_payments) ? db.data.admin_payments : []
    let filtered = payments
    if (!role) {
      filtered = []
    } else if (role === 'ADMIN' || adminId) {
      filtered = payments.filter((payment) => payment.adminId === adminId)
    }
    data = [...filtered]
      .map((payment) => ({
        ...payment,
        month: getPaymentMonthKey(payment),
        method: normalizePaymentMethod(payment.method) || 'cash',
        status: normalizeAdminPaymentStatus(payment.status),
        provider: normalizeProviderName(payment.provider || (payment.method === 'cash' ? 'manual' : PAYMENT_PROVIDER_NAME)),
      }))
      .sort((a, b) => String(b.paidAt || b.createdAt || '').localeCompare(String(a.paidAt || a.createdAt || '')))
  } else if (name === 'import_runs') {
    const { role, adminId } = getAuthContextUser()
    const runs = Array.isArray(db.data?.import_runs) ? db.data.import_runs : []
    let filtered = []
    if (!role) {
      filtered = []
    } else if (role === 'SUPER_ADMIN' && !adminId) {
      filtered = runs
    } else {
      filtered = runs.filter((run) => String(run?.adminId || '') === String(adminId || ''))
    }
    data = [...filtered]
      .map((run) => normalizeImportRunRecord(run))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  } else if (name === 'entreprises') {
    const admins = Array.isArray(db.data?.admins) ? db.data.admins : []
    const entreprises = Array.isArray(db.data?.entreprises) ? db.data.entreprises : []
    const unique = new Map()
    entreprises.forEach((ent) => {
      const key = String(ent.name || ent.id || '').trim()
      if (!key) return
      if (!unique.has(key)) unique.set(key, { id: ent.id || key, name: ent.name || key, adminId: ent.adminId })
    })
    admins.forEach((a) => {
      const key = String(a.entrepriseId || '').trim()
      if (!key) return
      if (!unique.has(key)) unique.set(key, { id: key, name: key, adminId: a.id })
    })
    data = Array.from(unique.values())
  } else if (name === 'admins') {
    const admins = Array.isArray(db.data?.admins) ? db.data.admins : []
    const users = Array.isArray(db.data?.users) ? db.data.users : []
    data = admins.map((a) => buildAdminView(a, users))
  } else if (name === 'clients') {
    const { role, adminId } = getAuthContextUser()
    const clients = Array.isArray(db.data?.clients) ? db.data.clients : []
    const adminClients = Array.isArray(db.data?.admin_clients) ? db.data.admin_clients : []
    const rentals = Array.isArray(db.data?.rentals) ? db.data.rentals : []
    const users = Array.isArray(db.data?.users) ? db.data.users : []
    const rentalsByClient = new Map()
    rentals.forEach((r) => {
      if (!rentalsByClient.has(r.clientId)) rentalsByClient.set(r.clientId, [])
      rentalsByClient.get(r.clientId).push(r)
    })

    let filtered = clients
    if (!role) {
      filtered = []
    } else if (role === 'SUPER_ADMIN' && !adminId) {
      // no filter
    } else {
      const allowed = new Set(getAdminClientIds(adminId, adminClients))
      filtered = clients.filter((c) => allowed.has(c.id))
    }
    data = filtered.map((c) => buildClientView(c, users, rentalsByClient, adminId || undefined))
  } else if (name === 'notifications') {
    const notes = Array.isArray(db.data?.notifications) ? db.data.notifications : []
    const userId = typeof req.query.user_id === 'string' ? req.query.user_id : ''
    let filtered = notes
    if (userId) {
      filtered = notes.filter((n) => String(n.user_id || '') === userId)
    }
    data = [...filtered].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  } else if (name === 'audit_logs') {
    const logs = Array.isArray(db.data?.audit_logs) ? db.data.audit_logs : []
    data = [...logs].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  } else if (name === 'blocked_ips') {
    const blocked = Array.isArray(db.data?.blocked_ips) ? db.data.blocked_ips : []
    data = [...blocked].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  }
  if (data === undefined) {
    if (['settings', 'import_runs', 'import_errors', 'documents'].includes(name)) {
      data = []
    }
  }
  res.locals.data = data
  next?.()
})

app.get('/:name/:id', (req, res, next) => {
  const { name = '', id = '' } = req.params
  let data = service.findById(name, id, req.query)
  if (name === 'admin_requests') {
    const users = Array.isArray(db.data?.users) ? db.data.users : []
    const user = users.find((u) => u.id === id && String(u.role || '').toUpperCase() === 'ADMIN')
    if (!user) return res.status(404).json({ error: 'Not found' })
    data = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      entrepriseName: user.entrepriseName || '',
      status: user.status || 'EN_ATTENTE',
      username: user.username,
      password: user.password,
      paid: user.paid || false,
      paidAt: user.paidAt || null,
      createdAt: user.createdAt,
    }
  } else if (name === 'import_runs') {
    const { role, adminId } = getAuthContextUser()
    if (!role) return res.status(401).json({ error: 'Not authenticated' })

    const runs = Array.isArray(db.data?.import_runs) ? db.data.import_runs : []
    const run = runs.find((item) => String(item?.id || '') === String(id || ''))
    if (!run) return res.status(404).json({ error: 'Not found' })
    if (!canAccessImportRun(run, role, adminId)) {
      return res.status(403).json({ error: 'Access forbidden' })
    }
    data = normalizeImportRunRecord(run)
  } else if (name === 'clients') {
    const { role, adminId } = getAuthContextUser()
    if (!role) return res.status(401).json({ error: 'Not authenticated' })
    const clients = Array.isArray(db.data?.clients) ? db.data.clients : []
    const client = clients.find((c) => c.id === id)
    if (!client) return res.status(404).json({ error: 'Not found' })
    const adminClients = Array.isArray(db.data?.admin_clients) ? db.data.admin_clients : []
    if (role !== 'SUPER_ADMIN' || adminId) {
      const allowed = new Set(getAdminClientIds(adminId, adminClients))
      if (!allowed.has(id)) return res.status(403).json({ error: 'Access forbidden' })
    }
    const users = Array.isArray(db.data?.users) ? db.data.users : []
    const rentals = Array.isArray(db.data?.rentals) ? db.data.rentals : []
    const rentalsByClient = new Map()
    rentals.forEach((r) => {
      if (!rentalsByClient.has(r.clientId)) rentalsByClient.set(r.clientId, [])
      rentalsByClient.get(r.clientId).push(r)
    })
    data = buildClientView(client, users, rentalsByClient, adminId || undefined)
  }
  res.locals.data = data
  next?.()
})

app.post('/:name', async (req, res, next) => {
  const { name = '' } = req.params
  if (isItem(req.body)) {
    const beforeState = createUndoSnapshot(db.data)
    if (name === 'import_runs') {
      const { role, adminId } = getAuthContextUser()
      if (!role) return res.status(401).json({ error: 'Not authenticated' })

      const ownerAdminId = resolveImportRunOwnerAdminId(role, adminId, req.body)
      if (!ownerAdminId) {
        return res.status(400).json({ error: 'Admin manquant pour cet import.' })
      }

      const now = new Date().toISOString()
      const normalized = normalizeImportRunRecord({
        ...req.body,
        id: req.body.id || `imprun-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        adminId: ownerAdminId,
        createdAt: req.body.createdAt || now,
        updatedAt: now,
      })

      res.locals.data = await service.create(name, normalized)
      registerUndoAction(req, res, {
        resource: name,
        resourceId: res.locals?.data?.id || normalized.id,
        method: 'POST',
        beforeState,
      })
      await db.write()
      return next?.()
    }

    if (name === 'clients') {
      const { role, adminId } = getAuthContextUser()
      if (!role) return res.status(401).json({ error: 'Not authenticated' })
      if (hasDuplicateClient(db.data, req.body)) {
        return res.status(409).json({ error: 'Client existe déjà avec ce numéro ou cet email pour cet admin.' })
      }
      const clientId = req.body.id || `client-${Date.now().toString(36)}`
      req.body.id = clientId
      // Create user for client if missing
      const users = Array.isArray(db.data?.users) ? db.data.users : []
      const existingUser = users.find((u) => u.id === clientId)
      if (!existingUser) {
        users.push({
          id: clientId,
          username: req.body.username || clientId,
          password: req.body.password || 'client123',
          name: `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim(),
          email: req.body.email || '',
          phone: req.body.phone || '',
          role: 'CLIENT',
          status: req.body.status || 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
      // Link admin to client
      if (adminId) {
        const links = Array.isArray(db.data?.admin_clients) ? db.data.admin_clients : []
        links.push({ adminId, clientId, createdAt: new Date().toISOString() })
      }
    }
    if (name === 'admin_requests') {
      const users = Array.isArray(db.data?.users) ? db.data.users : []
      const notifications = Array.isArray(db.data?.notifications) ? db.data.notifications : []
      const conflict = hasDuplicateUser(db.data, req.body)
      if (conflict) return res.status(409).json({ error: conflict })
      const id = req.body.id || `user-${Date.now().toString(36)}`
      const createdAt = new Date().toISOString()
      users.push({
        id,
        username: req.body.username || id,
        password: req.body.password || 'admin123',
        name: req.body.name || '',
        email: req.body.email || '',
        phone: req.body.phone || '',
        role: 'ADMIN',
        status: 'EN_ATTENTE',
        entrepriseName: req.body.entrepriseName || '',
        paid: req.body.paid || false,
        paidAt: req.body.paidAt || null,
        createdAt,
        updatedAt: createdAt,
      })
      res.locals.data = {
        id,
        name: req.body.name || '',
        email: req.body.email || '',
        phone: req.body.phone || '',
        entrepriseName: req.body.entrepriseName || '',
        status: 'EN_ATTENTE',
        username: req.body.username || id,
        password: req.body.password || 'admin123',
        paid: req.body.paid || false,
        paidAt: req.body.paidAt || null,
        createdAt,
      }
      const superAdmins = users.filter((u) => String(u.role || '').toUpperCase() === 'SUPER_ADMIN')
      superAdmins.forEach((sa) => {
        notifications.push({
          id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          user_id: sa.id,
          type: 'ADMIN_REQUEST',
          message: `Nouvelle demande admin: ${req.body.name || 'Nouvel admin'} (${req.body.phone || 'sans téléphone'})`,
          is_read: false,
          created_at: createdAt,
        })
      })
      const { user: actor } = getAuthContextUser()
      appendAuditLog({
        actorId: actor?.id,
        action: 'ADMIN_REQUEST_CREATE',
        targetType: 'admin_request',
        targetId: id,
        message: `Nouvelle demande admin: ${req.body.name || 'Nouvel admin'}`,
      })
      registerUndoAction(req, res, {
        resource: name,
        resourceId: id,
        method: 'POST',
        beforeState,
      })
      await db.write()
      return next?.()
    }
    if (name === 'admin_payments') {
      const { role, adminId, user: actor } = getAuthContextUser()
      if (!role) return res.status(401).json({ error: 'Not authenticated' })
      const targetAdminId = role === 'ADMIN' ? adminId : req.body.adminId
      if (!targetAdminId) return res.status(400).json({ error: 'Admin manquant' })

      const subscriptionStatus = getAdminSubscriptionStatus(targetAdminId)
      const now = new Date().toISOString()
      const paidAt = req.body.paidAt || now
      const paidMonth = getPaymentMonthKey({ month: req.body.month, paidAt })
      const month = subscriptionStatus.blocked ? subscriptionStatus.requiredMonth : paidMonth
      if (subscriptionStatus.blocked && month !== subscriptionStatus.requiredMonth) {
        return res.status(409).json({
          error: `Paiement requis pour ${subscriptionStatus.requiredMonth} avant tout autre mois.`,
        })
      }

      const paymentMethod = normalizePaymentMethod(req.body.method)
      if (!paymentMethod) {
        return res.status(400).json({ error: 'Méthode de paiement invalide (wave, orange_money, cash).' })
      }
      if (role === 'SUPER_ADMIN' && paymentMethod !== 'cash') {
        return res.status(403).json({
          error: 'Super Admin: seul le paiement espèces est autorisé.',
        })
      }
      if (paymentMethod === 'cash' && role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          error: "Paiement espèces: validation réservée au Super Admin.",
        })
      }

      const existingPayments = Array.isArray(db.data?.admin_payments) ? db.data.admin_payments : []
      const duplicate = existingPayments.find(
        (item) =>
          String(item?.adminId || '') === String(targetAdminId) &&
          String(getPaymentMonthKey(item)) === String(month) &&
          ADMIN_PAYMENT_ACTIVE_STATUSES.has(normalizeAdminPaymentStatus(item?.status || ''))
      )
      if (duplicate) {
        return res.status(409).json({ error: `Le mois ${month} est déjà payé.` })
      }

      const amount = Number(req.body.amount || 0)
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Montant de paiement invalide.' })
      }

      const paymentId = req.body.id || `adminpay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      let paymentStatus = 'paid'
      const requestedProvider = normalizeProviderName(req.body.provider || '')
      let provider = requestedProvider || getProviderForPaymentMethod(paymentMethod, PAYMENT_PROVIDER_NAME)
      if (paymentMethod === 'cash') {
        provider = 'manual'
      } else if (!provider || provider === 'manual') {
        provider = getProviderForPaymentMethod(paymentMethod, PAYMENT_PROVIDER_NAME)
      }
      let providerReference = req.body.transactionRef ? String(req.body.transactionRef).trim() : ''
      let checkoutUrl = ''
      let providerPayload = null
      let effectivePaidAt = paidAt
      let approvedAt = now
      let approvedBy = actor?.id || null

      if (MOBILE_PAYMENT_METHODS.has(paymentMethod)) {
        try {
          const paymentService = createPaymentService(provider)
          const baseUrl = getPublicBaseUrl(req)
          const initiation = await paymentService.initiate({
            amount,
            currency: 'xof',
            payerPhone: req.body.payerPhone ? String(req.body.payerPhone).trim() : '',
            successUrl: `${baseUrl}/subscription?payment=success&month=${encodeURIComponent(month)}`,
            cancelUrl: `${baseUrl}/subscription?payment=cancel&month=${encodeURIComponent(month)}`,
            webhookUrl: `${baseUrl}/admin_payments/webhook/${paymentService.name}`,
            metadata: {
              adminPaymentId: paymentId,
              adminId: targetAdminId,
              month,
              method: paymentMethod,
            },
          })

          provider = normalizeProviderName(initiation?.provider || provider || PAYMENT_PROVIDER_NAME)
          providerReference = String(initiation?.externalId || providerReference || '')
          checkoutUrl = String(initiation?.checkoutUrl || '')
          providerPayload = initiation?.raw || null
          const normalizedStatus = normalizeAdminPaymentStatus(initiation?.status || '')
          const isConfirmed = normalizedStatus === 'paid'
          paymentStatus = isConfirmed ? 'paid' : 'pending'
          effectivePaidAt = isConfirmed ? paidAt : null
          approvedAt = isConfirmed ? now : null
          approvedBy = isConfirmed ? 'provider_auto' : null
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Échec de l’initiation du paiement provider.'
          return res.status(502).json({ error: message })
        }
      }

      const payment = {
        id: paymentId,
        adminId: targetAdminId,
        entrepriseId: req.body.entrepriseId || '',
        amount,
        paidAt: effectivePaidAt,
        month,
        method: paymentMethod,
        status: paymentStatus,
        provider,
        providerReference,
        checkoutUrl,
        payerPhone: req.body.payerPhone ? String(req.body.payerPhone).trim() : '',
        transactionRef: req.body.transactionRef ? String(req.body.transactionRef).trim() : '',
        note: req.body.note ? String(req.body.note).trim() : '',
        approvedAt,
        approvedBy,
        providerPayload,
        initiatedAt: now,
        createdAt: now,
      }
      db.data.admin_payments.push(payment)
      const admins = Array.isArray(db.data?.admins) ? db.data.admins : []
      const admin = admins.find((a) => a.id === targetAdminId)
      if (admin && paymentStatus === 'paid') {
        admin.paid = true
        admin.paidAt = effectivePaidAt
      }
      res.locals.data = payment
      registerUndoAction(req, res, {
        resource: name,
        resourceId: payment.id,
        method: 'POST',
        beforeState,
      })
      await db.write()
      return next?.()
    }
    if (name === 'users') {
      const conflict = hasDuplicateUser(db.data, req.body)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    if (name === 'admins') {
      const conflict = hasDuplicateAdmin(db.data, req.body)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    if (name === 'entreprises') {
      const conflict = hasDuplicateEntreprise(db.data, req.body)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    res.locals.data = await service.create(name, req.body)
    registerUndoAction(req, res, {
      resource: name,
      resourceId: res.locals?.data?.id || req.body?.id || null,
      method: 'POST',
      beforeState,
    })
    await db.write()
  }
  next?.()
})

app.put('/:name', async (req, res, next) => {
  const { name = '' } = req.params
  if (isItem(req.body)) {
    const beforeState = createUndoSnapshot(db.data)
    if (name === 'clients') {
      const { role } = getAuthContextUser()
      if (!role) return res.status(401).json({ error: 'Not authenticated' })
      if (hasDuplicateClient(db.data, req.body, req.body.id)) {
        return res.status(409).json({ error: 'Client existe déjà avec ce numéro ou cet email pour cet admin.' })
      }
    }
    if (name === 'users') {
      const conflict = hasDuplicateUser(db.data, req.body, req.body.id)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    if (name === 'admins') {
      const existing = service.findById(name, req.body.id, req.query)
      const conflict = hasDuplicateAdmin(db.data, req.body, req.body.id)
      if (conflict) return res.status(409).json({ error: conflict })
      const nextStatus = String(req.body.status || '').toUpperCase()
      const prevStatus = String(existing?.status || '').toUpperCase()
      if (nextStatus && nextStatus !== prevStatus) {
        const { user: actor } = getAuthContextUser()
        appendAuditLog({
          actorId: actor?.id,
          action: 'ADMIN_STATUS',
          targetType: 'admin',
          targetId: req.body.id,
          message: `Admin ${req.body.id}: ${prevStatus || 'N/A'} → ${nextStatus}`,
        })
      }
    }
    if (name === 'entreprises') {
      const conflict = hasDuplicateEntreprise(db.data, req.body, req.body.id)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    res.locals.data = await service.update(name, req.body)
    registerUndoAction(req, res, {
      resource: name,
      resourceId: req.body?.id || res.locals?.data?.id || null,
      method: 'PUT',
      beforeState,
    })
    await db.write()
  }
  next?.()
})

app.put('/:name/:id', async (req, res, next) => {
  const { name = '', id = '' } = req.params
  if (isItem(req.body)) {
    const beforeState = createUndoSnapshot(db.data)
    if (name === 'admin_requests') {
      const users = Array.isArray(db.data?.users) ? db.data.users : []
      const user = users.find((u) => u.id === id)
      if (!user) return res.status(404).json({ error: 'Not found' })
      const conflict = hasDuplicateUser(db.data, { ...user, ...req.body }, id)
      if (conflict) return res.status(409).json({ error: conflict })
      const prevStatus = String(user.status || '').toUpperCase()
      Object.assign(user, {
        username: req.body.username ?? user.username,
        name: req.body.name ?? user.name,
        email: req.body.email ?? user.email,
        phone: req.body.phone ?? user.phone,
        status: req.body.status ?? user.status,
        entrepriseName: req.body.entrepriseName ?? user.entrepriseName,
        paid: req.body.paid ?? user.paid,
        paidAt: req.body.paidAt ?? user.paidAt,
        updatedAt: new Date().toISOString(),
      })
      if (String(user.status || '').toUpperCase() === 'ACTIF') {
        const admins = Array.isArray(db.data?.admins) ? db.data.admins : []
        const existing = admins.find((a) => a.id === user.id)
        if (!existing) {
          admins.push({
            id: user.id,
            entrepriseId: user.entrepriseName || '',
            paid: user.paid || false,
            paidAt: user.paidAt || null,
            status: 'ACTIF',
          })
        }
      }
      const nextStatus = String(user.status || '').toUpperCase()
      if (prevStatus !== nextStatus) {
        const { user: actor } = getAuthContextUser()
        appendAuditLog({
          actorId: actor?.id,
          action: 'ADMIN_REQUEST_STATUS',
          targetType: 'admin_request',
          targetId: user.id,
          message: `Demande admin ${user.name || user.id} : ${prevStatus || 'N/A'} → ${nextStatus}`,
        })
      }
      registerUndoAction(req, res, {
        resource: name,
        resourceId: id,
        method: 'PUT',
        beforeState,
      })
      await db.write()
      res.locals.data = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        entrepriseName: user.entrepriseName || '',
        status: user.status || 'EN_ATTENTE',
        username: user.username,
        password: user.password,
        paid: user.paid || false,
        paidAt: user.paidAt || null,
        createdAt: user.createdAt,
      }
      return next?.()
    }
    if (name === 'clients') {
      const { role } = getAuthContextUser()
      if (!role) return res.status(401).json({ error: 'Not authenticated' })
      if (hasDuplicateClient(db.data, req.body, id)) {
        return res.status(409).json({ error: 'Client existe déjà avec ce numéro ou cet email pour cet admin.' })
      }
    }
    if (name === 'users') {
      const conflict = hasDuplicateUser(db.data, req.body, id)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    if (name === 'admins') {
      const existing = service.findById(name, id, req.query)
      const conflict = hasDuplicateAdmin(db.data, req.body, id)
      if (conflict) return res.status(409).json({ error: conflict })
      const nextStatus = String(req.body.status || '').toUpperCase()
      const prevStatus = String(existing?.status || '').toUpperCase()
      if (nextStatus && nextStatus !== prevStatus) {
        const { user: actor } = getAuthContextUser()
        appendAuditLog({
          actorId: actor?.id,
          action: 'ADMIN_STATUS',
          targetType: 'admin',
          targetId: id,
          message: `Admin ${id}: ${prevStatus || 'N/A'} → ${nextStatus}`,
        })
      }
    }
    if (name === 'entreprises') {
      const conflict = hasDuplicateEntreprise(db.data, req.body, id)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    res.locals.data = await service.updateById(name, id, req.body)
    registerUndoAction(req, res, {
      resource: name,
      resourceId: id,
      method: 'PUT',
      beforeState,
    })
    await db.write()
  }
  next?.()
})

app.patch('/:name', async (req, res, next) => {
  const { name = '' } = req.params
  if (isItem(req.body)) {
    const beforeState = createUndoSnapshot(db.data)
    if (name === 'clients') {
      const { role } = getAuthContextUser()
      if (!role) return res.status(401).json({ error: 'Not authenticated' })
      if (hasDuplicateClient(db.data, req.body, req.body.id)) {
        return res.status(409).json({ error: 'Client existe déjà avec ce numéro ou cet email pour cet admin.' })
      }
    }
    if (name === 'users') {
      const conflict = hasDuplicateUser(db.data, req.body, req.body.id)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    if (name === 'admins') {
      const conflict = hasDuplicateAdmin(db.data, req.body, req.body.id)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    if (name === 'entreprises') {
      const conflict = hasDuplicateEntreprise(db.data, req.body, req.body.id)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    res.locals.data = await service.patch(name, req.body)
    registerUndoAction(req, res, {
      resource: name,
      resourceId: req.body?.id || res.locals?.data?.id || null,
      method: 'PATCH',
      beforeState,
    })
    await db.write()
  }
  next?.()
})

app.patch('/:name/:id', async (req, res, next) => {
  const { name = '', id = '' } = req.params
  if (isItem(req.body)) {
    const beforeState = createUndoSnapshot(db.data)
    if (name === 'import_runs') {
      const { role, adminId } = getAuthContextUser()
      if (!role) return res.status(401).json({ error: 'Not authenticated' })

      const runs = Array.isArray(db.data?.import_runs) ? db.data.import_runs : []
      const existing = runs.find((item) => String(item?.id || '') === String(id || ''))
      if (!existing) return res.status(404).json({ error: 'Not found' })
      if (!canAccessImportRun(existing, role, adminId)) {
        return res.status(403).json({ error: 'Access forbidden' })
      }

      const nextInserted = Array.isArray(req.body?.inserted) ? req.body.inserted : existing.inserted
      const nextErrors = Array.isArray(req.body?.errors) ? req.body.errors : existing.errors
      const nextIgnored = typeof req.body?.ignored === 'boolean' ? req.body.ignored : Boolean(existing.ignored)
      const nextReadSuccess =
        typeof req.body?.readSuccess === 'boolean'
          ? req.body.readSuccess
          : Array.isArray(nextInserted) && nextInserted.length === 0
            ? true
            : Boolean(existing.readSuccess)
      const nextReadErrors =
        typeof req.body?.readErrors === 'boolean'
          ? req.body.readErrors
          : nextIgnored || (Array.isArray(nextErrors) && nextErrors.length === 0)
            ? true
            : Boolean(existing.readErrors)

      req.body = {
        ...req.body,
        adminId: existing.adminId || String(adminId || ''),
        inserted: nextInserted,
        errors: nextErrors,
        ignored: nextIgnored,
        readSuccess: nextReadSuccess,
        readErrors: nextReadErrors,
        updatedAt: new Date().toISOString(),
      }
    }

    if (name === 'clients') {
      const { role, adminId } = getAuthContextUser()
      if (!role) return res.status(401).json({ error: 'Not authenticated' })
      const adminClients = Array.isArray(db.data?.admin_clients) ? db.data.admin_clients : []
      if (role === 'SUPER_ADMIN' && !adminId) {
        // allowed
      } else {
        const allowed = new Set(getAdminClientIds(adminId, adminClients))
        if (!allowed.has(id)) return res.status(403).json({ error: 'Access forbidden' })
      }
      if (hasDuplicateClient(db.data, req.body, id)) {
        return res.status(409).json({ error: 'Client existe déjà avec ce numéro ou cet email pour cet admin.' })
      }
    }
    if (name === 'users') {
      const conflict = hasDuplicateUser(db.data, req.body, id)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    if (name === 'admins') {
      const conflict = hasDuplicateAdmin(db.data, req.body, id)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    if (name === 'entreprises') {
      const conflict = hasDuplicateEntreprise(db.data, req.body, id)
      if (conflict) return res.status(409).json({ error: conflict })
    }
    res.locals.data = await service.patchById(name, id, req.body)
    registerUndoAction(req, res, {
      resource: name,
      resourceId: id,
      method: 'PATCH',
      beforeState,
    })
    await db.write()
  }
  next?.()
})

app.delete('/:name/:id', async (req, res, next) => {
  const { name = '', id = '' } = req.params
  const beforeState = createUndoSnapshot(db.data)
  if (name === 'clients') {
    const { role, adminId } = getAuthContextUser()
    if (!role) return res.status(401).json({ error: 'Not authenticated' })
    const adminClients = Array.isArray(db.data?.admin_clients) ? db.data.admin_clients : []
    if (role === 'SUPER_ADMIN' && !adminId) {
      // allowed
    } else {
      const allowed = new Set(getAdminClientIds(adminId, adminClients))
      if (!allowed.has(id)) return res.status(403).json({ error: 'Access forbidden' })
    }
    const { user: actor } = getAuthContextUser()
    appendAuditLog({
      actorId: actor?.id,
      action: 'CLIENT_DELETE',
      targetType: 'client',
      targetId: id,
      message: `Suppression client ${id}`,
    })
  }
  res.locals.data = await service.destroyById(name, id, req.query['_dependent'])
  registerUndoAction(req, res, {
    resource: name,
    resourceId: id,
    method: 'DELETE',
    beforeState,
  })
  await db.write()
  next?.()
})

app.use('/:name', (req, res) => {
  const { data } = res.locals
  if (data === undefined) {
    res.sendStatus(404)
  } else {
    if (req.method === 'POST') res.status(201)
    res.json(data)
  }
})

const port = Number(process.env.PORT || 4000)
app.listen(port, () => {
  console.log(`JSON Server (custom auth) listening on http://localhost:${port}`)
})
