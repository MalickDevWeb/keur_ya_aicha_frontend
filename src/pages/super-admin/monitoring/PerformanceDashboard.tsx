import { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { listAuditLogs } from '@/services/api/auditLogs.api'
import type { AuditLogDTO } from '@/dto/frontend/responses'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { Activity, AlertTriangle, Gauge, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

type SeriesPoint = {
  name: string
  slowDurationMs: number
  slowCount: number
  errorCount: number
  totalCount: number
}

type PiePoint = {
  name: string
  value: number
  color: string
}

type EndpointPoint = {
  endpoint: string
  incidents: number
}

type PeriodKey = '24h' | '7d' | '30d'

const SLOW_ACTIONS = new Set(['SLOW_REQUEST', 'SLOW_REQUEST_CLIENT'])
const ERROR_ACTIONS = new Set(['API_ERROR', 'SERVER_ERROR'])
const PERIOD_OPTIONS: Array<{ key: PeriodKey; label: string; description: string }> = [
  { key: '24h', label: '24h', description: 'dernières 24 heures' },
  { key: '7d', label: '7j', description: '7 derniers jours' },
  { key: '30d', label: '30j', description: '30 derniers jours' },
]

function extractDuration(message?: string) {
  if (!message) return 0
  const match = message.match(/(\d+)ms/)
  if (!match) return 0
  return Number(match[1] || 0)
}

function toHourLabel(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:00`
}

function toDayLabel(date: Date) {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function getPeriodHours(period: PeriodKey) {
  if (period === '24h') return 24
  if (period === '7d') return 24 * 7
  return 24 * 30
}

function buildSeries(logs: AuditLogDTO[], period: PeriodKey) {
  const now = new Date()
  const isHourly = period === '24h'
  const bucketCount = period === '24h' ? 24 : period === '7d' ? 7 : 30
  const buckets: Array<SeriesPoint & { key: number }> = Array.from({ length: bucketCount }).map((_, i) => {
    const d = new Date(now)
    if (isHourly) {
      d.setHours(now.getHours() - (bucketCount - 1 - i), 0, 0, 0)
      return {
        key: d.getTime(),
        name: toHourLabel(d),
        slowDurationMs: 0,
        slowCount: 0,
        errorCount: 0,
        totalCount: 0,
      }
    }
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (bucketCount - 1 - i))
    return {
      key: d.getTime(),
      name: toDayLabel(d),
      slowDurationMs: 0,
      slowCount: 0,
      errorCount: 0,
      totalCount: 0,
    }
  })
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  logs.forEach((log) => {
    if (!log.createdAt) return
    const date = new Date(log.createdAt)
    if (Number.isNaN(date.getTime())) return
    const bucketDate = new Date(date)
    if (isHourly) {
      bucketDate.setMinutes(0, 0, 0)
    } else {
      bucketDate.setHours(0, 0, 0, 0)
    }
    const bucket = byKey.get(bucketDate.getTime())
    if (!bucket) return

    bucket.totalCount += 1
    const action = String(log.action || '')
    if (SLOW_ACTIONS.has(action)) {
      bucket.slowCount += 1
      bucket.slowDurationMs += extractDuration(log.message)
    }
    if (ERROR_ACTIONS.has(action)) {
      bucket.errorCount += 1
    }
  })

  return buckets.map(({ key: _key, ...rest }) => rest)
}

function buildIncidentDistribution(logs: AuditLogDTO[]): PiePoint[] {
  const slow = logs.filter((log) => SLOW_ACTIONS.has(String(log.action || ''))).length
  const apiErrors = logs.filter((log) => String(log.action || '') === 'API_ERROR').length
  const serverErrors = logs.filter((log) => String(log.action || '') === 'SERVER_ERROR').length

  const points: PiePoint[] = [
    { name: 'Requêtes lentes', value: slow, color: '#4A7CFF' },
    { name: 'Erreurs API', value: apiErrors, color: '#FF8A00' },
    { name: 'Erreurs serveur', value: serverErrors, color: '#D90429' },
  ].filter((item) => item.value > 0)

  if (points.length > 0) return points
  return [{ name: 'Aucune alerte', value: 1, color: '#C7D7FF' }]
}

function buildTopEndpoints(logs: AuditLogDTO[]): EndpointPoint[] {
  const counts = new Map<string, number>()
  logs.forEach((log) => {
    const action = String(log.action || '')
    if (!SLOW_ACTIONS.has(action) && !ERROR_ACTIONS.has(action)) return
    const rawEndpoint = String(log.targetId || log.targetType || 'endpoint inconnu').trim()
    const endpoint = rawEndpoint.length > 24 ? `${rawEndpoint.slice(0, 24)}…` : rawEndpoint
    counts.set(endpoint, (counts.get(endpoint) || 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([endpoint, incidents]) => ({ endpoint, incidents }))
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 6)
}

export function PerformanceDashboard() {
  const [logs, setLogs] = useState<AuditLogDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodKey>('24h')

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

  const periodDescription = useMemo(
    () => PERIOD_OPTIONS.find((option) => option.key === period)?.description || 'période sélectionnée',
    [period]
  )

  const logsForPeriod = useMemo(() => {
    const now = Date.now()
    const minTimestamp = now - getPeriodHours(period) * 60 * 60 * 1000
    return logs.filter((log) => {
      if (!log.createdAt) return false
      const time = new Date(log.createdAt).getTime()
      if (Number.isNaN(time)) return false
      return time >= minTimestamp && time <= now
    })
  }, [logs, period])

  const series = useMemo(() => buildSeries(logsForPeriod, period), [logsForPeriod, period])
  const distribution = useMemo(() => buildIncidentDistribution(logsForPeriod), [logsForPeriod])
  const topEndpoints = useMemo(() => buildTopEndpoints(logsForPeriod), [logsForPeriod])

  const metrics = useMemo(() => {
    const totalSlowDuration = series.reduce((sum, row) => sum + row.slowDurationMs, 0)
    const totalSlowCount = series.reduce((sum, row) => sum + row.slowCount, 0)
    const totalErrors = series.reduce((sum, row) => sum + row.errorCount, 0)
    const totalTraffic = series.reduce((sum, row) => sum + row.totalCount, 0)
    const averageSlowDuration = totalSlowCount > 0 ? Math.round(totalSlowDuration / totalSlowCount) : 0
    const peakSlowDuration = Math.max(0, ...series.map((row) => row.slowDurationMs))

    return {
      averageSlowDuration,
      peakSlowDuration,
      totalSlowCount,
      totalErrors,
      totalTraffic,
    }
  }, [series])

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-0 py-4 sm:space-y-6 sm:px-4 sm:py-6 lg:px-6 animate-fade-in">
      <SectionWrapper>
        <SuperAdminHeader />
      </SectionWrapper>

      <SectionWrapper>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#121B53]">Performance</h2>
            <p className="text-sm text-muted-foreground">
              Vue explicative ({periodDescription}): latence, volume, erreurs et endpoints critiques.
            </p>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 rounded-xl border border-[#121B53]/15 bg-white/80 p-1 sm:w-auto">
            {PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.key}
                size="sm"
                variant="ghost"
                className={cn(
                  'h-8 rounded-lg px-3 text-xs font-semibold',
                  period === option.key
                    ? 'bg-[#121B53] text-white hover:bg-[#0D1545] hover:text-white'
                    : 'text-[#121B53] hover:bg-[#EDF3FF]'
                )}
                onClick={() => setPeriod(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#121B53]/10 bg-white/90">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-[#121B53]/60">Latence moyenne</p>
                <Gauge className="h-4 w-4 text-[#4A7CFF]" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-[#121B53]">{metrics.averageSlowDuration} ms</p>
            </CardContent>
          </Card>
          <Card className="border-[#121B53]/10 bg-white/90">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-[#121B53]/60">Pic de latence</p>
                <Timer className="h-4 w-4 text-[#FF8A00]" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-[#121B53]">{metrics.peakSlowDuration} ms</p>
            </CardContent>
          </Card>
          <Card className="border-[#121B53]/10 bg-white/90">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-[#121B53]/60">Requêtes lentes</p>
                <Activity className="h-4 w-4 text-[#4A7CFF]" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-[#121B53]">{metrics.totalSlowCount}</p>
            </CardContent>
          </Card>
          <Card className="border-[#121B53]/10 bg-white/90">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-[#121B53]/60">Erreurs</p>
                <AlertTriangle className="h-4 w-4 text-[#D90429]" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-[#121B53]">{metrics.totalErrors}</p>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-[#121B53]/10 bg-white/90 shadow-[0_20px_50px_rgba(12,18,60,0.12)]">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3">
                <p className="text-sm font-semibold text-[#121B53]">Courbe des temps lents (ms)</p>
                <p className="text-xs text-muted-foreground">
                  Somme des latences lentes ({periodDescription})
                </p>
              </div>
              {loading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Chargement...</div>
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF8" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => `${value} ms`} />
                      <Area
                        type="monotone"
                        dataKey="slowDurationMs"
                        stroke="#4A7CFF"
                        fill="#4A7CFF"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#121B53]/10 bg-white/90 shadow-[0_20px_50px_rgba(12,18,60,0.12)]">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3">
                <p className="text-sm font-semibold text-[#121B53]">Courbe volume vs erreurs</p>
                <p className="text-xs text-muted-foreground">
                  Comparaison trafic total et erreurs ({periodDescription})
                </p>
              </div>
              {loading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Chargement...</div>
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF8" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="totalCount" stroke="#0F3F8C" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="errorCount" stroke="#D90429" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-[#121B53]/10 bg-white/90 shadow-[0_20px_50px_rgba(12,18,60,0.12)]">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3">
                <p className="text-sm font-semibold text-[#121B53]">Répartition des incidents</p>
                <p className="text-xs text-muted-foreground">Type d’alerte dominante ({periodDescription})</p>
              </div>
              {loading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Chargement...</div>
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={44}
                        outerRadius={78}
                        paddingAngle={4}
                      >
                        {distribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#121B53]/10 bg-white/90 shadow-[0_20px_50px_rgba(12,18,60,0.12)]">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3">
                <p className="text-sm font-semibold text-[#121B53]">Endpoints les plus sensibles</p>
                <p className="text-xs text-muted-foreground">
                  Top routes avec incidents lents/erreurs ({periodDescription})
                </p>
              </div>
              {loading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Chargement...</div>
              ) : topEndpoints.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Aucun endpoint critique sur la période.
                </div>
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topEndpoints} layout="vertical" margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF8" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="endpoint" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="incidents" fill="#5A6ACF" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <Card className="border-[#121B53]/10 bg-white/90">
          <CardContent className="p-4 text-xs text-muted-foreground sm:text-sm">
            Lecture rapide ({periodDescription}): trafic{' '}
            <strong className="text-[#121B53]">{metrics.totalTraffic}</strong> événements, dont{' '}
            <strong className="text-[#121B53]">{metrics.totalSlowCount}</strong> requêtes lentes et{' '}
            <strong className="text-[#121B53]">{metrics.totalErrors}</strong> erreurs.
          </CardContent>
        </Card>
      </SectionWrapper>
    </main>
  )
}
