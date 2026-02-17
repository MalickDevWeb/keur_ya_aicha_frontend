import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, RefreshCw, Trash2, WifiOff, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/contexts/ToastContext'
import {
  OFFLINE_SYNC_ACTION_ENQUEUED_EVENT,
  OFFLINE_SYNC_FINISHED_EVENT,
  OFFLINE_SYNC_QUEUE_UPDATED_EVENT,
  OFFLINE_SYNC_STARTED_EVENT,
  clearSyncQueue,
  getPendingSyncCount,
  listPendingSyncEntries,
  type SyncQueueListItem,
  syncQueuedActions,
} from '@/infrastructure/syncQueue'

type SyncSummary = {
  processed: number
  failed: number
  skipped: number
}

type EnqueuedActionDetail = {
  type?: 'CREATE_CLIENT' | 'CREATE_USER' | 'CREATE_ADMIN' | string
  idempotencyKey?: string
}

function formatDateTime(timestamp: number): string {
  const safe = Number(timestamp || 0)
  if (!safe) return '-'
  return new Date(safe).toLocaleString()
}

function getActionLabel(type?: string): string {
  if (type === 'CREATE_CLIENT') return 'client'
  if (type === 'CREATE_USER') return 'utilisateur'
  if (type === 'CREATE_ADMIN') return 'admin'
  return 'élément'
}

export function OfflineSyncBadge() {
  const { addToast } = useToast()
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine !== false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingEntries, setPendingEntries] = useState<SyncQueueListItem[]>([])
  const [lastSync, setLastSync] = useState<SyncSummary | null>(null)
  const [lastActionMessage, setLastActionMessage] = useState('')
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const refreshQueueState = async () => {
    try {
      const [count, entries] = await Promise.all([getPendingSyncCount(), listPendingSyncEntries()])
      setPendingCount(count)
      setPendingEntries(entries)
    } catch {
      setPendingCount(0)
      setPendingEntries([])
    }
  }

  useEffect(() => {
    void refreshQueueState()

    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    const onSyncStarted = () => {
      setIsSyncing(true)
      setLastActionMessage('Synchronisation en cours...')
    }
    const onQueueUpdated = () => {
      void refreshQueueState()
    }
    const onActionEnqueued = (event: Event) => {
      const detail = (event as CustomEvent<EnqueuedActionDetail>).detail || {}
      const label = getActionLabel(detail.type)
      addToast({
        type: 'info',
        title: 'Action enregistrée hors ligne',
        message: `Le ${label} sera envoyé automatiquement au retour du réseau.`,
      })
    }
    const onSyncFinished = (event: Event) => {
      const detail = (event as CustomEvent<SyncSummary>).detail || { processed: 0, failed: 0, skipped: 0 }
      setIsSyncing(false)
      setLastSync(detail)
      setLastActionMessage(
        detail.failed > 0
          ? `Sync terminée avec ${detail.failed} échec(s).`
          : `Sync terminée: ${detail.processed} traitée(s), ${detail.skipped} ignorée(s).`
      )
      if (detail.failed > 0) {
        addToast({
          type: 'warning',
          title: 'Synchronisation incomplète',
          message: `${detail.failed} action(s) ont échoué. La file sera retentée.`,
        })
      } else if (detail.processed > 0) {
        addToast({
          type: 'success',
          title: 'Synchronisation réussie',
          message: `${detail.processed} action(s) envoyée(s) au serveur.`,
        })
      } else if (detail.skipped > 0) {
        addToast({
          type: 'info',
          title: 'Synchronisation terminée',
          message: `${detail.skipped} action(s) déjà présentes côté serveur.`,
        })
      }
      void refreshQueueState()
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener(OFFLINE_SYNC_STARTED_EVENT, onSyncStarted)
    window.addEventListener(OFFLINE_SYNC_QUEUE_UPDATED_EVENT, onQueueUpdated)
    window.addEventListener(OFFLINE_SYNC_ACTION_ENQUEUED_EVENT, onActionEnqueued)
    window.addEventListener(OFFLINE_SYNC_FINISHED_EVENT, onSyncFinished)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener(OFFLINE_SYNC_STARTED_EVENT, onSyncStarted)
      window.removeEventListener(OFFLINE_SYNC_QUEUE_UPDATED_EVENT, onQueueUpdated)
      window.removeEventListener(OFFLINE_SYNC_ACTION_ENQUEUED_EVENT, onActionEnqueued)
      window.removeEventListener(OFFLINE_SYNC_FINISHED_EVENT, onSyncFinished)
    }
  }, [addToast])

  const view = useMemo(() => {
    if (!isOnline) {
      return {
        label: 'Offline',
        variant: 'destructive' as const,
        Icon: WifiOff,
      }
    }

    if (isSyncing) {
      return {
        label: 'Sync en cours',
        variant: 'secondary' as const,
        Icon: RefreshCw,
      }
    }

    if (lastSync && lastSync.failed > 0) {
      return {
        label: `Sync erreur (${lastSync.failed})`,
        variant: 'destructive' as const,
        Icon: AlertCircle,
      }
    }

    if (pendingCount > 0) {
      return {
        label: `${pendingCount} en attente`,
        variant: 'secondary' as const,
        Icon: AlertCircle,
      }
    }

    if (lastSync && (lastSync.processed > 0 || lastSync.skipped > 0)) {
      return {
        label: 'Sync ok',
        variant: 'default' as const,
        Icon: CheckCircle2,
      }
    }

    return {
      label: 'Online',
      variant: 'outline' as const,
      Icon: CheckCircle2,
    }
  }, [isOnline, isSyncing, lastSync, pendingCount])

  const onManualSync = async () => {
    if (isSyncing || !isOnline) return
    setIsSyncing(true)
    setLastActionMessage('Synchronisation en cours...')
    try {
      await syncQueuedActions()
    } catch {
      setIsSyncing(false)
      setLastActionMessage('Erreur pendant la synchronisation.')
    }
  }

  const onClearQueue = async () => {
    if (pendingCount <= 0) return
    const confirmed = window.confirm('Vider toute la file de synchronisation hors ligne ?')
    if (!confirmed) return

    try {
      const cleared = await clearSyncQueue()
      setLastActionMessage(`${cleared} action(s) supprimée(s) de la file.`)
      setLastSync(null)
      void refreshQueueState()
    } catch {
      setLastActionMessage('Impossible de vider la file de synchronisation.')
    }
  }

  const Icon = view.Icon
  const animateSpin = isSyncing ? 'animate-spin' : ''

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2">
      {isPanelOpen && (
        <div className="w-[340px] max-h-[60vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-600">Sync hors ligne</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsPanelOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 px-3 py-3 text-xs text-slate-700">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
              <p>Réseau: {isOnline ? 'En ligne' : 'Hors ligne'}</p>
              <p>En attente: {pendingCount}</p>
              {lastActionMessage ? <p className="mt-1 text-[11px] text-slate-500">{lastActionMessage}</p> : null}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  void onManualSync()
                }}
                disabled={!isOnline || isSyncing || pendingCount <= 0}
              >
                <RefreshCw className={`mr-1 h-3.5 w-3.5 ${animateSpin}`} />
                Resync now
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => {
                  void onClearQueue()
                }}
                disabled={pendingCount <= 0}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Vider la queue
              </Button>
            </div>

            <div className="max-h-56 overflow-auto rounded-lg border border-slate-200">
              {pendingEntries.length === 0 ? (
                <p className="px-3 py-3 text-[11px] text-slate-500">Aucune action en attente.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {pendingEntries.map((entry) => (
                    <li key={entry.key} className="px-3 py-2">
                      <p className="font-semibold text-slate-800">{entry.type}</p>
                      <p className="text-[11px] text-slate-600">{entry.summary}</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(entry.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setIsPanelOpen((prev) => !prev)
          void refreshQueueState()
        }}
        className="disabled:cursor-default"
        title="Afficher les détails de synchronisation hors ligne"
      >
        <Badge
          variant={view.variant}
          className="h-8 rounded-full px-3 text-[11px] font-bold tracking-wide shadow-lg border bg-white/95 text-slate-800"
        >
          <Icon className={`mr-2 h-3.5 w-3.5 ${animateSpin}`} />
          {view.label}
        </Badge>
      </button>
    </div>
  )
}
