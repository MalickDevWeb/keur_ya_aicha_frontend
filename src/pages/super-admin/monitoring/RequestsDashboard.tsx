import { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { deleteAuditLogs, listAuditLogs } from '@/services/api/auditLogs.api'
import { blockIp, listBlockedIps, unblockIp } from '@/services/api/blockedIps.api'
import type { AuditLogDTO, BlockedIpDTO } from '@/dto/frontend/responses'
import { Card } from '@/components/ui/card'
import { CardContent } from '@/components/ui/card'
import { StatsCards } from '@/pages/common/StatsCards'
import { AlertTriangle, Activity, Server, ShieldAlert, Unlock } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type SeriesPoint = { name: string; slow: number; errors: number }

const SLOW_ACTIONS = new Set(['SLOW_REQUEST', 'SLOW_REQUEST_CLIENT'])
const ERROR_ACTIONS = new Set(['API_ERROR', 'SERVER_ERROR'])

function toHourLabel(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:00`
}

function buildSeries(logs: AuditLogDTO[]): SeriesPoint[] {
  const now = new Date()
  const buckets = Array.from({ length: 24 }).map((_, i) => {
    const d = new Date(now)
    d.setHours(now.getHours() - (23 - i), 0, 0, 0)
    return { name: toHourLabel(d), slow: 0, errors: 0, key: d.toISOString() }
  })
  logs.forEach((log) => {
    if (!log.createdAt) return
    const d = new Date(log.createdAt)
    const label = toHourLabel(d)
    const bucket = buckets.find((b) => b.name === label)
    if (!bucket) return
    if (SLOW_ACTIONS.has(String(log.action || ''))) bucket.slow += 1
    if (ERROR_ACTIONS.has(String(log.action || ''))) bucket.errors += 1
  })
  return buckets.map(({ name, slow, errors }) => ({ name, slow, errors }))
}

export function RequestsDashboard() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<AuditLogDTO[]>([])
  const [blockedIps, setBlockedIps] = useState<BlockedIpDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBlocks, setLoadingBlocks] = useState(true)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)
  const [blockIpValue, setBlockIpValue] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blocking, setBlocking] = useState(false)
  const [blockError, setBlockError] = useState('')
  const [logSearch, setLogSearch] = useState('')
  const [logFilter, setLogFilter] = useState<'all' | 'slow' | 'error' | 'server'>('all')
  const [showAllLogs, setShowAllLogs] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resettingLogs, setResettingLogs] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await listAuditLogs()
        if (active) setLogs(Array.isArray(data) ? data : [])
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const handleUnblock = async (id: string) => {
    setUnblockingId(id)
    try {
      await unblockIp(id)
      setBlockedIps((prev) => prev.filter((ip) => ip.id !== id))
    } finally {
      setUnblockingId(null)
    }
  }

  const isValidIp = (value: string) => {
    const v = value.trim()
    if (!v) return false
    if (v.includes(':')) return /^[a-fA-F0-9:]+$/.test(v)
    const parts = v.split('.')
    if (parts.length !== 4) return false
    return parts.every((p) => p !== '' && Number(p) >= 0 && Number(p) <= 255)
  }

  const handleBlock = async () => {
    const ip = blockIpValue.trim()
    if (!ip) {
      setBlockError('Adresse IP requise.')
      return
    }
    if (!isValidIp(ip)) {
      setBlockError('Adresse IP invalide.')
      return
    }
    if (blockedIps.some((b) => b.ip === ip)) {
      setBlockError('Cette IP est déjà bloquée.')
      return
    }
    setBlockError('')
    setBlocking(true)
    try {
      const created = await blockIp({ ip, reason: blockReason.trim() })
      setBlockedIps((prev) => [created, ...prev])
      setBlockIpValue('')
      setBlockReason('')
    } finally {
      setBlocking(false)
    }
  }

  useEffect(() => {
    let active = true
    const loadBlocks = async () => {
      setLoadingBlocks(true)
      try {
        const data = await listBlockedIps()
        if (active) setBlockedIps(Array.isArray(data) ? data : [])
      } finally {
        if (active) setLoadingBlocks(false)
      }
    }
    loadBlocks()
    return () => {
      active = false
    }
  }, [])

  const requestLogs = useMemo(
    () => logs.filter((l) => SLOW_ACTIONS.has(String(l.action || '')) || ERROR_ACTIONS.has(String(l.action || ''))),
    [logs]
  )

  const filteredRequestLogs = useMemo(() => {
    const needle = String(logSearch || '').toLowerCase().trim()
    return requestLogs.filter((log) => {
      const action = String(log.action || '')
      if (logFilter === 'slow' && !SLOW_ACTIONS.has(action)) return false
      if (logFilter === 'error' && !ERROR_ACTIONS.has(action)) return false
      if (logFilter === 'server' && action !== 'SERVER_ERROR') return false

      if (!needle) return true
      const haystack = [
        log.message,
        log.action,
        log.targetType,
        log.targetId,
        log.actor,
        log.ipAddress,
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ')
      return haystack.includes(needle)
    })
  }, [requestLogs, logSearch, logFilter])

  const visibleRequestLogs = useMemo(
    () => (showAllLogs ? filteredRequestLogs : filteredRequestLogs.slice(0, 20)),
    [filteredRequestLogs, showAllLogs]
  )

  const handleResetRequestLogs = async () => {
    const idsToDelete = requestLogs.map((log) => log.id).filter(Boolean)
    if (idsToDelete.length === 0) {
      setResetDialogOpen(false)
      return
    }

    setResettingLogs(true)
    try {
      await deleteAuditLogs(idsToDelete)
      const idSet = new Set(idsToDelete.map((id) => String(id)))
      setLogs((prev) => prev.filter((log) => !idSet.has(String(log.id))))
      setShowAllLogs(false)
      setResetDialogOpen(false)
      toast({
        title: 'Logs remis à zéro',
        description: 'Les logs de surveillance ont été vidés.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de remettre les logs à zéro.'
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setResettingLogs(false)
    }
  }

  const slowCount = requestLogs.filter((l) => SLOW_ACTIONS.has(String(l.action || ''))).length
  const errorCount = requestLogs.filter((l) => ERROR_ACTIONS.has(String(l.action || ''))).length
  const series = useMemo(() => buildSeries(requestLogs), [requestLogs])

  return (
    <main className="max-w-6xl mx-auto w-full px-0 py-4 space-y-4 animate-fade-in sm:px-4 sm:py-6 sm:space-y-6 lg:px-6">
      <SectionWrapper>
        <SuperAdminHeader />
      </SectionWrapper>

      <SectionWrapper>
        <div>
          <h2 className="text-lg font-semibold text-[#121B53]">Surveillance des requêtes</h2>
          <p className="text-sm text-muted-foreground">Requêtes lentes, erreurs API et incidents serveur</p>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <StatsCards
          cards={[
            {
              title: 'Requêtes lentes',
              value: slowCount,
              icon: <Activity className="h-6 w-6 text-white" />,
              className:
                'border-0 bg-gradient-to-br from-[#121B53] via-[#1A2A78] to-[#0B153D] text-white shadow-[0_18px_45px_rgba(10,16,48,0.35)]',
            },
            {
              title: 'Erreurs API',
              value: errorCount,
              icon: <AlertTriangle className="h-6 w-6 text-white" />,
              className:
                'border-0 bg-gradient-to-br from-[#233A8C] via-[#2E52D0] to-[#162B66] text-white shadow-[0_18px_45px_rgba(18,34,94,0.32)]',
            },
            {
              title: 'Incidents serveur',
              value: requestLogs.filter((l) => l.action === 'SERVER_ERROR').length,
              icon: <Server className="h-6 w-6 text-white" />,
              className:
                'border-0 bg-gradient-to-br from-[#1A4E9A] via-[#1970C2] to-[#0E3A7A] text-white shadow-[0_18px_45px_rgba(14,38,90,0.32)]',
            },
          ]}
        />
      </SectionWrapper>

      <SectionWrapper>
        <Card className="border-[#121B53]/10 bg-white/90 shadow-[0_20px_50px_rgba(12,18,60,0.12)]">
          <CardContent className="p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#121B53]">Tendance sur 24h</p>
              <p className="text-xs text-muted-foreground">Lentes vs erreurs</p>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="slow" stroke="#4A7CFF" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="errors" stroke="#C1121F" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>

      <SectionWrapper>
        <Card className="border-[#0B153D]/20 bg-[#0B153D] text-white shadow-[0_30px_80px_rgba(10,16,48,0.45)]">
          <CardContent className="p-0">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <ShieldAlert className="h-5 w-5 text-[#7BA2FF]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">IPs bloquées automatiquement</p>
                    <p className="text-xs text-white/70">Détection active des tentatives excessives</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    {blockedIps.length} IP
                  </div>
                </div>
              </div>
            </div>
            <div className="border-b border-white/10 px-5 py-4">
              <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_auto]">
                <input
                  value={blockIpValue}
                  onChange={(e) => setBlockIpValue(e.target.value)}
                  placeholder="Bloquer une IP (ex: 192.168.0.10)"
                  className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#7BA2FF]/60"
                />
                <input
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Raison (optionnel)"
                  className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#7BA2FF]/60"
                />
                <Button
                  onClick={handleBlock}
                  disabled={blocking}
                  className="bg-white/15 text-white hover:bg-white/25"
                >
                  {blocking ? 'Blocage...' : 'Bloquer'}
                </Button>
              </div>
              {blockError ? (
                <div className="mt-2 text-xs text-rose-200">{blockError}</div>
              ) : null}
            </div>
            {loadingBlocks ? (
              <div className="py-10 text-center text-sm text-white/70">Chargement...</div>
            ) : blockedIps.length === 0 ? (
              <div className="py-10 text-center text-sm text-white/70">
                Aucune IP bloquée pour le moment.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {blockedIps.map((ip) => (
                  <div key={ip.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{ip.ip}</div>
                        {ip.reason ? (
                          <div className="mt-1 text-xs text-white/70">{ip.reason}</div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        {ip.createdAt ? (
                          <div className="text-xs text-white/60">
                            {new Date(ip.createdAt).toLocaleString()}
                          </div>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                          onClick={() => handleUnblock(ip.id)}
                          disabled={unblockingId === ip.id}
                        >
                          <Unlock className="mr-2 h-4 w-4" />
                          Débloquer
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </SectionWrapper>

      <SectionWrapper>
        <Card className="border-[#121B53]/10 bg-white/85 shadow-xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Chargement...</div>
            ) : requestLogs.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Aucune alerte détectée.</div>
            ) : (
              <>
                <div className="border-b border-[#121B53]/10 p-3 sm:p-5">
                  <div className="flex flex-col gap-3">
                    <Input
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      placeholder="Filtrer (action, endpoint, IP, message)"
                      className="w-full sm:max-w-sm"
                    />
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      {([
                        { key: 'all', label: 'Tout' },
                        { key: 'slow', label: 'Lentes' },
                        { key: 'error', label: 'Erreurs' },
                        { key: 'server', label: 'Serveur' },
                      ] as const).map((option) => (
                        <Button
                          key={option.key}
                          size="sm"
                          variant={logFilter === option.key ? 'default' : 'outline'}
                          className={cn(
                            'w-full whitespace-normal text-center sm:w-auto',
                            logFilter === option.key && 'bg-[#121B53] text-white hover:bg-[#0B153D]'
                          )}
                          onClick={() => setLogFilter(option.key)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-muted-foreground">
                        Total: {requestLogs.length} · Filtrés: {filteredRequestLogs.length} · Affichés: {visibleRequestLogs.length}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setResetDialogOpen(true)}
                        disabled={requestLogs.length === 0}
                        className="w-full sm:w-auto"
                      >
                        Mettre tous les logs à 0
                      </Button>
                    </div>
                  </div>
                </div>

                {filteredRequestLogs.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Aucun log ne correspond au filtre.
                  </div>
                ) : (
                  <div className="divide-y divide-[#121B53]/10">
                    {visibleRequestLogs.map((log) => (
                      <div key={log.id} className="px-3 py-3 sm:px-5 sm:py-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                          <div className="text-sm font-semibold text-[#121B53] break-words">{log.message || log.action}</div>
                          {log.createdAt ? (
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground break-all">
                          {log.action ? <span>Action: {log.action}</span> : null}
                          {log.targetId ? <span> · Endpoint: {log.targetId}</span> : null}
                          {log.ipAddress ? <span> · IP: {log.ipAddress}</span> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredRequestLogs.length > 20 ? (
                  <div className="border-t border-[#121B53]/10 px-3 py-3 sm:px-5">
                    <Button variant="outline" size="sm" onClick={() => setShowAllLogs((prev) => !prev)}>
                      {showAllLogs ? 'Voir moins' : 'Voir tout'}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </SectionWrapper>

      <ConfirmDialog
        open={resetDialogOpen}
        title="Réinitialiser les logs de surveillance ?"
        description="Tous les logs de requêtes lentes/erreurs seront supprimés. Cette action est irréversible."
        confirmText="Tout remettre à 0"
        isDestructive
        onCancel={() => setResetDialogOpen(false)}
        onConfirm={handleResetRequestLogs}
        isLoading={resettingLogs}
      />
    </main>
  )
}
