# Services metier (logique actuelle + snippets copy-paste)

## 0. Principes
- Route handler Next.js = orchestration HTTP uniquement.
- Service = logique metier, droits, regles abonnement, doublons, rollback.
- Repository = SQL pur.

---

## 1. Service Auth et Securite

### 1.1 Login (echecs + blocage IP)
```ts
export async function loginService({ username, password, ip }) {
  if (!username || !password) throw httpError(400, 'Missing credentials', 'VALIDATION_ERROR')

  const user = await findUserByLoginOrPhone(username, password)
  if (!user) {
    await appendAuditLog({ actor: 'anonymous', action: 'FAILED_LOGIN', targetType: 'auth', targetId: String(username), ipAddress: ip })
    await maybeAutoBlockIpAfterFailedLogin(ip)
    throw httpError(401, 'Invalid credentials', 'AUTH_INVALID_CREDENTIALS')
  }

  if (String(user.role).toUpperCase() === 'ADMIN') {
    const admin = await findAdminById(user.id)
    if (!admin || String(user.status || '').toUpperCase() !== 'ACTIF') {
      throw httpError(403, "Demande en attente d'approbation", 'AUTH_PENDING')
    }
  }

  return enrichAuthUserWithSubscription(user)
}
```

### 1.2 Seconde auth super admin (TTL 30 min)
```ts
const SUPER_ADMIN_SECOND_AUTH_TTL_MS = 30 * 60 * 1000

export function isSuperAdminSecondAuthValid(ctxUserId: string, verifiedAt?: string | null) {
  const verifiedAtMs = new Date(verifiedAt || 0).getTime()
  if (!Number.isFinite(verifiedAtMs) || verifiedAtMs <= 0) return false
  return Date.now() - verifiedAtMs <= SUPER_ADMIN_SECOND_AUTH_TTL_MS
}
```

---

## 2. Service Abonnement Admin

### 2.1 Algorithme de statut abonnement
```ts
export function toMonthKey(value: string | number | Date) {
  const d = value instanceof Date ? value : new Date(value)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function parseMonthKey(key: string) {
  const m = String(key || '').match(/^(\d{4})-(\d{2})$/)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || mo < 1 || mo > 12) return null
  return new Date(y, mo - 1, 1)
}

export function getDueDate(monthKey: string, graceDays: number) {
  const d = parseMonthKey(monthKey)
  if (!d) return null
  return new Date(d.getFullYear(), d.getMonth() + 1, graceDays, 23, 59, 59, 999)
}

export function getAdminSubscriptionStatus({ adminId, adminCreatedAt, payments, now = new Date(), graceDays = 5, blockOnOverdue = true }) {
  if (!adminId) return { blocked: false, overdueMonth: null, dueAt: null, requiredMonth: toMonthKey(now) }

  const start = new Date(new Date(adminCreatedAt).getFullYear(), new Date(adminCreatedAt).getMonth(), 1)
  const current = new Date(now.getFullYear(), now.getMonth(), 1)

  const paidMonths = new Set(
    payments
      .filter((p: any) => String(p.adminId) === String(adminId))
      .filter((p: any) => !p.status || p.status === 'paid')
      .map((p: any) => (String(p.month || '').match(/^\d{4}-\d{2}$/) ? p.month : toMonthKey(p.paidAt || now)))
  )

  if (blockOnOverdue) {
    for (let cursor = new Date(start); cursor <= current; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
      const monthKey = toMonthKey(cursor)
      const dueAt = getDueDate(monthKey, graceDays)
      if (!dueAt) continue
      if (now.getTime() <= dueAt.getTime()) continue
      if (!paidMonths.has(monthKey)) {
        return { blocked: true, overdueMonth: monthKey, dueAt: dueAt.toISOString(), requiredMonth: monthKey }
      }
    }
  }

  const dueAtCurrent = getDueDate(toMonthKey(now), graceDays)
  return { blocked: false, overdueMonth: null, dueAt: dueAtCurrent?.toISOString() || null, requiredMonth: toMonthKey(now) }
}
```

---

## 3. Service AdminPayment

### 3.1 Regles creation
```ts
export async function createAdminPaymentService({ actorRole, actorId, payload, subscriptionStatus }) {
  const method = String(payload.method || '').toLowerCase()
  if (!['wave', 'orange_money', 'cash'].includes(method)) {
    throw httpError(400, 'Methode de paiement invalide (wave, orange_money, cash).', 'VALIDATION_ERROR')
  }

  if (actorRole === 'SUPER_ADMIN' && method !== 'cash') {
    throw httpError(403, 'Super Admin: seul le paiement especes est autorise.', 'FORBIDDEN')
  }

  if (actorRole !== 'SUPER_ADMIN' && method === 'cash') {
    throw httpError(403, 'Paiement especes: validation reservee au Super Admin.', 'FORBIDDEN')
  }

  const amount = Number(payload.amount || 0)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw httpError(400, 'Montant de paiement invalide.', 'VALIDATION_ERROR')
  }

  const month = subscriptionStatus.blocked ? subscriptionStatus.requiredMonth : (payload.month || toMonthKey(new Date(payload.paidAt || Date.now())))

  if (subscriptionStatus.blocked && month !== subscriptionStatus.requiredMonth) {
    throw httpError(409, `Paiement requis pour ${subscriptionStatus.requiredMonth} avant tout autre mois.`, 'DUPLICATE_ENTITY')
  }

  const duplicate = await findActiveAdminPaymentByMonth(payload.adminId, month)
  if (duplicate) {
    throw httpError(409, `Le mois ${month} est deja paye.`, 'DUPLICATE_ENTITY')
  }

  // provider call + persistence + audit ici
}
```

### 3.2 Regles webhook
```ts
export async function confirmAdminPaymentByWebhook({ providerService, rawPayload, signature }) {
  if (!providerService.verifyWebhook(rawPayload, signature)) {
    throw httpError(401, 'Signature webhook invalide.', 'WEBHOOK_INVALID_SIGNATURE')
  }

  const event = providerService.parseWebhookEvent(JSON.parse(rawPayload || '{}'))
  if (!event.paid) return { ok: true, ignored: true }

  const payment = await findAdminPaymentForWebhook(event)
  if (!payment) throw httpError(404, 'Paiement admin introuvable pour ce webhook.', 'NOT_FOUND')

  await markAdminPaymentPaid(payment.id, event.externalId)
  return { ok: true, paymentId: payment.id, status: 'paid' }
}
```

---

## 4. Service Client + Doublons

```ts
export function normalizePhone(value = '') {
  const digits = String(value).replace(/[^\d]/g, '')
  const noCountry = digits.startsWith('221') ? digits.slice(3) : digits
  return noCountry.slice(-9)
}

export function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase()
}

export async function assertNoDuplicateClient({ adminId, phone, email, selfId }) {
  const existing = await listClientsByAdmin(adminId)
  const targetPhone = normalizePhone(phone)
  const targetEmail = normalizeEmail(email)

  const duplicate = existing.some((c: any) => {
    if (selfId && String(c.id) === String(selfId)) return false
    const samePhone = targetPhone && normalizePhone(c.phone) === targetPhone
    const sameEmail = targetEmail && normalizeEmail(c.email) === targetEmail
    return Boolean(samePhone || sameEmail)
  })

  if (duplicate) {
    throw httpError(409, 'Client existe deja avec ce numero ou cet email pour cet admin.', 'DUPLICATE_ENTITY')
  }
}
```

---

## 5. Service Undo

```ts
const UNDO_WINDOW_MS = 60 * 24 * 60 * 60 * 1000
const UNDO_HISTORY_LIMIT = 300

export function isUndoExpired(entry: any) {
  const expiresAtMs = new Date(entry?.expiresAt || 0).getTime()
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()
}

export function cleanUndoActions(list: any[] = []) {
  return list.filter((item) => !isUndoExpired(item)).slice(0, UNDO_HISTORY_LIMIT)
}

export function buildRollbackPlan({ method, resourceId, beforeItem }: any) {
  const m = String(method || '').toUpperCase()
  if (m === 'POST') return { type: 'delete', id: resourceId }
  if ((m === 'PUT' || m === 'PATCH') && beforeItem) return { type: 'upsert', item: beforeItem }
  if (m === 'DELETE' && beforeItem) return { type: 'create', item: beforeItem }
  return null
}
```

---

## 6. Service Retention

```ts
export function extractRetentionTimestamp(entry: any) {
  const candidates = [entry?.uploadedAt, entry?.createdAt, entry?.created_at, entry?.updatedAt, entry?.date]
  for (const c of candidates) {
    const ms = new Date(c || 0).getTime()
    if (Number.isFinite(ms) && ms > 0) return ms
  }
  return 0
}

export function applyCollectionRetention(items: any[], cutoffMs: number) {
  return (items || []).filter((item) => {
    const ts = extractRetentionTimestamp(item)
    return !ts || ts >= cutoffMs
  })
}
```

---

## 7. Service Cloudinary URL protegee

```ts
import { buildCloudinaryDownloadUrl } from '@/lib/cloudinary'

export async function openCloudinaryUrlService({ role, url }) {
  if (!role) throw httpError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
  if (!url) throw httpError(400, 'Missing document url', 'VALIDATION_ERROR')
  return buildCloudinaryDownloadUrl(url)
}
```

---

## 8. Service Import

```ts
export function normalizeImportRunRecord(run: any) {
  const inserted = Array.isArray(run?.inserted) ? run.inserted : []
  const errors = Array.isArray(run?.errors) ? run.errors : []
  const ignored = Boolean(run?.ignored)

  const readSuccess = typeof run?.readSuccess === 'boolean' ? run.readSuccess : inserted.length === 0
  const readErrors = typeof run?.readErrors === 'boolean' ? run.readErrors : (ignored || errors.length === 0)

  return {
    ...run,
    inserted,
    errors,
    ignored,
    readSuccess,
    readErrors,
    createdAt: run?.createdAt || new Date().toISOString(),
  }
}
```
