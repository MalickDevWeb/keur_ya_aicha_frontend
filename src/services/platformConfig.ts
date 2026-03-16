import { getSetting, setSetting } from '@/services/api'
import { apiFetch } from '@/services/http'
import { resolveAssetUrl } from '@/services/assets'

export const PLATFORM_CONFIG_KEY = 'platform_config_v1'
const PLATFORM_CONFIG_LOCAL_STORAGE_KEY = 'kya_platform_config_v1'
const LOGIN_FAILURE_STATE_KEY = 'kya_login_failure_state_v1'
const PLATFORM_CONFIG_EVENT = 'platform-config-updated'

export type MaintenanceConfig = {
  enabled: boolean
  message: string
}

export type SessionSecurityConfig = {
  sessionDurationMinutes: number
  inactivityTimeoutMinutes: number
  maxFailedLogins: number
  lockoutMinutes: number
}

export type PaymentRulesConfig = {
  graceDays: number
  latePenaltyPercent: number
  blockOnOverdue: boolean
  recipientName: string
  waveRecipientPhone: string
  waveEnabled: boolean
  waveMode: 'manual' | 'api'
  orangeRecipientPhone: string
  orangeMoneyEnabled: boolean
  orangeMoneyMode: 'manual' | 'api'
  orangeOtpEnabled: boolean
  manualValidationEnabled: boolean
}

export type DocumentsConfig = {
  maxUploadMb: number
  allowedMimeTypes: string[]
  retentionDays: number
}

export type NotificationTemplates = {
  maintenance: string
  loginFailure: string
  paymentOverdue: string
  apiError: string
}

export type NotificationChannels = {
  sms: boolean
  email: boolean
  whatsapp: boolean
}

export type NotificationEvents = {
  maintenance: boolean
  loginFailure: boolean
  paymentOverdue: boolean
  apiError: boolean
}

export type NotificationsConfig = {
  channels: NotificationChannels
  events: NotificationEvents
  templates: NotificationTemplates
}

export type BrandingConfig = {
  appName: string
  logoUrl: string
  primaryColor: string
  footerText: string
}

export type AuditComplianceConfig = {
  retentionDays: number
  autoExportEnabled: boolean
  autoExportFormat: 'csv' | 'json'
  autoExportIntervalHours: number
  alertWebhookEnabled: boolean
  alertWebhookUrl: string
  alertWebhookSecret: string
  alertOnApiError: boolean
  alertOnSecurityEvent: boolean
}

export type PlatformConfig = {
  maintenance: MaintenanceConfig
  sessionSecurity: SessionSecurityConfig
  paymentRules: PaymentRulesConfig
  documents: DocumentsConfig
  notifications: NotificationsConfig
  branding: BrandingConfig
  auditCompliance: AuditComplianceConfig
}

type PlatformConfigEventDetail = {
  source: 'local-storage' | 'server' | 'save'
  config: PlatformConfig
}

type FailedLoginState = {
  failures: number
  firstFailedAt: number
  blockedUntil: number
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  maintenance: {
    enabled: false,
    message: 'Maintenance en cours. Les actions d’écriture sont temporairement désactivées.',
  },
  sessionSecurity: {
    sessionDurationMinutes: 480,
    inactivityTimeoutMinutes: 120,
    maxFailedLogins: 5,
    lockoutMinutes: 30,
  },
  paymentRules: {
    graceDays: 5,
    latePenaltyPercent: 0,
    blockOnOverdue: true,
    recipientName: 'Keur Ya Aicha',
    waveRecipientPhone: '771719013',
    waveEnabled: true,
    waveMode: 'manual',
    orangeRecipientPhone: '771719013',
    orangeMoneyEnabled: true,
    orangeMoneyMode: 'manual',
    orangeOtpEnabled: true,
    manualValidationEnabled: true,
  },
  documents: {
    maxUploadMb: 10,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    retentionDays: 365,
  },
  notifications: {
    channels: {
      sms: false,
      email: true,
      whatsapp: false,
    },
    events: {
      maintenance: true,
      loginFailure: true,
      paymentOverdue: true,
      apiError: true,
    },
    templates: {
      maintenance: 'Maintenance active: {message}',
      loginFailure: 'Tentative de connexion échouée pour {username}',
      paymentOverdue: "Abonnement en retard pour {adminId} ({month})",
      apiError: 'Erreur API {path}: {error}',
    },
  },
  branding: {
    appName: 'Keur Ya Aicha',
    logoUrl: '/logo.png',
    primaryColor: '#121B53',
    footerText: '© Keur Ya Aicha',
  },
  auditCompliance: {
    retentionDays: 365,
    autoExportEnabled: false,
    autoExportFormat: 'csv',
    autoExportIntervalHours: 24,
    alertWebhookEnabled: false,
    alertWebhookUrl: '',
    alertWebhookSecret: '',
    alertOnApiError: true,
    alertOnSecurityEvent: true,
  },
}

let platformConfigCache: PlatformConfig = cloneConfig(DEFAULT_PLATFORM_CONFIG)
let loadedFromStorage = false

function cloneConfig<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function asString(value: unknown, fallback: string): string {
  const str = typeof value === 'string' ? value : value == null ? '' : String(value)
  return str.trim() || fallback
}

function asOptionalString(value: unknown): string {
  const str = typeof value === 'string' ? value : value == null ? '' : String(value)
  return str.trim()
}

function asProviderMode(value: unknown, fallback: 'manual' | 'api'): 'manual' | 'api' {
  return String(value || '').trim().toLowerCase() === 'api' ? 'api' : fallback
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  const normalized = value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
  return normalized.length > 0 ? [...new Set(normalized)] : fallback
}

function sanitizePlatformConfig(value: unknown): PlatformConfig {
  const raw = (value || {}) as Partial<PlatformConfig>
  const maintenance: Partial<MaintenanceConfig> = raw.maintenance || {}
  const sessionSecurity: Partial<SessionSecurityConfig> = raw.sessionSecurity || {}
  const paymentRules: Partial<PaymentRulesConfig> = raw.paymentRules || {}
  const documents: Partial<DocumentsConfig> = raw.documents || {}
  const notifications: Partial<NotificationsConfig> = raw.notifications || {}
  const channels: Partial<NotificationChannels> = notifications.channels || {}
  const events: Partial<NotificationEvents> = notifications.events || {}
  const templates: Partial<NotificationTemplates> = notifications.templates || {}
  const branding: Partial<BrandingConfig> = raw.branding || {}
  const auditCompliance: Partial<AuditComplianceConfig> = raw.auditCompliance || {}

  const output: PlatformConfig = {
    maintenance: {
      enabled: asBoolean(maintenance.enabled, DEFAULT_PLATFORM_CONFIG.maintenance.enabled),
      message: asString(maintenance.message, DEFAULT_PLATFORM_CONFIG.maintenance.message),
    },
    sessionSecurity: {
      sessionDurationMinutes: clampNumber(
        sessionSecurity.sessionDurationMinutes,
        5,
        24 * 60,
        DEFAULT_PLATFORM_CONFIG.sessionSecurity.sessionDurationMinutes
      ),
      inactivityTimeoutMinutes: clampNumber(
        sessionSecurity.inactivityTimeoutMinutes,
        1,
        24 * 60,
        DEFAULT_PLATFORM_CONFIG.sessionSecurity.inactivityTimeoutMinutes
      ),
      maxFailedLogins: clampNumber(
        sessionSecurity.maxFailedLogins,
        1,
        50,
        DEFAULT_PLATFORM_CONFIG.sessionSecurity.maxFailedLogins
      ),
      lockoutMinutes: clampNumber(
        sessionSecurity.lockoutMinutes,
        1,
        24 * 60,
        DEFAULT_PLATFORM_CONFIG.sessionSecurity.lockoutMinutes
      ),
    },
    paymentRules: {
      graceDays: clampNumber(paymentRules.graceDays, 0, 31, DEFAULT_PLATFORM_CONFIG.paymentRules.graceDays),
      latePenaltyPercent: clampNumber(
        paymentRules.latePenaltyPercent,
        0,
        100,
        DEFAULT_PLATFORM_CONFIG.paymentRules.latePenaltyPercent
      ),
      blockOnOverdue: asBoolean(paymentRules.blockOnOverdue, DEFAULT_PLATFORM_CONFIG.paymentRules.blockOnOverdue),
      recipientName: asString(
        paymentRules.recipientName,
        DEFAULT_PLATFORM_CONFIG.paymentRules.recipientName
      ),
      waveRecipientPhone: asOptionalString(paymentRules.waveRecipientPhone),
      waveEnabled: asBoolean(paymentRules.waveEnabled, DEFAULT_PLATFORM_CONFIG.paymentRules.waveEnabled),
      waveMode: asProviderMode(paymentRules.waveMode, DEFAULT_PLATFORM_CONFIG.paymentRules.waveMode),
      orangeRecipientPhone: asOptionalString(paymentRules.orangeRecipientPhone),
      orangeMoneyEnabled: asBoolean(
        paymentRules.orangeMoneyEnabled,
        DEFAULT_PLATFORM_CONFIG.paymentRules.orangeMoneyEnabled
      ),
      orangeMoneyMode: asProviderMode(
        paymentRules.orangeMoneyMode,
        DEFAULT_PLATFORM_CONFIG.paymentRules.orangeMoneyMode
      ),
      orangeOtpEnabled: asBoolean(
        paymentRules.orangeOtpEnabled,
        DEFAULT_PLATFORM_CONFIG.paymentRules.orangeOtpEnabled
      ),
      manualValidationEnabled: asBoolean(
        paymentRules.manualValidationEnabled,
        DEFAULT_PLATFORM_CONFIG.paymentRules.manualValidationEnabled
      ),
    },
    documents: {
      maxUploadMb: clampNumber(documents.maxUploadMb, 1, 1024, DEFAULT_PLATFORM_CONFIG.documents.maxUploadMb),
      allowedMimeTypes: asStringArray(documents.allowedMimeTypes, DEFAULT_PLATFORM_CONFIG.documents.allowedMimeTypes),
      retentionDays: clampNumber(documents.retentionDays, 1, 3650, DEFAULT_PLATFORM_CONFIG.documents.retentionDays),
    },
    notifications: {
      channels: {
        sms: asBoolean(channels.sms, DEFAULT_PLATFORM_CONFIG.notifications.channels.sms),
        email: asBoolean(channels.email, DEFAULT_PLATFORM_CONFIG.notifications.channels.email),
        whatsapp: asBoolean(channels.whatsapp, DEFAULT_PLATFORM_CONFIG.notifications.channels.whatsapp),
      },
      events: {
        maintenance: asBoolean(events.maintenance, DEFAULT_PLATFORM_CONFIG.notifications.events.maintenance),
        loginFailure: asBoolean(events.loginFailure, DEFAULT_PLATFORM_CONFIG.notifications.events.loginFailure),
        paymentOverdue: asBoolean(events.paymentOverdue, DEFAULT_PLATFORM_CONFIG.notifications.events.paymentOverdue),
        apiError: asBoolean(events.apiError, DEFAULT_PLATFORM_CONFIG.notifications.events.apiError),
      },
      templates: {
        maintenance: asString(templates.maintenance, DEFAULT_PLATFORM_CONFIG.notifications.templates.maintenance),
        loginFailure: asString(templates.loginFailure, DEFAULT_PLATFORM_CONFIG.notifications.templates.loginFailure),
        paymentOverdue: asString(templates.paymentOverdue, DEFAULT_PLATFORM_CONFIG.notifications.templates.paymentOverdue),
        apiError: asString(templates.apiError, DEFAULT_PLATFORM_CONFIG.notifications.templates.apiError),
      },
    },
    branding: {
      appName: asString(branding.appName, DEFAULT_PLATFORM_CONFIG.branding.appName),
      logoUrl: asString(branding.logoUrl, DEFAULT_PLATFORM_CONFIG.branding.logoUrl),
      primaryColor: asString(branding.primaryColor, DEFAULT_PLATFORM_CONFIG.branding.primaryColor),
      footerText: asString(branding.footerText, DEFAULT_PLATFORM_CONFIG.branding.footerText),
    },
    auditCompliance: {
      retentionDays: clampNumber(
        auditCompliance.retentionDays,
        1,
        3650,
        DEFAULT_PLATFORM_CONFIG.auditCompliance.retentionDays
      ),
      autoExportEnabled: asBoolean(
        auditCompliance.autoExportEnabled,
        DEFAULT_PLATFORM_CONFIG.auditCompliance.autoExportEnabled
      ),
      autoExportFormat:
        auditCompliance.autoExportFormat === 'json' || auditCompliance.autoExportFormat === 'csv'
          ? auditCompliance.autoExportFormat
          : DEFAULT_PLATFORM_CONFIG.auditCompliance.autoExportFormat,
      autoExportIntervalHours: clampNumber(
        auditCompliance.autoExportIntervalHours,
        1,
        168,
        DEFAULT_PLATFORM_CONFIG.auditCompliance.autoExportIntervalHours
      ),
      alertWebhookEnabled: asBoolean(
        auditCompliance.alertWebhookEnabled,
        DEFAULT_PLATFORM_CONFIG.auditCompliance.alertWebhookEnabled
      ),
      alertWebhookUrl: asOptionalString(auditCompliance.alertWebhookUrl),
      alertWebhookSecret: asOptionalString(auditCompliance.alertWebhookSecret),
      alertOnApiError: asBoolean(auditCompliance.alertOnApiError, DEFAULT_PLATFORM_CONFIG.auditCompliance.alertOnApiError),
      alertOnSecurityEvent: asBoolean(
        auditCompliance.alertOnSecurityEvent,
        DEFAULT_PLATFORM_CONFIG.auditCompliance.alertOnSecurityEvent
      ),
    },
  }

  return output
}

function applyConfigToCache(config: PlatformConfig, source: PlatformConfigEventDetail['source']): PlatformConfig {
  platformConfigCache = sanitizePlatformConfig(config)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PLATFORM_CONFIG_LOCAL_STORAGE_KEY, JSON.stringify(platformConfigCache))
    } catch {
      // ignore local storage failures
    }
    window.dispatchEvent(
      new CustomEvent<PlatformConfigEventDetail>(PLATFORM_CONFIG_EVENT, {
        detail: { source, config: cloneConfig(platformConfigCache) },
      })
    )
  }
  return cloneConfig(platformConfigCache)
}

function readConfigFromLocalStorage(): PlatformConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PLATFORM_CONFIG_LOCAL_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return sanitizePlatformConfig(parsed)
  } catch {
    return null
  }
}

function readFailedLoginState(): FailedLoginState {
  if (typeof window === 'undefined') {
    return { failures: 0, firstFailedAt: 0, blockedUntil: 0 }
  }
  try {
    const raw = localStorage.getItem(LOGIN_FAILURE_STATE_KEY)
    if (!raw) return { failures: 0, firstFailedAt: 0, blockedUntil: 0 }
    const parsed = JSON.parse(raw) as Partial<FailedLoginState>
    return {
      failures: clampNumber(parsed.failures, 0, 1000, 0),
      firstFailedAt: clampNumber(parsed.firstFailedAt, 0, Date.now() + 10_000, 0),
      blockedUntil: clampNumber(parsed.blockedUntil, 0, Date.now() + 1000 * 60 * 60 * 24 * 365, 0),
    }
  } catch {
    return { failures: 0, firstFailedAt: 0, blockedUntil: 0 }
  }
}

function writeFailedLoginState(state: FailedLoginState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOGIN_FAILURE_STATE_KEY, JSON.stringify(state))
  } catch {
    // ignore local storage failures
  }
}

function clearFailedStateIfExpired(state: FailedLoginState): FailedLoginState {
  const lockoutMs = getPlatformConfigSnapshot().sessionSecurity.lockoutMinutes * 60 * 1000
  const now = Date.now()
  if (state.blockedUntil > 0 && now < state.blockedUntil) return state
  if (!state.firstFailedAt) return { failures: 0, firstFailedAt: 0, blockedUntil: 0 }
  if (now - state.firstFailedAt <= lockoutMs) return state
  return { failures: 0, firstFailedAt: 0, blockedUntil: 0 }
}

export function getPlatformConfigSnapshot(): PlatformConfig {
  if (!loadedFromStorage) {
    const fromStorage = readConfigFromLocalStorage()
    if (fromStorage) platformConfigCache = fromStorage
    loadedFromStorage = true
  }
  return cloneConfig(platformConfigCache)
}

export function subscribePlatformConfigUpdates(callback: (config: PlatformConfig) => void): () => void {
  if (typeof window === 'undefined') return () => undefined

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<PlatformConfigEventDetail>).detail
    callback(cloneConfig(detail?.config || platformConfigCache))
  }

  const storageHandler = (event: StorageEvent) => {
    if (event.key !== PLATFORM_CONFIG_LOCAL_STORAGE_KEY) return
    const next = readConfigFromLocalStorage()
    if (!next) return
    platformConfigCache = next
    callback(cloneConfig(next))
  }

  window.addEventListener(PLATFORM_CONFIG_EVENT, handler)
  window.addEventListener('storage', storageHandler)
  return () => {
    window.removeEventListener(PLATFORM_CONFIG_EVENT, handler)
    window.removeEventListener('storage', storageHandler)
  }
}

export async function refreshPlatformConfigFromServer(): Promise<PlatformConfig> {
  try {
    const raw = await getSetting(PLATFORM_CONFIG_KEY)
    if (!raw) {
      return applyConfigToCache(DEFAULT_PLATFORM_CONFIG, 'server')
    }
    const parsed = JSON.parse(raw)
    const sanitized = sanitizePlatformConfig(parsed)
    return applyConfigToCache(sanitized, 'server')
  } catch {
    return getPlatformConfigSnapshot()
  }
}

export async function savePlatformConfig(config: PlatformConfig): Promise<PlatformConfig> {
  const sanitized = sanitizePlatformConfig(config)
  await setSetting(PLATFORM_CONFIG_KEY, JSON.stringify(sanitized))
  return applyConfigToCache(sanitized, 'save')
}

export function applyBrandingToDocument(config: PlatformConfig): void {
  if (typeof document === 'undefined') return
  const primaryColor = String(config.branding.primaryColor || '').trim()
  const logoUrl = String(config.branding.logoUrl || '').trim()
  const resolvedLogoUrl = resolveAssetUrl(logoUrl)

  if (primaryColor) {
    document.documentElement.style.setProperty('--kya-brand-primary', primaryColor)
  }
  document.documentElement.style.removeProperty('--primary')
  document.documentElement.style.removeProperty('--ring')
  document.documentElement.style.removeProperty('--sidebar-accent')
  document.documentElement.style.removeProperty('--sidebar-primary')
  if (resolvedLogoUrl) {
    document.documentElement.style.setProperty('--kya-brand-logo-url', `url("${resolvedLogoUrl}")`)
  }
  document.title = config.branding.appName || DEFAULT_PLATFORM_CONFIG.branding.appName
}

function normalizePath(path: string): string {
  const raw = String(path || '')
  return raw.split('?')[0] || '/'
}

function isWriteMethod(method: string): boolean {
  const normalized = String(method || 'GET').toUpperCase()
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalized)
}

function isMaintenanceWhitelistPath(path: string): boolean {
  return (
    path.startsWith('/settings') ||
    path.startsWith('/payment-providers') ||
    path.startsWith('/audit_logs') ||
    path.startsWith('/auth') ||
    path.startsWith('/authContext') ||
    path.startsWith('/undo-actions') ||
    path.startsWith('/admin_payments/webhook') ||
    path === '/sign' ||
    path.startsWith('/cloudinary/open-url')
  )
}

export function shouldBlockWriteByMaintenance(path: string, method: string): boolean {
  const config = getPlatformConfigSnapshot()
  if (!config.maintenance.enabled) return false
  if (!isWriteMethod(method)) return false
  const normalizedPath = normalizePath(path)
  return !isMaintenanceWhitelistPath(normalizedPath)
}

export function buildMaintenanceBlockedMessage(): string {
  const config = getPlatformConfigSnapshot()
  return config.maintenance.message || DEFAULT_PLATFORM_CONFIG.maintenance.message
}

export type LoginLockStatus = {
  blocked: boolean
  remainingMs: number
  failures: number
}

export function getLoginLockStatus(): LoginLockStatus {
  const state = clearFailedStateIfExpired(readFailedLoginState())
  writeFailedLoginState(state)
  const now = Date.now()
  const remainingMs = Math.max(0, state.blockedUntil - now)
  return {
    blocked: remainingMs > 0,
    remainingMs,
    failures: state.failures,
  }
}

export function recordFailedLoginAttempt(): LoginLockStatus {
  const config = getPlatformConfigSnapshot()
  const threshold = Math.max(1, config.sessionSecurity.maxFailedLogins)
  const lockoutMs = Math.max(1, config.sessionSecurity.lockoutMinutes) * 60 * 1000
  const now = Date.now()

  const baseState = clearFailedStateIfExpired(readFailedLoginState())
  const nextFailures = baseState.failures + 1
  const nextState: FailedLoginState = {
    failures: nextFailures,
    firstFailedAt: baseState.firstFailedAt || now,
    blockedUntil: nextFailures >= threshold ? now + lockoutMs : baseState.blockedUntil,
  }
  writeFailedLoginState(nextState)
  return getLoginLockStatus()
}

export function clearFailedLoginAttempts(): void {
  writeFailedLoginState({ failures: 0, firstFailedAt: 0, blockedUntil: 0 })
}

function mimeTypeAllowed(fileType: string, allowedMimeTypes: string[]): boolean {
  const normalizedType = String(fileType || '').trim().toLowerCase()
  if (!normalizedType) return false
  return allowedMimeTypes.some((allowed) => {
    const normalizedAllowed = String(allowed || '').trim().toLowerCase()
    if (!normalizedAllowed) return false
    if (normalizedAllowed.endsWith('/*')) {
      const prefix = normalizedAllowed.slice(0, normalizedAllowed.length - 1)
      return normalizedType.startsWith(prefix)
    }
    return normalizedType === normalizedAllowed
  })
}

export function validateUploadAgainstPolicy(file: File): string | null {
  const config = getPlatformConfigSnapshot()
  const maxBytes = Math.max(1, config.documents.maxUploadMb) * 1024 * 1024
  if (file.size > maxBytes) {
    return `Fichier trop volumineux (${config.documents.maxUploadMb} MB max).`
  }

  const allowedMimeTypes = config.documents.allowedMimeTypes
  if (allowedMimeTypes.length > 0 && !mimeTypeAllowed(file.type, allowedMimeTypes)) {
    return `Type de fichier non autorisé. Types autorisés: ${allowedMimeTypes.join(', ')}`
  }
  return null
}

type WebhookAlertType = 'api_error' | 'security'

function interpolateTemplate(template: string, payload: Record<string, unknown>): string {
  return String(template || '').replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = payload[key]
    return typeof value === 'undefined' || value === null ? '' : String(value)
  })
}

function resolveNotificationMessage(type: WebhookAlertType, payload: Record<string, unknown>, config: PlatformConfig): string {
  const templates = config.notifications.templates
  const events = config.notifications.events
  const eventName = String(payload.event || '').trim()

  if (type === 'api_error') {
    if (!events.apiError) return ''
    return interpolateTemplate(templates.apiError, payload)
  }

  if (eventName === 'login_failure') {
    if (!events.loginFailure) return ''
    return interpolateTemplate(templates.loginFailure, payload)
  }
  if (eventName === 'payment_overdue') {
    if (!events.paymentOverdue) return ''
    return interpolateTemplate(templates.paymentOverdue, payload)
  }
  if (eventName === 'maintenance') {
    if (!events.maintenance) return ''
    return interpolateTemplate(templates.maintenance, payload)
  }

  return ''
}

export async function sendComplianceWebhookAlert(
  type: WebhookAlertType,
  payload: Record<string, unknown>
): Promise<void> {
  const config = getPlatformConfigSnapshot()
  const audit = config.auditCompliance
  if (!audit.alertWebhookEnabled) return
  if (type === 'api_error' && !audit.alertOnApiError) return
  if (type === 'security' && !audit.alertOnSecurityEvent) return
  const webhookUrl = String(audit.alertWebhookUrl || '').trim()
  if (!webhookUrl) return

  const body = {
    source: 'kya-frontend',
    type,
    sentAt: new Date().toISOString(),
    channels: config.notifications.channels,
    message: resolveNotificationMessage(type, payload, config),
    payload,
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(audit.alertWebhookSecret
          ? { 'x-kya-webhook-secret': String(audit.alertWebhookSecret || '').trim() }
          : {}),
      },
      body: JSON.stringify(body),
    })
  } catch {
    // ignore webhook failures
  }
}

export async function testComplianceWebhookServerSide(): Promise<{
  ok: true
  sent: boolean
  enabled: boolean
  configured: boolean
  status: number | null
}> {
  return apiFetch('/securite/audits/webhook-test', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}
