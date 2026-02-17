const DB_NAME = 'kya_offline_db'
const DB_VERSION = 1

export const OFFLINE_STORES = {
  HTTP_CACHE: 'http_cache',
  SYNC_QUEUE: 'sync_queue',
} as const

type StoreName = (typeof OFFLINE_STORES)[keyof typeof OFFLINE_STORES]

let dbPromise: Promise<IDBDatabase> | null = null

function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
}

export function openIndexedDb(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'))
  }

  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(OFFLINE_STORES.HTTP_CACHE)) {
        const cacheStore = db.createObjectStore(OFFLINE_STORES.HTTP_CACHE, { keyPath: 'cacheKey' })
        cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(OFFLINE_STORES.SYNC_QUEUE)) {
        db.createObjectStore(OFFLINE_STORES.SYNC_QUEUE, { autoIncrement: true })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'))
  })

  return dbPromise
}

export function idbRequestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'))
  })
}

export async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  worker: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await openIndexedDb()
  const tx = db.transaction(storeName, mode)
  const store = tx.objectStore(storeName)

  const result = await worker(store)

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed.'))
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted.'))
  })

  return result
}
