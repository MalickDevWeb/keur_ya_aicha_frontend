import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AuditLogDTO } from '@/dto/frontend/responses'

type AuditLogsSectionProps = {
  sectionId: string
  auditLogs: AuditLogDTO[]
  filteredLogs: AuditLogDTO[]
  visibleLogs: AuditLogDTO[]
  logSearch: string
  onLogSearchChange: (value: string) => void
  logFilter: string
  onLogFilterChange: (value: string) => void
  showAllLogs: boolean
  onToggleShowAll: () => void
  formatLogDate: (value?: string) => string
  getActionBadge: (action?: string) => string
}

export function AuditLogsSection({
  sectionId,
  auditLogs,
  filteredLogs,
  visibleLogs,
  logSearch,
  onLogSearchChange,
  logFilter,
  onLogFilterChange,
  showAllLogs,
  onToggleShowAll,
  formatLogDate,
  getActionBadge,
}: AuditLogsSectionProps) {
  return (
    <section id={sectionId} aria-labelledby={`${sectionId}-title`} className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id={`${sectionId}-title`} className="text-lg font-semibold">Logs / audit</h2>
          <p className="text-sm text-muted-foreground">Dernières actions enregistrées</p>
        </div>
      </div>
      <Card className="rounded-3xl border border-border bg-white/80">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Logs / Audit</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Total : {auditLogs.length}</span>
              <span>Affichés : {visibleLogs.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={logSearch}
              onChange={(e) => onLogSearchChange(e.target.value)}
              placeholder="Rechercher (acteur, action, cible, message)"
            />
            <div className="flex gap-2">
              <Button
                variant={logFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLogFilterChange('all')}
              >
                Tout
              </Button>
              <Button
                variant={logFilter === 'create' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLogFilterChange('create')}
              >
                Créations
              </Button>
              <Button
                variant={logFilter === 'update' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLogFilterChange('update')}
              >
                Modifs
              </Button>
              <Button
                variant={logFilter === 'delete' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLogFilterChange('delete')}
              >
                Suppressions
              </Button>
            </div>
          </div>
          {filteredLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun log disponible. Vérifie que `audit_logs` est rempli dans `db.json`.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Acteur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatLogDate(log.createdAt)}</TableCell>
                    <TableCell>{log.actor || '—'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getActionBadge(log.action)}`}>
                        {log.action || '—'}
                      </span>
                    </TableCell>
                    <TableCell>{log.targetType ? `${log.targetType}${log.targetId ? ` • ${log.targetId}` : ''}` : '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.message || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filteredLogs.length > 10 && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={onToggleShowAll}>
                {showAllLogs ? 'Voir moins' : 'Voir tout'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
