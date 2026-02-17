import { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { listAuditLogs } from '@/services/api/auditLogs.api'
import type { AuditLogDTO } from '@/dto/frontend/responses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function LogsDashboard() {
  const [logs, setLogs] = useState<AuditLogDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'create' | 'update' | 'delete' | 'auth' | 'error' | 'read' | 'other'>('all')
  const [showAll, setShowAll] = useState(false)

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

  const normalize = (value?: string) => String(value || '').toLowerCase().trim()

  const getLogType = (action?: string) => {
    const value = normalize(action)
    if (!value) return 'other'
    if (value.includes('create') || value.includes('add') || value.includes('new')) return 'create'
    if (value.includes('update') || value.includes('edit') || value.includes('modify')) return 'update'
    if (value.includes('delete') || value.includes('remove') || value.includes('archive')) return 'delete'
    if (value.includes('login') || value.includes('auth')) return 'auth'
    if (value.includes('error') || value.includes('fail') || value.includes('denied') || value.includes('unauthorized')) return 'error'
    if (value.includes('read') || value.includes('view') || value.includes('list') || value.includes('fetch')) return 'read'
    return 'other'
  }

  const filteredLogs = useMemo(() => {
    const needle = normalize(search)
    return logs.filter((log) => {
      if (filter !== 'all' && getLogType(log.action) !== filter) return false
      if (!needle) return true
      const haystack = [
        log.actor,
        log.action,
        log.message,
        log.targetType,
        log.targetId,
        log.ipAddress,
      ]
        .map((value) => normalize(value))
        .join(' ')
      return haystack.includes(needle)
    })
  }, [logs, search, filter])

  const visibleLogs = useMemo(() => (showAll ? filteredLogs : filteredLogs.slice(0, 20)), [filteredLogs, showAll])

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-0 py-4 animate-fade-in sm:space-y-6 sm:px-4 sm:py-6 lg:px-6">
      <SectionWrapper>
        <SuperAdminHeader />
      </SectionWrapper>

      <SectionWrapper>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[#121B53]">Logs & audits</h2>
          <p className="text-sm text-muted-foreground">Historique des actions sensibles</p>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="rounded-3xl border border-[#121B53]/10 bg-white/85 shadow-xl">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Chargement...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Aucun log pour le moment.</div>
          ) : (
            <div className="p-3 sm:p-5">
              <div className="mb-4 flex flex-col gap-3">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher (acteur, action, cible, message)"
                  className="w-full sm:max-w-xs"
                />
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  {([
                    { key: 'all', label: 'Tout' },
                    { key: 'create', label: 'Créations' },
                    { key: 'update', label: 'Modifs' },
                    { key: 'delete', label: 'Suppressions' },
                    { key: 'auth', label: 'Auth' },
                    { key: 'error', label: 'Erreurs' },
                    { key: 'read', label: 'Lectures' },
                    { key: 'other', label: 'Autres' },
                  ] as const).map((option) => (
                    <Button
                      key={option.key}
                      variant={filter === option.key ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'w-full whitespace-normal text-center sm:w-auto',
                        filter === option.key && 'bg-[#121B53] text-white hover:bg-[#0B153D]'
                      )}
                      onClick={() => setFilter(option.key)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Total : {logs.length}</span>
                <span>Filtrés : {filteredLogs.length}</span>
                <span>Affichés : {visibleLogs.length}</span>
              </div>
              <div className="divide-y divide-[#121B53]/10 rounded-2xl border border-[#121B53]/10 bg-white">
                {visibleLogs.map((log) => (
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
                    {log.targetType ? <span> · Cible: {log.targetType}</span> : null}
                    {log.targetId ? <span> · ID: {log.targetId}</span> : null}
                    {log.actor ? <span> · Acteur: {log.actor}</span> : null}
                    {log.ipAddress ? <span> · IP: {log.ipAddress}</span> : null}
                  </div>
                </div>
                ))}
              </div>
              {filteredLogs.length > 20 && (
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => setShowAll((prev) => !prev)}>
                    {showAll ? 'Voir moins' : 'Voir tout'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SectionWrapper>
    </main>
  )
}
