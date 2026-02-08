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
db.data.clients ||= []
db.data.admin_requests ||= []
db.data.users ||= []
db.data.settings ||= []
db.data.import_runs ||= []
db.data.admins ||= []
db.data.entreprises ||= []
db.data.audit_logs ||= []
db.data.superadmin_logs ||= []
db.data.sessions ||= []
db.data.authContext ||= { userId: null, impersonation: null, updatedAt: null }

const service = new Service(db)
const app = new App()

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

function getAuthContextUser() {
  const ctx = db.data?.authContext || { userId: null, impersonation: null }
  if (!ctx.userId) return { user: null, role: null, adminId: null, impersonation: ctx.impersonation || null }
  const users = Array.isArray(db.data?.users) ? db.data.users : []
  const user = users.find((u) => u.id === ctx.userId) || null
  const role = user ? String(user.role || '').toUpperCase() : null
  let adminId = null
  if (role === 'SUPER_ADMIN' && ctx.impersonation?.adminId) {
    adminId = ctx.impersonation.adminId
  } else if (role === 'ADMIN') {
    const admins = Array.isArray(db.data?.admins) ? db.data.admins : []
    const admin = admins.find((a) => a.userId === ctx.userId)
    if (admin?.id) {
      adminId = admin.id
    } else if (user?.username) {
      const fallback = admins.find((a) => normalizeText(a.username) === normalizeText(user.username))
      adminId = fallback?.id || null
    }
  }
  return { user, role, adminId, impersonation: ctx.impersonation || null }
}

function hasDuplicateClient(data, payload, selfId, adminId) {
  const list = Array.isArray(data?.clients) ? data.clients : []
  const pPhone = normalizePhone(payload?.phone)
  const pEmail = normalizeEmail(payload?.email)
  return list.some((c) => {
    if (selfId && c.id === selfId) return false
    if (adminId == null) {
      if (c.adminId != null) return false
    } else if (c.adminId !== adminId) {
      return false
    }
    const cPhone = normalizePhone(c.phone)
    const cEmail = normalizeEmail(c.email)
    if (pPhone && cPhone && pPhone === cPhone) return true
    if (pEmail && cEmail && pEmail === cEmail) return true
    return false
  })
}

function hasDuplicateUser(data, payload, selfId) {
  const users = Array.isArray(data?.users) ? data.users : []
  const adminRequests = Array.isArray(data?.admin_requests) ? data.admin_requests : []
  const admins = Array.isArray(data?.admins) ? data.admins : []
  const pUsername = normalizeText(payload?.username)
  const pPhone = normalizePhone(payload?.phone)
  const pEmail = normalizeEmail(payload?.email)

  if (pUsername) {
    const conflict =
      users.some((u) => (selfId && u.id === selfId ? false : normalizeText(u.username) === pUsername)) ||
      admins.some((a) => normalizeText(a.username) === pUsername) ||
      adminRequests.some((r) => normalizeText(r.username) === pUsername)
    if (conflict) return 'Ce nom d’utilisateur existe déjà.'
  }

  if (pEmail) {
    const emailConflict =
      users.some((u) => (selfId && u.id === selfId ? false : normalizeEmail(u.email) === pEmail)) ||
      admins.some((a) => normalizeEmail(a.email) === pEmail) ||
      adminRequests.some((r) => normalizeEmail(r.email) === pEmail)
    if (emailConflict) return 'Cet email existe déjà.'
  }

  if (pPhone) {
    const phoneConflict =
      users.some((u) => (selfId && u.id === selfId ? false : normalizePhone(u.phone) === pPhone)) ||
      adminRequests.some((r) => (selfId && r.id === selfId ? false : normalizePhone(r.phone) === pPhone))
    if (phoneConflict) return 'Ce numéro existe déjà.'
  }
  return ''
}

function hasDuplicateAdmin(data, payload, selfId) {
  const admins = Array.isArray(data?.admins) ? data.admins : []
  const adminRequests = Array.isArray(data?.admin_requests) ? data.admin_requests : []
  const pUsername = normalizeText(payload?.username)

  if (pUsername) {
    const usernameConflict =
      admins.some((a) => (selfId && a.id === selfId ? false : normalizeText(a.username) === pUsername)) ||
      adminRequests.some((r) => normalizeText(r.username) === pUsername)
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

function hasDuplicateAdminRequest(data, payload, selfId) {
  const users = Array.isArray(data?.users) ? data.users : []
  const admins = Array.isArray(data?.admins) ? data.admins : []
  const adminRequests = Array.isArray(data?.admin_requests) ? data.admin_requests : []
  const pUsername = normalizeText(payload?.username)
  const pEmail = normalizeEmail(payload?.email)
  const pPhone = normalizePhone(payload?.phone)

  if (pUsername) {
    const conflict =
      adminRequests.some((r) => (selfId && r.id === selfId ? false : normalizeText(r.username) === pUsername)) ||
      users.some((u) => normalizeText(u.username) === pUsername) ||
      admins.some((a) => normalizeText(a.username) === pUsername)
    if (conflict) return 'Ce nom d’utilisateur existe déjà.'
  }

  if (pEmail) {
    const emailConflict =
      adminRequests.some((r) => (selfId && r.id === selfId ? false : normalizeEmail(r.email) === pEmail)) ||
      users.some((u) => normalizeEmail(u.email) === pEmail) ||
      admins.some((a) => normalizeEmail(a.email) === pEmail)
    if (emailConflict) return 'Cet email existe déjà.'
  }

  if (pPhone) {
    const phoneConflict =
      adminRequests.some((r) => (selfId && r.id === selfId ? false : normalizePhone(r.phone) === pPhone)) ||
      users.some((u) => normalizePhone(u.phone) === pPhone)
    if (phoneConflict) return 'Ce numéro existe déjà.'
  }

  return ''
}

function hasDuplicateEntreprise(data, payload, selfId) {
  const entreprises = Array.isArray(data?.entreprises) ? data.entreprises : []
  const adminRequests = Array.isArray(data?.admin_requests) ? data.admin_requests : []
  const pName = normalizeText(payload?.name)

  if (!pName) return ''
  const conflict =
    entreprises.some((e) => (selfId && e.id === selfId ? false : normalizeText(e.name) === pName)) ||
    adminRequests.some((r) => normalizeText(r.entrepriseName) === pName)
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

// Minimal auth endpoint
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' })
  }
  const users = Array.isArray(db.data?.users) ? db.data.users : []
  const user = users.find((u) => u.username === username && u.password === password)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const role = String(user.role || '').toUpperCase()
  const status = String(user.status || '').toUpperCase()
  if (role === 'ADMIN' && status !== 'ACTIF') {
    return res.status(403).json({ error: 'Accès interdit. Décision du Super Admin.' })
  }
  const safeUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  }
  db.data.sessions = [{ id: 'session-current', userId: user.id, createdAt: new Date().toISOString() }]
  db.write()
  return res.json({ user: safeUser })
})

// AuthContext simulated API (frontend consumes this)
app.get('/authContext', (req, res) => {
  const ctx = db.data.authContext || { userId: null, impersonation: null }
  if (!ctx.userId) return res.json({ user: null, impersonation: null })
  const users = Array.isArray(db.data?.users) ? db.data.users : []
  const user = users.find((u) => u.id === ctx.userId)
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
  const user = users.find((u) => u.username === username && u.password === password)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  const role = String(user.role || '').toUpperCase()
  const status = String(user.status || '').toUpperCase()
  if (role === 'ADMIN' && status !== 'ACTIF') {
    return res.status(403).json({ error: 'Accès interdit. Décision du Super Admin.' })
  }
  db.data.authContext = { userId: user.id, impersonation: null, updatedAt: new Date().toISOString() }
  await db.write()
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
  db.data.authContext = { userId: null, impersonation: null, updatedAt: new Date().toISOString() }
  await db.write()
  return res.json({ ok: true })
})

app.post('/authContext/impersonate', async (req, res) => {
  const { adminId, adminName, userId } = req.body || {}
  if (!adminId || !adminName) return res.status(400).json({ error: 'Missing admin' })
  const ctx = db.data.authContext || { userId: null }
  if (!ctx.userId) return res.status(401).json({ error: 'Not authenticated' })
  db.data.authContext = {
    ...ctx,
    impersonation: { adminId, adminName, userId: userId || null },
    updatedAt: new Date().toISOString(),
  }
  await db.write()
  return res.json({ ok: true })
})

app.post('/authContext/clear-impersonation', async (req, res) => {
  const ctx = db.data.authContext || { userId: null }
  if (!ctx.userId) return res.status(401).json({ error: 'Not authenticated' })
  db.data.authContext = { ...ctx, impersonation: null, updatedAt: new Date().toISOString() }
  await db.write()
  return res.json({ ok: true })
})

app.get('/auth/session', (req, res) => {
  const sessions = Array.isArray(db.data?.sessions) ? db.data.sessions : []
  const session = sessions[0]
  if (!session) {
    return res.status(401).json({ error: 'No active session' })
  }
  const users = Array.isArray(db.data?.users) ? db.data.users : []
  const user = users.find((u) => u.id === session.userId)
  if (!user) {
    return res.status(401).json({ error: 'Session user not found' })
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
  db.data.sessions = []
  await db.write()
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
  if (name === 'clients') {
    const { role, adminId } = getAuthContextUser()
    if (!role) {
      data = []
    } else if (role === 'SUPER_ADMIN' && !adminId) {
      // no filter for super admin (not impersonating)
    } else {
      data = Array.isArray(data) ? data.filter((c) => c.adminId === adminId) : []
    }
  }
  res.locals.data = data
  next?.()
})

app.get('/:name/:id', (req, res, next) => {
  const { name = '', id = '' } = req.params
  let data = service.findById(name, id, req.query)
  if (name === 'clients') {
    const { role, adminId } = getAuthContextUser()
    if (!role) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    if (role === 'SUPER_ADMIN' && !adminId) {
      // allowed
    } else if (data?.adminId !== adminId) {
      return res.status(403).json({ error: 'Access forbidden' })
    }
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
      if (role === 'SUPER_ADMIN' && !adminId) {
        // super admin can create without forced adminId
      } else {
        req.body.adminId = adminId
      }
      if (hasDuplicateClient(db.data, req.body, undefined, req.body.adminId)) {
        return res.status(409).json({ error: 'Client existe déjà avec ce numéro ou cet email pour cet admin.' })
      }
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
    if (name === 'admin_requests') {
      const conflict = hasDuplicateAdminRequest(db.data, req.body)
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
      const { role, adminId } = getAuthContextUser()
      if (!role) return res.status(401).json({ error: 'Not authenticated' })
      if (role === 'SUPER_ADMIN' && !adminId) {
        // allowed
      } else if (req.body.adminId && req.body.adminId !== adminId) {
        return res.status(403).json({ error: 'Access forbidden' })
      } else {
        req.body.adminId = adminId
      }
      if (hasDuplicateClient(db.data, req.body, req.body.id, req.body.adminId)) {
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
    if (name === 'admin_requests') {
      const conflict = hasDuplicateAdminRequest(db.data, req.body, req.body.id)
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
    if (name === 'clients') {
      const { role, adminId } = getAuthContextUser()
      if (!role) return res.status(401).json({ error: 'Not authenticated' })
      const existing = service.findById(name, id, req.query)
      if (role === 'SUPER_ADMIN' && !adminId) {
        // allowed
      } else if (existing?.adminId !== adminId) {
        return res.status(403).json({ error: 'Access forbidden' })
      } else {
        req.body.adminId = adminId
      }
      if (hasDuplicateClient(db.data, req.body, id, req.body.adminId)) {
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
    res.locals.data = await service.updateById(name, id, req.body)
    await db.write()
  }
  next?.()
})

app.patch('/:name', async (req, res, next) => {
  const { name = '' } = req.params
  if (isItem(req.body)) {
    if (name === 'clients') {
      const { role, adminId } = getAuthContextUser()
      if (!role) return res.status(401).json({ error: 'Not authenticated' })
      if (role === 'SUPER_ADMIN' && !adminId) {
        // allowed
      } else if (req.body.adminId && req.body.adminId !== adminId) {
        return res.status(403).json({ error: 'Access forbidden' })
      } else {
        req.body.adminId = adminId
      }
      if (hasDuplicateClient(db.data, req.body, req.body.id, req.body.adminId)) {
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
    if (name === 'admin_requests') {
      const conflict = hasDuplicateAdminRequest(db.data, req.body, req.body.id)
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
      const existing = service.findById(name, id, req.query)
      if (role === 'SUPER_ADMIN' && !adminId) {
        // allowed
      } else if (existing?.adminId !== adminId) {
        return res.status(403).json({ error: 'Access forbidden' })
      } else {
        req.body.adminId = adminId
      }
      if (hasDuplicateClient(db.data, req.body, id, req.body.adminId)) {
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
    if (name === 'admin_requests') {
      const conflict = hasDuplicateAdminRequest(db.data, req.body, id)
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
    const existing = service.findById(name, id, req.query)
    if (role === 'SUPER_ADMIN' && !adminId) {
      // allowed
    } else if (existing?.adminId !== adminId) {
      return res.status(403).json({ error: 'Access forbidden' })
    }
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
