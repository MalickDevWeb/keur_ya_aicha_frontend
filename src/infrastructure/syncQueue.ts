import type { ClientCreateDTO, ClientUpdateDTO } from '@/dto/backend/requests'
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
      type: 'UPDATE_CLIENT'
      payload: {
        clientId: string
        data: ClientUpdateDTO
      }
      idempotencyKey: string
      createdAt: number
    }
  | {
      type: 'DELETE_CLIENT'
      payload: {
        clientId: string
      }
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

export function isOfflineSyncEnabled(): boolean {
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

function buildUpdateClientIdempotencyKey(clientId: string): string {
  const safeClientId = String(clientId || '').trim()
  if (safeClientId) return `update-client:${safeClientId}:${Date.now()}`
  return `update-client:generated:${Date.now()}`
}

function buildDeleteClientIdempotencyKey(clientId: string): string {
  const safeClientId = String(clientId || '').trim()
  if (safeClientId) return `delete-client:${safeClientId}:${Date.now()}`
  return `delete-client:generated:${Date.now()}`
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

function isLikelyNotFoundError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || error || '').toLowerCase()
  return message.includes('ressource non trouvée') || message.includes('resource not found')
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
  if (action.type === 'UPDATE_CLIENT') {
    const safeClientId = String(action.payload?.clientId || '').trim()
    return `Client ${safeClientId || '(sans id)'}`
  }
  if (action.type === 'DELETE_CLIENT') {
    const safeClientId = String(action.payload?.clientId || '').trim()
    return `Suppression client ${safeClientId || '(sans id)'}`
  }
  const _exhaustiveCheck: never = action
  return _exhaustiveCheck
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

function emitQueueUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_QUEUE_UPDATED_EVENT))
  }
}

function emitActionEnqueued(action: SyncAction): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(OFFLINE_SYNC_ACTION_ENQUEUED_EVENT, {
      detail: { type: action.type, idempotencyKey: action.idempotencyKey },
    })
  )
}

async function removeSyncQueueEntry(key: IDBValidKey): Promise<void> {
  await withStore(OFFLINE_STORES.SYNC_QUEUE, 'readwrite', async (store) => {
    await idbRequestToPromise(store.delete(key))
  })
  emitQueueUpdated()
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
      headers: {
        'x-idempotency-key': entry.value.idempotencyKey,
      },
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

async function processUpdateClientAction(entry: SyncQueueEntry): Promise<'processed' | 'skipped'> {
  const payload = entry.value.payload as { clientId?: string; data?: ClientUpdateDTO }
  const clientId = String(payload?.clientId || '').trim()
  if (!clientId) {
    await removeSyncQueueEntry(entry.key)
    return 'skipped'
  }

  try {
    await apiFetch(`/clients/${encodeURIComponent(clientId)}`, {
      method: 'PUT',
      headers: {
        'x-idempotency-key': entry.value.idempotencyKey,
      },
      body: JSON.stringify(payload.data || {}),
    })
    await removeSyncQueueEntry(entry.key)
    return 'processed'
  } catch (error) {
    if (isLikelyNotFoundError(error)) {
      await removeSyncQueueEntry(entry.key)
      return 'skipped'
    }
    throw error
  }
}

async function processDeleteClientAction(entry: SyncQueueEntry): Promise<'processed' | 'skipped'> {
  const payload = entry.value.payload as { clientId?: string }
  const clientId = String(payload?.clientId || '').trim()
  if (!clientId) {
    await removeSyncQueueEntry(entry.key)
    return 'skipped'
  }

  try {
    await apiFetch(`/clients/${encodeURIComponent(clientId)}`, {
      method: 'DELETE',
      headers: {
        'x-idempotency-key': entry.value.idempotencyKey,
      },
    })
    await removeSyncQueueEntry(entry.key)
    return 'processed'
  } catch (error) {
    if (isLikelyNotFoundError(error)) {
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
      headers: {
        'x-idempotency-key': entry.value.idempotencyKey,
      },
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
      headers: {
        'x-idempotency-key': entry.value.idempotencyKey,
      },
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
  emitQueueUpdated()
  emitActionEnqueued(action)
}

export async function enqueueUpdateClientAction(clientId: string, data: ClientUpdateDTO): Promise<void> {
  if (!isOfflineSyncEnabled()) return

  const safeClientId = String(clientId || '').trim()
  if (!safeClientId) return

  const entries = await getSyncQueueEntries()
  const createEntry = entries.find(
    (entry) => entry.value.type === 'CREATE_CLIENT' && String((entry.value.payload as ClientCreateDTO)?.id || '').trim() === safeClientId
  )

  if (createEntry && createEntry.value.type === 'CREATE_CLIENT') {
    const mergedPayload: ClientCreateDTO = {
      ...createEntry.value.payload,
      ...data,
      id: safeClientId,
    }
    const mergedAction: SyncAction = {
      ...createEntry.value,
      payload: mergedPayload,
      createdAt: Date.now(),
    }

    await withStore(OFFLINE_STORES.SYNC_QUEUE, 'readwrite', async (store) => {
      await idbRequestToPromise(store.put(mergedAction, createEntry.key))
    })

    emitQueueUpdated()
    emitActionEnqueued(mergedAction)
    return
  }

  const existingUpdateEntry = entries.find(
    (entry) => entry.value.type === 'UPDATE_CLIENT' && String((entry.value.payload as { clientId?: string })?.clientId || '').trim() === safeClientId
  )

  const action: SyncAction = {
    type: 'UPDATE_CLIENT',
    payload: {
      clientId: safeClientId,
      data,
    },
    idempotencyKey: buildUpdateClientIdempotencyKey(safeClientId),
    createdAt: Date.now(),
  }

  await withStore(OFFLINE_STORES.SYNC_QUEUE, 'readwrite', async (store) => {
    if (existingUpdateEntry) {
      await idbRequestToPromise(store.put(action, existingUpdateEntry.key))
      return
    }
    await idbRequestToPromise(store.add(action))
  })

  emitQueueUpdated()
  emitActionEnqueued(action)
}

export async function enqueueDeleteClientAction(clientId: string): Promise<void> {
  if (!isOfflineSyncEnabled()) return

  const safeClientId = String(clientId || '').trim()
  if (!safeClientId) return

  const action: SyncAction = {
    type: 'DELETE_CLIENT',
    payload: {
      clientId: safeClientId,
    },
    idempotencyKey: buildDeleteClientIdempotencyKey(safeClientId),
    createdAt: Date.now(),
  }

  await withStore(OFFLINE_STORES.SYNC_QUEUE, 'readwrite', async (store) => {
    await idbRequestToPromise(store.add(action))
  })

  emitQueueUpdated()
  emitActionEnqueued(action)
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
  emitQueueUpdated()
  emitActionEnqueued(action)
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
  emitQueueUpdated()
  emitActionEnqueued(action)
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
  emitQueueUpdated()
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
      if (entry.value.type === 'UPDATE_CLIENT') {
        const result = await processUpdateClientAction(entry)
        if (result === 'processed') processed += 1
        if (result === 'skipped') skipped += 1
      }
      if (entry.value.type === 'DELETE_CLIENT') {
        const result = await processDeleteClientAction(entry)
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
