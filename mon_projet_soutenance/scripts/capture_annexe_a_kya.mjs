#!/usr/bin/env node
/**
 * Capture des ecrans (Annexe A) pour le memoire KYA.
 *
 * Prerequis:
 * - Backend Next.js demarre sur http://localhost:3000
 * - Frontend Vite demarre sur http://localhost:5173
 * - Comptes seed dispo: admin@kya.local / Admin@123456
 *
 * Sortie:
 * - mon_projet_soutenance/soutenance_pack_assets/captures_app/*.jpg
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import WebSocket from 'ws'

const FRONTEND_ORIGIN = process.env.KYA_FRONTEND_ORIGIN || 'http://localhost:5173'
const BACKEND_API_BASE = process.env.KYA_BACKEND_API_BASE || 'http://localhost:3000/api'

const ADMIN_LOGIN = process.env.KYA_ADMIN_LOGIN || 'admin@kya.local'
const ADMIN_PASSWORD = process.env.KYA_ADMIN_PASSWORD || 'Admin@123456'

const OUT_DIR = path.resolve(
  process.cwd(),
  'mon_projet_soutenance/soutenance_pack_assets/captures_app'
)

const CHROME_BIN = process.env.CHROME_BIN || 'google-chrome'
const REMOTE_DEBUG_PORT = Number(process.env.KYA_CHROME_DEBUG_PORT || 9222)

const VIEWPORT = {
  width: Number(process.env.KYA_VIEWPORT_W || 1440),
  height: Number(process.env.KYA_VIEWPORT_H || 900),
  deviceScaleFactor: 1,
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function parseSetCookie(setCookie) {
  const raw = String(setCookie || '').trim()
  if (!raw) return null
  const parts = raw.split(';').map((p) => p.trim()).filter(Boolean)
  const [nameValue, ...attrs] = parts
  const eq = nameValue.indexOf('=')
  if (eq <= 0) return null
  const name = nameValue.slice(0, eq).trim()
  const value = nameValue.slice(eq + 1)

  const cookie = {
    name,
    value,
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: undefined,
    expires: undefined, // seconds since epoch
  }

  for (const attr of attrs) {
    const [kRaw, vRaw] = attr.split('=')
    const k = String(kRaw || '').trim().toLowerCase()
    const v = typeof vRaw === 'undefined' ? '' : String(vRaw).trim()
    if (k === 'path' && v) cookie.path = v
    if (k === 'httponly') cookie.httpOnly = true
    if (k === 'secure') cookie.secure = true
    if (k === 'samesite' && v) {
      const vv = v.toLowerCase()
      cookie.sameSite = vv === 'lax' ? 'Lax' : vv === 'strict' ? 'Strict' : 'None'
    }
    if (k === 'max-age' && v) {
      const maxAge = Number(v)
      if (Number.isFinite(maxAge)) cookie.expires = Math.floor(Date.now() / 1000) + maxAge
    }
    if (k === 'expires' && v && !cookie.expires) {
      const ts = Date.parse(v)
      if (Number.isFinite(ts)) cookie.expires = Math.floor(ts / 1000)
    }
  }

  return cookie
}

function cookiesToJar(cookies) {
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ')
}

function getCookieValue(cookies, name) {
  const match = cookies.find((c) => c.name === name)
  return match ? match.value : ''
}

async function httpJson(url, options = {}) {
  const res = await fetch(url, options)
  const text = await res.text().catch(() => '')
  const data = text ? JSON.parse(text) : null
  return { res, data }
}

async function loginAndMaybeSeedDemo() {
  const loginUrl = `${BACKEND_API_BASE}/authContext/login`
  const { res, data } = await httpJson(loginUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: FRONTEND_ORIGIN,
      referer: `${FRONTEND_ORIGIN}/login`,
      // Next.js runtime does not expose remoteAddress reliably; backend expects one of these headers.
      'x-forwarded-for': '127.0.0.1',
      'x-real-ip': '127.0.0.1',
    },
    body: JSON.stringify({
      identifiant: ADMIN_LOGIN,
      motDePasse: ADMIN_PASSWORD,
    }),
  })

  if (!res.ok) {
    throw new Error(`Login failed: HTTP ${res.status} ${JSON.stringify(data || {})}`)
  }

  const setCookies =
    (typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : null) ||
    [res.headers.get('set-cookie')].filter(Boolean)

  const cookies = setCookies.map(parseSetCookie).filter(Boolean)
  const jar = cookiesToJar(cookies)
  const csrf = getCookieValue(cookies, 'kya_csrf_token')

  // Create a tiny demo dataset if empty (best-effort).
  try {
    const listUrl = `${BACKEND_API_BASE}/clients?view=summary`
    const list = await httpJson(listUrl, {
      headers: {
        cookie: jar,
        origin: FRONTEND_ORIGIN,
        referer: `${FRONTEND_ORIGIN}/dashboard`,
        'x-forwarded-for': '127.0.0.1',
        'x-real-ip': '127.0.0.1',
      },
    })
    const existing = Array.isArray(list.data) ? list.data : []
    if (existing.length === 0) {
      const now = Date.now()
      const basePhone = (suffix) => `77${String((now + suffix) % 10_000_000).padStart(7, '0')}`
      const baseCni = (suffix) => String(10_000_000_000_0 + ((now + suffix) % 9_999_999_999)).slice(0, 13)

      const demoClients = [
        {
          firstName: 'Amadou',
          lastName: 'Diallo',
          phone: basePhone(11),
          email: 'amadou.diallo@demo.kya.local',
          cni: baseCni(11),
          status: 'active',
          rentals: [
            {
              propertyType: 'apartment',
              propertyName: 'Appartement A1',
              monthlyRent: 150000,
              startDate: new Date(now - 120 * 24 * 3600 * 1000).toISOString(),
              deposit: {
                total: 300000,
                paid: 300000,
                payments: [
                  {
                    amount: 300000,
                    date: new Date(now - 118 * 24 * 3600 * 1000).toISOString(),
                    receiptNumber: `DEP-${now}`,
                  },
                ],
              },
              payments: [
                {
                  periodStart: new Date(now - 90 * 24 * 3600 * 1000).toISOString(),
                  periodEnd: new Date(now - 60 * 24 * 3600 * 1000).toISOString(),
                  dueDate: new Date(now - 55 * 24 * 3600 * 1000).toISOString(),
                  amount: 150000,
                  paidAmount: 150000,
                  status: 'paid',
                  payments: [
                    {
                      amount: 150000,
                      date: new Date(now - 70 * 24 * 3600 * 1000).toISOString(),
                      receiptNumber: `REC-${now}`,
                    },
                  ],
                },
              ],
              documents: [
                {
                  name: 'Contrat de bail (demo)',
                  type: 'contract',
                  url: 'https://example.com/contrat-demo.pdf',
                  uploadedAt: new Date(now - 117 * 24 * 3600 * 1000).toISOString(),
                  signed: true,
                },
              ],
            },
          ],
        },
        {
          firstName: 'Fatou',
          lastName: 'Sow',
          phone: basePhone(22),
          email: 'fatou.sow@demo.kya.local',
          cni: baseCni(22),
          status: 'active',
          rentals: [
            {
              propertyType: 'studio',
              propertyName: 'Studio B2',
              monthlyRent: 75000,
              startDate: new Date(now - 60 * 24 * 3600 * 1000).toISOString(),
              deposit: {
                total: 150000,
                paid: 75000,
                payments: [
                  {
                    amount: 75000,
                    date: new Date(now - 58 * 24 * 3600 * 1000).toISOString(),
                    receiptNumber: `DEP-${now + 1}`,
                  },
                ],
              },
              payments: [
                {
                  periodStart: new Date(now - 30 * 24 * 3600 * 1000).toISOString(),
                  periodEnd: new Date(now - 1 * 24 * 3600 * 1000).toISOString(),
                  dueDate: new Date(now + 4 * 24 * 3600 * 1000).toISOString(),
                  amount: 75000,
                  paidAmount: 0,
                  status: 'unpaid',
                  payments: [],
                },
              ],
              documents: [],
            },
          ],
        },
      ]

      for (const payload of demoClients) {
        const createUrl = `${BACKEND_API_BASE}/clients`
        // best effort; ignore conflicts
        await fetch(createUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            cookie: jar,
            origin: FRONTEND_ORIGIN,
            referer: `${FRONTEND_ORIGIN}/clients`,
            'x-csrf-token': csrf,
            'x-forwarded-for': '127.0.0.1',
            'x-real-ip': '127.0.0.1',
          },
          body: JSON.stringify(payload),
        }).catch(() => {})
      }
    }
  } catch {
    // ignore seeding
  }

  return { cookies, jar, csrf }
}

async function waitForChrome(port, timeoutMs = 10_000) {
  const start = Date.now()
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (res.ok) return
    } catch {
      // ignore
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error('Chrome remote debugging not ready')
    }
    await sleep(200)
  }
}

class CdpClient {
  constructor(ws) {
    this.ws = ws
    this.nextId = 1
    this.pending = new Map()
    this.eventWaiters = []

    ws.on('message', (raw) => {
      let msg
      try {
        msg = JSON.parse(String(raw))
      } catch {
        return
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) reject(new Error(JSON.stringify(msg.error)))
        else resolve(msg.result)
        return
      }
      if (msg.method) {
        const idx = this.eventWaiters.findIndex((w) => w.method === msg.method)
        if (idx >= 0) {
          const waiter = this.eventWaiters.splice(idx, 1)[0]
          waiter.resolve(msg.params || {})
        }
      }
    })
  }

  send(method, params = {}) {
    const id = this.nextId++
    const payload = { id, method, params }
    this.ws.send(JSON.stringify(payload))
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      setTimeout(() => {
        if (!this.pending.has(id)) return
        this.pending.delete(id)
        reject(new Error(`Timeout: ${method}`))
      }, 20_000)
    })
  }

  waitEvent(method, timeoutMs = 20_000) {
    return new Promise((resolve, reject) => {
      const waiter = { method, resolve }
      this.eventWaiters.push(waiter)
      setTimeout(() => {
        const idx = this.eventWaiters.indexOf(waiter)
        if (idx >= 0) this.eventWaiters.splice(idx, 1)
        reject(new Error(`Timeout waiting event: ${method}`))
      }, timeoutMs)
    })
  }
}

async function captureScreens(cookies) {
  ensureDir(OUT_DIR)

  const chromeArgs = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${REMOTE_DEBUG_PORT}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=/tmp/kya-chrome-profile-annexe-a-${process.pid}`,
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
  ]

  const chrome = spawn(CHROME_BIN, chromeArgs, {
    stdio: ['ignore', 'ignore', 'pipe'],
    env: process.env,
  })

  let chromeStderr = ''
  chrome.stderr.on('data', (d) => {
    chromeStderr += String(d || '')
    if (chromeStderr.length > 10_000) chromeStderr = chromeStderr.slice(-10_000)
  })

  await waitForChrome(REMOTE_DEBUG_PORT).catch((err) => {
    try { chrome.kill('SIGKILL') } catch {}
    throw err
  })

  // Recent Chrome versions require PUT for /json/new (GET returns a warning text).
  const targetRes = await fetch(`http://127.0.0.1:${REMOTE_DEBUG_PORT}/json/new`, { method: 'PUT' })
  const target = await targetRes.json()
  const wsUrl = target.webSocketDebuggerUrl
  if (!wsUrl) {
    try { chrome.kill('SIGKILL') } catch {}
    throw new Error('Missing webSocketDebuggerUrl from Chrome')
  }

  const ws = new WebSocket(wsUrl)
  await new Promise((resolve, reject) => {
    ws.once('open', resolve)
    ws.once('error', reject)
  })

  const cdp = new CdpClient(ws)
  await cdp.send('Page.enable')
  await cdp.send('Network.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    mobile: false,
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    deviceScaleFactor: VIEWPORT.deviceScaleFactor,
  })

  for (const c of cookies) {
    await cdp.send('Network.setCookie', {
      url: FRONTEND_ORIGIN,
      name: c.name,
      value: c.value,
      path: c.path || '/',
      httpOnly: Boolean(c.httpOnly),
      secure: Boolean(c.secure),
      sameSite: c.sameSite,
      expires: c.expires,
    })
  }

  const shots = [
    { key: 'A-1', path: '/login', file: 'A-1-login.jpg', waitMs: 900 },
    { key: 'A-2', path: '/dashboard', file: 'A-2-dashboard.jpg', waitMs: 1800 },
    { key: 'A-3', path: '/clients', file: 'A-3-clients.jpg', waitMs: 1800 },
    { key: 'A-4', path: '/rentals', file: 'A-4-rentals.jpg', waitMs: 1800 },
    { key: 'A-5', path: '/payments', file: 'A-5-payments.jpg', waitMs: 1800 },
    { key: 'A-6', path: '/documents', file: 'A-6-documents.jpg', waitMs: 1800 },
    { key: 'A-7', path: '/import/clients', file: 'A-7-import-clients.jpg', waitMs: 2000 },
    { key: 'A-8', path: '/archive/blacklist', file: 'A-8-blacklist.jpg', waitMs: 1800 },
  ]

  for (const shot of shots) {
    const url = `${FRONTEND_ORIGIN}${shot.path}`
    await cdp.send('Page.navigate', { url })
    await cdp.waitEvent('Page.loadEventFired', 25_000).catch(() => {})
    await sleep(shot.waitMs)

    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 80,
      fromSurface: true,
    })
    const outPath = path.join(OUT_DIR, shot.file)
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'))
    // eslint-disable-next-line no-console
    console.log(`[OK] ${shot.key} -> ${outPath}`)
  }

  try { ws.close() } catch {}
  try { chrome.kill('SIGTERM') } catch {}
  await sleep(300)
  try { chrome.kill('SIGKILL') } catch {}
}

async function main() {
  ensureDir(OUT_DIR)
  const { cookies } = await loginAndMaybeSeedDemo()
  await captureScreens(cookies)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[ERR]', err?.stack || String(err || 'Unknown error'))
  process.exitCode = 1
})
