import { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { listAuditLogs } from '@/services/api/auditLogs.api'
import type { AuditLogDTO } from '@/dto/frontend/responses'
import { Card, CardContent } from '@/components/ui/card'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

type Point = { name: string; duration: number }

function extractDuration(message?: string) {
  if (!message) return 0
  const match = message.match(/\\((\\d+)ms\\)/)
  if (!match) return 0
  return Number(match[1] || 0)
}

function toHourLabel(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:00`
}

export function PerformanceDashboard() {
  const [logs, setLogs] = useState<AuditLogDTO[]>([])
  const [loading, setLoading] = useState(true)

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

  const slowLogs = useMemo(
    () => logs.filter((l) => String(l.action || '').includes('SLOW_REQUEST')),
    [logs]
  )

  const series = useMemo(() => {
    const now = new Date()
    const buckets = Array.from({ length: 24 }).map((_, i) => {
      const d = new Date(now)
      d.setHours(now.getHours() - (23 - i), 0, 0, 0)
      return { name: toHourLabel(d), duration: 0 }
    })
    slowLogs.forEach((log) => {
      const d = log.createdAt ? new Date(log.createdAt) : null
      if (!d) return
      const label = toHourLabel(d)
      const bucket = buckets.find((b) => b.name === label)
      if (!bucket) return
      bucket.duration += extractDuration(log.message)
    })
    return buckets
  }, [slowLogs])

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6 animate-fade-in">
      <SectionWrapper>
        <SuperAdminHeader />
      </SectionWrapper>

      <SectionWrapper>
        <div>
          <h2 className="text-lg font-semibold text-[#121B53]">Performance</h2>
          <p className="text-sm text-muted-foreground">Courbe des temps lents sur 24h</p>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <Card className="border-[#121B53]/10 bg-white/90 shadow-[0_20px_50px_rgba(12,18,60,0.12)]">
          <CardContent className="p-5">
            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Chargement...</div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="duration" stroke="#4A7CFF" fill="#4A7CFF" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </SectionWrapper>
    </main>
  )
}
