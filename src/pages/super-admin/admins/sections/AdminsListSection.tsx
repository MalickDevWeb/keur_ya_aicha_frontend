import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchInput } from '@/components/SearchInput'
import { cn } from '@/lib/utils'
import { Grid3x3, List } from 'lucide-react'
import type { AdminDTO } from '@/dto/frontend/responses'
import type { AdminRow, ViewMode } from '../types'

const getStatusActions = (status: AdminDTO['status']) => {
  switch (status) {
    case 'ACTIF':
      return [
        { label: 'Suspendre', nextStatus: 'SUSPENDU' as const },
        { label: 'Blacklister', nextStatus: 'BLACKLISTE' as const },
        { label: 'Archiver', nextStatus: 'ARCHIVE' as const },
      ]
    case 'SUSPENDU':
      return [
        { label: 'Activer', nextStatus: 'ACTIF' as const },
        { label: 'Blacklister', nextStatus: 'BLACKLISTE' as const },
        { label: 'Archiver', nextStatus: 'ARCHIVE' as const },
      ]
    case 'BLACKLISTE':
      return [
        { label: 'Activer', nextStatus: 'ACTIF' as const },
        { label: 'Suspendre', nextStatus: 'SUSPENDU' as const },
        { label: 'Archiver', nextStatus: 'ARCHIVE' as const },
      ]
    case 'ARCHIVE':
      return [
        { label: 'Activer', nextStatus: 'ACTIF' as const },
        { label: 'Suspendre', nextStatus: 'SUSPENDU' as const },
        { label: 'Blacklister', nextStatus: 'BLACKLISTE' as const },
      ]
    default:
      return []
  }
}

const getActionVariant = (status: AdminDTO['status'], nextStatus: AdminDTO['status']) => {
  if (nextStatus === 'BLACKLISTE') return 'destructive'
  if (nextStatus === 'ARCHIVE') return 'outline'
  if (nextStatus === 'SUSPENDU') return 'outline'
  if (status === 'SUSPENDU' && nextStatus === 'ACTIF') return 'default'
  return 'outline'
}

const renderActions = (
  admin: AdminDTO,
  actionsDisabled: boolean,
  onSetStatus: (admin: AdminDTO, status: AdminDTO['status']) => void
) => {
  return getStatusActions(admin.status).map((action) => {
    const variant = getActionVariant(admin.status, action.nextStatus)
    const className =
      action.nextStatus === 'BLACKLISTE'
        ? 'bg-[#C1121F] text-white hover:bg-[#A40E1A] border-0'
        : action.nextStatus === 'ARCHIVE'
          ? 'border-[#121B53]/25 text-[#121B53] hover:bg-[#121B53]/10'
          : action.nextStatus === 'SUSPENDU'
            ? 'border-[#121B53]/25 text-[#121B53] hover:bg-[#121B53]/10'
            : 'bg-[#121B53] text-white hover:bg-[#0B153D]'
    return (
      <Button
        key={`${admin.id}-${action.nextStatus}`}
        size="sm"
        variant={variant}
        className={className}
        disabled={actionsDisabled}
        onClick={() => onSetStatus(admin, action.nextStatus)}
      >
        {action.label}
      </Button>
    )
  })
}

type AdminsListSectionProps = {
  rows: AdminRow[]
  loading: boolean
  search: string
  onSearchChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  busyId: string | null
  onSetStatus: (admin: AdminDTO, status: AdminDTO['status']) => void
}

export function AdminsListSection({
  rows,
  loading,
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  busyId,
  onSetStatus,
}: AdminsListSectionProps) {
  return (
    <Card className="border-[#121B53]/15 bg-white/90 shadow-[0_24px_60px_rgba(12,18,60,0.14)]">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#121B53]">Administrateurs</h2>
            <p className="text-sm text-muted-foreground">Gérez l’accès, le statut et les actions rapides.</p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-[#121B53]/10 bg-gradient-to-r from-[#F7F9FF] via-white to-[#EEF2FF] p-4 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={onSearchChange}
              className="flex-1"
              inputClassName="border-[#121B53]/20 bg-white focus-visible:ring-0"
              placeholder="Nom, username, email ou entreprise"
            />
            <div className="flex items-center gap-2 rounded-xl border border-[#121B53]/10 bg-white/90 p-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('cards')}
                title="Vue en cartes"
                className={cn(
                  'h-9 w-9',
                  viewMode === 'cards'
                    ? 'bg-[#121B53] text-white hover:bg-[#0B153D]'
                    : 'text-[#121B53] hover:bg-[#121B53]/10'
                )}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                title="Vue en liste"
                className={cn(
                  'h-9 w-9',
                  viewMode === 'list'
                    ? 'bg-[#121B53] text-white hover:bg-[#0B153D]'
                    : 'text-[#121B53] hover:bg-[#121B53]/10'
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Chargement...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Aucun admin enregistré.</div>
        ) : viewMode === 'cards' ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
            {rows.map(({ admin, entreprises }) => {
              const actionsDisabled = busyId === admin.id
              const initials = String(admin.name || admin.username || 'A')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() || '')
                .join('')
              return (
                <Card
                  key={admin.id}
                  className={cn(
                    'overflow-hidden border border-[#121B53]/10 shadow-[0_18px_40px_rgba(14,20,60,0.15)] hover:shadow-[0_28px_75px_rgba(14,20,60,0.22)] transition-all',
                    'bg-gradient-to-br from-white via-[#F7F9FF] to-[#EEF2FF]'
                  )}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#121B53] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                          <span className="text-sm font-semibold">{initials || 'AD'}</span>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.2em] text-[#121B53]/55">Admin</p>
                          <h3 className="text-lg font-semibold text-[#121B53]">{admin.name || '—'}</h3>
                          <p className="text-xs text-[#121B53]/60">@{admin.username || '—'}</p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'rounded-full px-3 py-1 text-[11px]',
                          admin.status === 'ACTIF' && 'bg-emerald-100 text-emerald-800',
                          admin.status === 'SUSPENDU' && 'bg-amber-100 text-amber-800',
                          admin.status === 'BLACKLISTE' && 'bg-rose-100 text-rose-800',
                          admin.status === 'ARCHIVE' && 'bg-slate-100 text-slate-800'
                        )}
                      >
                        {admin.status}
                      </Badge>
                    </div>
                    <div className="rounded-2xl border border-[#121B53]/10 bg-white/80 px-3 py-3 text-xs text-[#121B53]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                      <span className="font-semibold text-[#121B53]/80">Entreprises</span>
                      <span className="ml-2">
                        {entreprises.length === 0
                          ? '—'
                          : entreprises.map((e) => e.name || '—').join(', ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {renderActions(admin, actionsDisabled, onSetStatus)}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#121B53]/5">
                <TableHead className="text-[#121B53]">Admin</TableHead>
                <TableHead className="text-[#121B53]">Statut</TableHead>
                <TableHead className="text-[#121B53]">Entreprise(s)</TableHead>
                <TableHead className="text-[#121B53]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ admin, entreprises }) => {
                const actionsDisabled = busyId === admin.id
                return (
                  <TableRow key={admin.id} className="hover:bg-[#121B53]/5">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-[#121B53]">{admin.name}</span>
                        <span className="text-xs text-[#121B53]/60">@{admin.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge
                        variant="secondary"
                        className={cn(
                          admin.status === 'ACTIF' && 'bg-emerald-100 text-emerald-800',
                          admin.status === 'SUSPENDU' && 'bg-amber-100 text-amber-800',
                          admin.status === 'BLACKLISTE' && 'bg-rose-100 text-rose-800',
                          admin.status === 'ARCHIVE' && 'bg-slate-100 text-slate-800'
                        )}
                      >
                        {admin.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#121B53]/60">
                      {entreprises.length === 0 ? '—' : entreprises.map((ent) => ent.name || '—').join(', ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {renderActions(admin, actionsDisabled, onSetStatus)}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
