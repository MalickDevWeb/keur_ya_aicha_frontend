import type { ImportRunDTO } from '@/dto/backend/responses/ImportRunDTO'
import type { ImportRunCreateDTO, ImportRunUpdateDTO } from '@/dto/backend/requests'
import { apiFetch } from '../http'

const IMPORT_RUNS_STORAGE_KEY = 'kya_import_runs_cache_v1'
const IMPORT_RUNS_TIMEOUT_MS = 10_000
const IMPORT_RUNS_UPDATED_EVENT = 'import-runs-updated'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

function dispatchImportRunsUpdated(): void {
  if (!isBrowser()) return
  window.dispatchEvent(new Event(IMPORT_RUNS_UPDATED_EVENT))
}

function safeParseRuns(raw: string | null): ImportRunDTO[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ImportRunDTO[]) : []
  } catch {
    return []
  }
}

function readLocalImportRuns(): ImportRunDTO[] {
  if (!isBrowser()) return []
  return safeParseRuns(localStorage.getItem(IMPORT_RUNS_STORAGE_KEY))
}

function sortImportRuns(runs: ImportRunDTO[]): ImportRunDTO[] {
  return [...runs].sort(
    (a, b) => new Date(b.createdAt ?? b.updatedAt ?? 0).getTime() - new Date(a.createdAt ?? a.updatedAt ?? 0).getTime()
  )
}

function mergeImportRuns(primary: ImportRunDTO[], secondary: ImportRunDTO[]): ImportRunDTO[] {
  const map = new Map<string, ImportRunDTO>()
  for (const run of secondary) {
    if (run?.id) map.set(run.id, run)
  }
  for (const run of primary) {
    if (!run?.id) continue
    const existing = map.get(run.id)
    if (!existing) {
      map.set(run.id, run)
      continue
    }
    const existingAt = new Date(existing.updatedAt ?? existing.createdAt ?? 0).getTime()
    const nextAt = new Date(run.updatedAt ?? run.createdAt ?? 0).getTime()
    map.set(run.id, nextAt >= existingAt ? run : existing)
  }
  return sortImportRuns(Array.from(map.values()))
}

function writeLocalImportRuns(runs: ImportRunDTO[]): void {
  if (!isBrowser()) return
  localStorage.setItem(IMPORT_RUNS_STORAGE_KEY, JSON.stringify(sortImportRuns(runs)))
}

function upsertLocalImportRun(run: ImportRunDTO): ImportRunDTO {
  const next = mergeImportRuns([run], readLocalImportRuns())
  writeLocalImportRuns(next)
  return run
}

function createLocalImportRun(data: ImportRunCreateDTO): ImportRunDTO {
  const now = new Date().toISOString()
  const id =
    String(data.id || '').trim() ||
    `imprun-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

  return {
    id,
    adminId: data.adminId,
    fileName: data.fileName,
    totalRows: data.totalRows,
    inserted: data.inserted || [],
    errors: data.errors || [],
    ignored: data.ignored ?? false,
    readSuccess: data.readSuccess ?? false,
    readErrors: data.readErrors ?? false,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  }
}

function patchLocalImportRun(id: string, data: ImportRunUpdateDTO): ImportRunDTO {
  const existing = readLocalImportRuns().find((run) => run.id === id)
  const now = new Date().toISOString()
  const next: ImportRunDTO = {
    id,
    adminId: existing?.adminId,
    fileName: data.fileName ?? existing?.fileName,
    totalRows: data.totalRows ?? existing?.totalRows,
    inserted: data.inserted ?? existing?.inserted ?? [],
    errors: data.errors ?? existing?.errors ?? [],
    ignored: data.ignored ?? existing?.ignored ?? false,
    readSuccess: data.readSuccess ?? existing?.readSuccess ?? false,
    readErrors: data.readErrors ?? existing?.readErrors ?? false,
    createdAt: existing?.createdAt || now,
    updatedAt: data.updatedAt || now,
  }
  upsertLocalImportRun(next)
  return next
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs = IMPORT_RUNS_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Le serveur d'import ne répond pas. L'import est gardé localement."))
    }, timeoutMs)
  })
  try {
    return await Promise.race([operation, timeoutPromise])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function createImportRun(data: ImportRunCreateDTO): Promise<ImportRunDTO> {
  const localRun = createLocalImportRun(data)
  upsertLocalImportRun(localRun)

  try {
    const remoteRun = await withTimeout(
      apiFetch<ImportRunDTO>('/import_runs', {
        method: 'POST',
        body: JSON.stringify({ ...data, id: localRun.id }),
      })
    )
    upsertLocalImportRun(remoteRun)
    dispatchImportRunsUpdated()
    return remoteRun
  } catch {
    dispatchImportRunsUpdated()
    return localRun
  }
}

export async function listImportRuns(): Promise<ImportRunDTO[]> {
  const localRuns = readLocalImportRuns()
  try {
    const remoteRuns = await withTimeout(apiFetch<ImportRunDTO[]>('/import_runs'))
    const normalizedRemoteRuns = Array.isArray(remoteRuns) ? remoteRuns : []
    const merged = mergeImportRuns(normalizedRemoteRuns, localRuns)
    writeLocalImportRuns(merged)
    return merged
  } catch {
    return sortImportRuns(localRuns)
  }
}

export async function updateImportRun(id: string, data: ImportRunUpdateDTO): Promise<ImportRunDTO> {
  const localRun = patchLocalImportRun(id, data)
  try {
    const remoteRun = await withTimeout(
      apiFetch<ImportRunDTO>(`/import_runs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    )
    upsertLocalImportRun(remoteRun)
    dispatchImportRunsUpdated()
    return remoteRun
  } catch {
    dispatchImportRunsUpdated()
    return localRun
  }
}

export async function markImportRunRead(
  id: string,
  type: 'success' | 'errors'
): Promise<ImportRunDTO> {
  return updateImportRun(id, type === 'success' ? { readSuccess: true } : { readErrors: true })
}
