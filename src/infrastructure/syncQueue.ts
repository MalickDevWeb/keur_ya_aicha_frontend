import type { ClientCreateDTO } from '@/dto/backend/requests'
import type { AdminCreateDTO, UserCreateDTO } from '@/dto/frontend/requests'
import { apiFetch } from '@/services/http'
import { ensureRuntimeConfigLoaded, getApiBaseUrl } from '@/services/runtimeConfig'
import { OFFLINE_STORES, idbRequestToPromise, withStore } from './indexedDb'

export const OFFLINE_SYNC_STARTED_EVENT = 'offline-sync-started'
export const OFFLINE_SYNC_FINISHED_EVENT = 'offline-sync-finished'
export const OFFLINE_SYNC_QUEUE_UPDATED_EVENT = 'offline-sync-queue-updated'
export const OFFLINE_SYNC_ACTION_ENQUEUED_EVENT = 'offline-sync-action-enqueued'

type SyncAction =
  | {
      type: 'CREATE_CLIENT'
      payload: ClientCreateDTO
      idempotencyKey: string
      createdAt: number
    }
  | {
      type: 'CREATE_USER'
      payload: UserCreateDTO
      idempotencyKey: string
      createdAt: number
    }
  | {
      type: 'CREATE_ADMIN'
      payload: AdminCreateDTO
      idempotencyKey: string
      createdAt: number
    }

type SyncQueueEntry = {
  key: IDBValidKey
  value: SyncAction
}

export type SyncQueueListItem = {
  key: string
  type: SyncAction['type']
  createdAt: number
  idempotencyKey: string
  summary: string
}

const OFFLINE_SYNC_ENABLED =
  String(import.meta.env.VITE_OFFLINE_SYNC_ENABLED ?? 'true').trim().toLowerCase() === 'true'

function isOfflineSyncEnabled(): boolean {
  return OFFLINE_SYNC_ENABLED
}

function isBrowserOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine !== false
}

function buildIdempotencyKey(payload: ClientCreateDTO): string {
  const clientId = String(payload?.id || '').trim()
  if (clientId) return `create-client:${clientId}`
  return `create-client:generated:${Date.now()}`
}

function buildUserIdempotencyKey(payload: UserCreateDTO): string {
  const userId = String(payload?.id || '').trim()
  if (userId) return `create-user:${userId}`
  const username = String(payload?.username || '').trim()
  if (username) return `create-user:username:${username}`
  return `create-user:generated:${Date.now()}`
}

function buildAdminIdempotencyKey(payload: AdminCreateDTO): string {
  const adminId = String(payload?.id || '').trim()
  if (adminId) return `create-admin:${adminId}`
  const username = String(payload?.username || '').trim()
  if (username) return `create-admin:username:${username}`
  return `create-admin:generated:${Date.now()}`
}

function isLikelyDuplicateCreateError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || error || '').toLowerCase()
  return (
    message.includes('client existe déjà') ||
    message.includes('client existe deja') ||
    message.includes('nom d’utilisateur existe déjà') ||
    message.includes('nom dutilisateur existe deja') ||
    message.includes('cet email existe déjà') ||
    message.includes('cet email existe deja') ||
    message.includes('ce numéro existe déjà') ||
    message.includes('ce numero existe deja')
  )
}

function buildQueueItemSummary(action: SyncAction): string {
  if (action.type === 'CREATE_CLIENT') {
    const firstName = String(action.payload?.firstName || '').trim()
    const lastName = String(action.payload?.lastName || '').trim()
    const phone = String(action.payload?.phone || '').trim()
    const name = `${firstName} ${lastName}`.trim() || 'Client'
    return `${name}${phone ? ` (${phone})` : ''}`
  }
  if (action.type === 'CREATE_USER') {
    const username = String(action.payload?.username || '').trim()
    const name = String(action.payload?.name || '').trim()
    return `${name || 'Utilisateur'}${username ? ` (${username})` : ''}`
  }
  if (action.type === 'CREATE_ADMIN') {
    const username = String(action.payload?.username || '').trim()
    const name = String(action.payload?.name || '').trim()
    return `${name || 'Admin'}${username ? ` (${username})` : ''}`
  }
  return action.type
}

async function getSyncQueueEntries(): Promise<SyncQueueEntry[]> {
  return withStore(OFFLINE_STORES.SYNC_QUEUE, 'readonly', async (store) => {
    const [values, keys] = await Promise.all([
      idbRequestToPromise(store.getAll()) as Promise<SyncAction[]>,
      idbRequestToPromise(store.getAllKeys()),
    ])

    return values.map((value, index) => ({ key: keys[index], value }))
  })
}

async function removeSyncQueueEntry(key: IDBValidKey): Promise<void> {
  await withStore(OFFLINE_STORES.SYNC_QUEUE, 'readwrite', async (store) => {
    await idbRequestToPromise(store.delete(key))
  })
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_QUEUE_UPDATED_EVENT))
  }
}

async function checkEntityExists(resourcePath: '/clients' | '/users' | '/admins', entityId: string): Promise<boolean> {
  const safeId = String(entityId || '').trim()
  if (!safeId) return false

  await ensureRuntimeConfigLoaded()
  const apiBase = getApiBaseUrl()
  const url = `${apiBase}${resourcePath}/${encodeURIComponent(safeId)}`

  const response = await fetch(url, { method: 'GET' })
  if (response.status === 404) return false
  if (response.ok) return true

  throw new Error(`Entity existence check failed for ${resourcePath} with status ${response.status}.`)
}

async function processCreateClientAction(entry: SyncQueueEntry): Promise<'processed' | 'skipped'> {
  const payload = entry.value.payload
  const clientId = String(payload?.id || '').trim()

  if (clientId) {
    const exists = await checkEntityExists('/clients', clientId)
    if (exists) {
      await removeSyncQueueEntry(entry.key)
      return 'skipped'
    }
  }

  try {
    await apiFetch('/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await removeSyncQueueEntry(entry.key)
    return 'processed'
  } catch (error) {
    if (isLikelyDuplicateCreateError(error)) {
      await removeSyncQueueEntry(entry.key)
      return 'skipped'
    }
    throw error
  }
}

async function processCreateUserAction(entry: SyncQueueEntry): Promise<'processed' | 'skipped'> {
  const payload = entry.value.payload as UserCreateDTO
  const userId = String(payload?.id || '').trim()

  if (userId) {
    const exists = await checkEntityExists('/users', userId)
    if (exists) {
      await removeSyncQueueEntry(entry.key)
      return 'skipped'
    }
  }

  try {
    await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await removeSyncQueueEntry(entry.key)
    return 'processed'
  } catch (error) {
    if (isLikelyDuplicateCreateError(error)) {
      await removeSyncQueueEntry(entry.key)
      return 'skipped'
    }
    throw error
  }
}

async function processCreateAdminAction(entry: SyncQueueEntry): Promise<'processed' | 'skipped'> {
  const payload = entry.value.payload as AdminCreateDTO
  const adminId = String(payload?.id || '').trim()

  if (adminId) {
    const exists = await checkEntityExists('/admins', adminId)
    if (exists) {
      await removeSyncQueueEntry(entry.key)
      return 'skipped'
    }
  }

  try {
    await apiFetch('/admins', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await removeSyncQueueEntry(entry.key)
    return 'processed'
  } catch (error) {
    if (isLikelyDuplicateCreateError(error)) {
      await removeSyncQueueEntry(entry.key)
      return 'skipped'
    }
    throw error
  }
}

export async function enqueueCreateClientAction(payload: ClientCreateDTO): Promise<void> {
  if (!isOfflineSyncEnabled()) return

  const action: SyncAction = {
    type: 'CREATE_CLIENT',
    payload,
    idempotencyKey: buildIdempotencyKey(payload),
    createdAt: Date.now(),
  }

  await withStore(OFFLINE_STORES.SYNC_QUEUE, 'readwrite', async (store) => {
    await idbRequestToPromise(store.add(action))
  })
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_QUEUE_UPDATED_EVENT))
    window.dispatchEvent(
      new CustomEvent(OFFLINE_SYNC_ACTION_ENQUEUED_EVENT, {
        detail: { type: action.type, idempotencyKey: action.idempotencyKey },
      })
    )
  }
}

export async function enqueueCreateUserAction(payload: UserCreateDTO): Promise<void> {
  if (!isOfflineSyncEnabled()) return

  const action: SyncAction = {
    type: 'CREATE_USER',
    payload,
    idempotencyKey: buildUserIdempotencyKey(payload),
    createdAt: Date.now(),
  }

  await withStore(OFFLINE_STORES.SYNC_QUEUE, 'readwrite', async (store) => {
    await idbRequestToPromise(store.add(action))
  })
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_QUEUE_UPDATED_EVENT))
    window.dispatchEvent(
      new CustomEvent(OFFLINE_SYNC_ACTION_ENQUEUED_EVENT, {
        detail: { type: action.type, idempotencyKey: action.idempotencyKey },
      })
    )
  }
}

export async function enqueueCreateAdminAction(payload: AdminCreateDTO): Promise<void> {
  if (!isOfflineSyncEnabled()) return

  const action: SyncAction = {
    type: 'CREATE_ADMIN',
    payload,
    idempotencyKey: buildAdminIdempotencyKey(payload),
    createdAt: Date.now(),
  }

  await withStore(OFFLINE_STORES.SYNC_QUEUE, 'readwrite', async (store) => {
    await idbRequestToPromise(store.add(action))
  })
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_QUEUE_UPDATED_EVENT))
    window.dispatchEvent(
      new CustomEvent(OFFLINE_SYNC_ACTION_ENQUEUED_EVENT, {
        detail: { type: action.type, idempotencyKey: action.idempotencyKey },
      })
    )
  }
}

export async function getPendingSyncCount(): Promise<number> {
  if (!isOfflineSyncEnabled()) return 0
  const entries = await getSyncQueueEntries()
  return entries.length
}

export async function listPendingSyncEntries(): Promise<SyncQueueListItem[]> {
  if (!isOfflineSyncEnabled()) return []

  const entries = await getSyncQueueEntries()
  return entries.map((entry) => ({
    key: String(entry.key),
    type: entry.value.type,
    createdAt: Number(entry.value.createdAt || 0),
    idempotencyKey: String(entry.value.idempotencyKey || ''),
    summary: buildQueueItemSummary(entry.value),
  }))
}

export async function clearSyncQueue(): Promise<number> {
  if (!isOfflineSyncEnabled()) return 0

  const entries = await getSyncQueueEntries()
  await withStore(OFFLINE_STORES.SYNC_QUEUE, 'readwrite', async (store) => {
    await idbRequestToPromise(store.clear())
  })
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_QUEUE_UPDATED_EVENT))
  }
  return entries.length
}

export async function syncQueuedActions(): Promise<{ processed: number; failed: number; skipped: number }> {
  if (!isOfflineSyncEnabled()) {
    return { processed: 0, failed: 0, skipped: 0 }
  }

  if (!isBrowserOnline()) {
    return { processed: 0, failed: 0, skipped: 0 }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_STARTED_EVENT))
  }

  const entries = await getSyncQueueEntries()
  let processed = 0
  let failed = 0
  let skipped = 0

  for (const entry of entries) {
    try {
      if (entry.value.type === 'CREATE_CLIENT') {
        const result = await processCreateClientAction(entry)
        if (result === 'processed') processed += 1
        if (result === 'skipped') skipped += 1
      }
      if (entry.value.type === 'CREATE_USER') {
        const result = await processCreateUserAction(entry)
        if (result === 'processed') processed += 1
        if (result === 'skipped') skipped += 1
      }
      if (entry.value.type === 'CREATE_ADMIN') {
        const result = await processCreateAdminAction(entry)
        if (result === 'processed') processed += 1
        if (result === 'skipped') skipped += 1
      }
    } catch {
      failed += 1
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(OFFLINE_SYNC_FINISHED_EVENT, {
        detail: { processed, failed, skipped },
      })
    )
  }

  return { processed, failed, skipped }
}
