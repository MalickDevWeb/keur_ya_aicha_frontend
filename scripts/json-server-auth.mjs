import { App } from '@tinyhttp/app'
import { cors } from '@tinyhttp/cors'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { json } from 'milliparsec'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Observer } from 'json-server/lib/observer.js'
import { Service, isItem } from 'json-server/lib/service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbFile = path.resolve(__dirname, '../db/db.json')
const adapter = new JSONFile(dbFile)
const observer = new Observer(adapter)
const db = new Low(observer, {})

await db.read()
db.data ||= {}
db.data.users ||= []
db.data.admins ||= []
db.data.superadmins ||= []
db.data.clients ||= []
db.data.admin_clients ||= []
db.data.rentals ||= []
db.data.notifications ||= []
db.data.otp ||= []
db.data.audit_logs ||= []
db.data.entreprises ||= []
db.data.blocked_ips ||= []

const authContext = { userId: null, impersonation: null, updatedAt: null }
const sessions = []

const service = new Service(db)
const app = new App()
const TRUSTED_IPS = new Set(['127.0.0.1', '::1'])

const SLOW_REQUEST_MS = 1500
const FAILED_LOGIN_THRESHOLD = 5
const FAILED_LOGIN_WINDOW_MS = 60 * 60 * 1000

function normalizePhone(phone = '') {
  const digits = String(phone).replace(/[^\d]/g, '')
  const withoutCountry = digits.startsWith('221') ? digits.slice(3) : digits
  return withoutCountry.slice(-9)
}

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase()
}

function normalizeText(value = '') {
  return String(value).trim().toLowerCase()
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
  const logs = Array.isArray(db.data?.audit_logs) ? db.data.audit_logs : []
  const since = Date.now() - sinceMs
  return logs.filter((l) => l.action === 'FAILED_LOGIN' && l.ipAddress === ip && new Date(l.createdAt || 0).getTime() >= since).length
}

function isBlockedIp(ip) {
  const blocked = Array.isArray(db.data?.blocked_ips) ? db.data.blocked_ips : []
  return blocked.some((b) => b.ip === ip)
}

function blockIp(ip, reason) {
  const blocked = Array.isArray(db.data?.blocked_ips) ? db.data.blocked_ips : []
  if (blocked.some((b) => b.ip === ip)) return
  blocked.push({
    id: `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ip,
    reason,
    createdAt: new Date().toISOString(),
  })
  db.data.blocked_ips = blocked
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
      const failures = getFailedLoginCount(ip)
      if (failures >= FAILED_LOGIN_THRESHOLD && !isBlockedIp(ip)) {
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
  const safeUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  }
  sessions.length = 0
  sessions.push({ id: 'session-current', userId: user.id, createdAt: new Date().toISOString() })
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
      return res.status(403).json({ error: 'Accès interdit. Décision du Super Admin.' })
    }
  }
  const safeUser = user
    ? {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      }
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
      const failures = getFailedLoginCount(ip)
      if (failures >= FAILED_LOGIN_THRESHOLD && !isBlockedIp(ip)) {
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
  return res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    impersonation: null,
  })
})

app.post('/authContext/logout', async (req, res) => {
  authContext.userId = null
  authContext.impersonation = null
  authContext.updatedAt = new Date().toISOString()
  return res.json({ ok: true })
})

app.post('/authContext/impersonate', async (req, res) => {
  const { adminId, adminName, userId } = req.body || {}
  if (!adminId || !adminName) return res.status(400).json({ error: 'Missing admin' })
  const ctx = authContext
  if (!ctx.userId) return res.status(401).json({ error: 'Not authenticated' })
  authContext.impersonation = { adminId, adminName, userId: userId || null }
  authContext.updatedAt = new Date().toISOString()
  return res.json({ ok: true })
})

app.post('/authContext/clear-impersonation', async (req, res) => {
  const ctx = authContext
  if (!ctx.userId) return res.status(401).json({ error: 'Not authenticated' })
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
  const safeUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  }
  return res.json({ user: safeUser })
})

app.post('/auth/logout', async (req, res) => {
  sessions.length = 0
  return res.json({ ok: true })
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
    await db.write()
  }
  next?.()
})

app.put('/:name', async (req, res, next) => {
  const { name = '' } = req.params
  if (isItem(req.body)) {
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
    await db.write()
  }
  next?.()
})

app.put('/:name/:id', async (req, res, next) => {
  const { name = '', id = '' } = req.params
  if (isItem(req.body)) {
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
    await db.write()
  }
  next?.()
})

app.patch('/:name', async (req, res, next) => {
  const { name = '' } = req.params
  if (isItem(req.body)) {
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
    await db.write()
  }
  next?.()
})

app.patch('/:name/:id', async (req, res, next) => {
  const { name = '', id = '' } = req.params
  if (isItem(req.body)) {
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
    await db.write()
  }
  next?.()
})

app.delete('/:name/:id', async (req, res, next) => {
  const { name = '', id = '' } = req.params
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
