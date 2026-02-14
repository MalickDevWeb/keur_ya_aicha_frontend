import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AdminRequestDTO } from '@/dto/frontend/responses'
import { Building2 } from 'lucide-react'
import { useState } from 'react'

type PendingRequestsSectionProps = {
  sectionId: string
  pendingSearch: string
  onPendingSearchChange: (value: string) => void
  pendingOnlyEntreprise: boolean
  onToggleEntrepriseOnly: () => void
  pendingRequests: AdminRequestDTO[]
  visiblePending: AdminRequestDTO[]
  showAllPending: boolean
  onToggleShowAll: () => void
  approveErrors: Record<string, string>
  onApprove: (req: AdminRequestDTO) => void
}

export function PendingRequestsSection({
  sectionId,
  pendingSearch,
  onPendingSearchChange,
  pendingOnlyEntreprise,
  onToggleEntrepriseOnly,
  pendingRequests,
  visiblePending,
  showAllPending,
  onToggleShowAll,
  approveErrors,
  onApprove,
}: PendingRequestsSectionProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  return (
    <section
      id={sectionId}
      aria-labelledby={`${sectionId}-title`}
      className="space-y-4 bg-[var(--primary-color)] text-[var(--text-on-primary)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id={`${sectionId}-title`} className="text-lg font-semibold">
            Demandes en attente
          </h2>
          <p className="text-xs text-muted-foreground">
            Validation et activation des comptes admin
          </p>
        </div>
      </div>
      <Card className="space-y-4 rounded-3xl border border-blue-200/60 bg-white/80 p-1 shadow-[0_24px_60px_-40px_rgba(30,64,175,0.35)]">
        <CardHeader className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Demandes Admin (EN_ATTENTE)</CardTitle>
            <p className="text-xs text-slate-300">Les comptes bloqués attendent validation & paiement initial</p>
          </div>
        </CardHeader>
        <CardContent className="rounded-2xl border border-slate-200/70 bg-white">
          <div className="sticky top-4 z-10 mb-4 flex flex-col gap-3 rounded-2xl border border-blue-200/70 bg-white/90 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center">
            <Input
              value={pendingSearch}
              onChange={(e) => onPendingSearchChange(e.target.value)}
              placeholder="Rechercher par nom, téléphone, entreprise ou username"
              className="border-blue-200 bg-blue-50/80"
            />
            <div className="flex flex-nowrap items-center gap-2 sm:ml-auto">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                Cartes
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                Liste
              </Button>
            </div>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
          ) : viewMode === 'list' ? (
            <div className="rounded-2xl border border-blue-200 bg-white">
              <div className="grid grid-cols-5 gap-2 border-b border-blue-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Nom</span>
                <span>Email</span>
                <span>Téléphone</span>
                <span>Entreprise</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-blue-100">
                {visiblePending.map((req) => (
                  <div key={req.id} className="grid grid-cols-5 gap-2 px-4 py-3 text-sm">
                    <span className="font-medium text-slate-900">{req.name}</span>
                    <span className="text-slate-700">{req.email || '—'}</span>
                    <span className="text-slate-700">{req.phone || '—'}</span>
                    <span className="text-slate-700">{req.entrepriseName || '—'}</span>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-blue-900 text-white hover:bg-blue-800" onClick={() => onApprove(req)}>
                        Valider
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visiblePending.map((req) => (
                <Card
                  key={req.id}
                  className="group relative overflow-hidden border-0 bg-gradient-to-b from-blue-100 via-white to-blue-50 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl rounded-b-3xl rounded-t-none"
                >
                  <div
                    className="absolute left-1/2 top-0 h-4 w-10 -translate-x-1/2 -translate-y-full bg-blue-900"
                    style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(30,64,175,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,64,175,0.08)_1px,transparent_1px)] bg-[size:14px_16px] opacity-60" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-gradient-to-r from-blue-900/10 via-blue-900/20 to-blue-900/10" />
                  <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-blue-900 to-blue-800" />
                  <CardContent className="relative p-4 pt-3 space-y-3 rounded-b-3xl rounded-t-none">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                          <Building2 className="h-4.5 w-4.5 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.2em] text-blue-200">Bâtiment</p>
                          <h3 className="text-sm font-semibold text-white">{req.entrepriseName || 'Entreprise'}</h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {Array.from({ length: 9 }).map((_, idx) => (
                          <span
                            key={idx}
                            className="h-2 w-2 rounded-[2px] border border-white/30 bg-white/10"
                          />
                        ))}
                      </div>
                      <div className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white">
                        EN_ATTENTE
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-300 bg-white/95 p-3 shadow-md">
                        <p className="text-[12px] font-bold uppercase tracking-wide text-blue-800">Demandes Administratives</p>
                        <p className="text-sm font-semibold text-slate-900">{req.name}</p>
                        <p className="text-xs text-gray-600">Les comptes bloqués nécessitent une validation et un paiement initial.</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-blue-300 bg-white px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-blue-700">Email</p>
                          <p className="text-xs font-medium text-slate-900">{req.email || 'Non spécifié'}</p>
                        </div>
                        <div className="rounded-xl border border-blue-300 bg-white px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-blue-700">Téléphone</p>
                          <p className="text-xs font-medium text-slate-900">{req.phone || 'Non spécifié'}</p>
                        </div>
                        <div className="rounded-xl border border-blue-300 bg-white px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-blue-700">Entreprise</p>
                          <p className="text-xs font-medium text-slate-900">{req.entrepriseName || 'Non spécifié'}</p>
                        </div>
                        <div className="rounded-xl border border-blue-300 bg-white px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-blue-700">Nom d'utilisateur</p>
                          <p className="text-xs font-medium text-slate-900">{req.username || 'Non spécifié'}</p>
                        </div>
                      </div>

                      {approveErrors[req.id] ? (
                        <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                          {approveErrors[req.id]}
                        </div>
                      ) : null}
                      <div className="flex justify-end pt-1">
                        <Button size="sm" className="bg-blue-900 text-white hover:bg-blue-800" onClick={() => onApprove(req)}>
                          Valider
                        </Button>
                      </div>
                      <div className="h-2 w-full rounded-b-3xl bg-gradient-to-r from-blue-900/10 via-blue-900/20 to-blue-900/10" />
                    </CardContent>
                  </Card>
              ))}
            </div>
          )}
          {pendingRequests.length > 5 && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={onToggleShowAll}>
                {showAllPending ? 'Voir moins' : 'Voir tout'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
