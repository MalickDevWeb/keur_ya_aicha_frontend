import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchInput } from '@/components/SearchInput'
import { cn } from '@/lib/utils'
import { Building2, Grid3x3, List } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useEffect, useState } from 'react'
import type { AdminDTO } from '@/dto/frontend/responses'
import type { EntrepriseRow, ViewMode } from '../types'

type EntreprisesListSectionProps = {
  rows: EntrepriseRow[]
  loading: boolean
  search: string
  onSearchChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  enteringId: string | null
  onEnterAdmin: (admin?: AdminDTO) => void
  isAdminPaidThisMonth: (adminId?: string) => boolean
  getLastPaidAt: (adminId?: string) => string | null
  payingAdminId: string | null
  onPaySubscription: (admin?: AdminDTO, amount?: number) => void
  selectedEntrepriseId: string | null
  onSelectEntreprise: (entrepriseId: string) => void
  noResultsLabel: string
}

function getDefaultPaymentAmount(admin?: AdminDTO): string {
  if (!admin) return '5000'
  const mode = String(admin.subscriptionMode || 'monthly').toLowerCase()
  if (mode === 'annual') {
    const annual = Number(admin.subscriptionAnnualAmount || 60000)
    return String(Number.isFinite(annual) && annual > 0 ? Math.round(annual) : 60000)
  }
  const monthly = Number(admin.subscriptionMonthlyAmount || 5000)
  return String(Number.isFinite(monthly) && monthly > 0 ? Math.round(monthly) : 5000)
}

export function EntreprisesListSection({
  rows,
  loading,
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  enteringId,
  onEnterAdmin,
  isAdminPaidThisMonth,
  getLastPaidAt,
  payingAdminId,
  onPaySubscription,
  selectedEntrepriseId,
  onSelectEntreprise,
  noResultsLabel,
}: EntreprisesListSectionProps) {
  const isMobile = useIsMobile()
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isMobile && viewMode !== 'cards') {
      onViewModeChange('cards')
    }
  }, [isMobile, viewMode, onViewModeChange])

  const resolvePaymentAmount = (admin?: AdminDTO): string => {
    if (!admin?.id) return getDefaultPaymentAmount(admin)
    return paymentAmounts[admin.id] || getDefaultPaymentAmount(admin)
  }

  const setPaymentAmount = (adminId: string, value: string) => {
    setPaymentAmounts((prev) => ({ ...prev, [adminId]: value }))
  }

  return (
    <Card className="border-[#121B53]/15 bg-white/85 shadow-[0_20px_50px_rgba(12,18,60,0.12)]">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#121B53]/10 bg-[#F7F9FF] p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            className="flex-1"
            inputClassName="border-[#121B53]/20 bg-white focus-visible:ring-0"
            placeholder="Nom, prénom, téléphone ou CNI"
          />
          <div className="flex items-center gap-2 rounded-xl border border-[#121B53]/10 bg-white/90 p-1 w-full sm:w-auto justify-start">
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
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              title="Vue en liste"
              className={cn(
                'h-9 w-9 hidden sm:inline-flex',
                viewMode === 'list'
                  ? 'bg-[#121B53] text-white hover:bg-[#0B153D]'
                  : 'text-[#121B53] hover:bg-[#121B53]/10'
              )}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Chargement...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{noResultsLabel}</div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ entreprise, admin }) => {
              const paid = isAdminPaidThisMonth(admin?.id)
              const lastPaidAt = getLastPaidAt(admin?.id)
              const isSelected = selectedEntrepriseId === entreprise.id
              const allowCustomAmount = Boolean(admin?.subscriptionAllowCustomAmount)
              const paymentAmount = resolvePaymentAmount(admin)
              const isPaying = Boolean(admin?.id) && payingAdminId === admin.id
              return (
              <Card
                key={entreprise.id}
                className={cn(
                  'group relative overflow-hidden border border-[#121B53]/10 shadow-[0_16px_35px_rgba(14,20,60,0.12)] hover:shadow-[0_24px_60px_rgba(14,20,60,0.18)] transition-all',
                  'bg-white'
                )}
              >
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#121B53]/60">Entreprise</p>
                      <h3 className="break-words text-lg font-semibold text-[#121B53]">{entreprise.name || '—'}</h3>
                      <p className="mt-1 text-xs text-[#121B53]/60">
                        Identifiant: <span className="font-mono break-all">{entreprise.id}</span>
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#121B53]/10 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
                      <Building2 className="h-5 w-5 text-[#121B53]" />
                    </div>
                  </div>
                  {isSelected ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-[#121B53]/60">Admin</span>
                        {admin ? (
                          <Badge variant="secondary">{admin.name}</Badge>
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-[#121B53]/60">Paiement</span>
                        <Badge className={paid ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'}>
                          {paid ? 'Payé ce mois' : 'Non payé'}
                        </Badge>
                      </div>
                      {lastPaidAt ? (
                        <div className="text-xs text-[#121B53]/60">
                          Dernier paiement: {new Date(lastPaidAt).toLocaleDateString('fr-FR')}
                        </div>
                      ) : null}
                      <div className="text-xs text-[#121B53]/60">
                        ID: <span className="font-mono">{entreprise.id}</span>
                      </div>
                      <div className="pt-2 space-y-2">
                        <Button
                          size="sm"
                          className="w-full bg-[#121B53] text-white hover:bg-[#0B153D]"
                          disabled={!admin || enteringId === admin?.id}
                          onClick={() => onEnterAdmin(admin)}
                        >
                          {enteringId === admin?.id ? 'Ouverture...' : "Entrer dans l'espace"}
                        </Button>
                        {admin ? (
                          <div className="space-y-2 rounded-xl border border-[#121B53]/10 bg-white/80 p-3">
                            <div className="space-y-1">
                              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#121B53]/55">
                                Paiement direct
                              </p>
                              <Input
                                value={paymentAmount}
                                disabled={!allowCustomAmount || isPaying || paid}
                                onChange={(event) => {
                                  if (!allowCustomAmount) return
                                  setPaymentAmount(admin.id, event.target.value.replace(/[^\d]/g, ''))
                                }}
                                className="border-[#121B53]/20 bg-white"
                              />
                              <p className="text-[11px] text-[#121B53]/60">
                                {allowCustomAmount
                                  ? 'Montant modifiable pour cet admin.'
                                  : 'Montant verrouille par le plan de cet admin.'}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                              disabled={isPaying || paid}
                              onClick={() => onPaySubscription(admin, Number(paymentAmount))}
                            >
                              {paid ? 'Deja paye' : isPaying ? 'Paiement...' : 'Payer / Valider'}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-[#121B53]/25 text-[#121B53] hover:bg-[#121B53]/10"
                        onClick={() => onSelectEntreprise(entreprise.id)}
                      >
                        Voir les détails
                      </Button>
                    </div>
                  )}
                </CardContent>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-[#121B53]/10 opacity-0 transition-opacity group-hover:opacity-100" />
              </Card>
              )
            })}
          </div>
        ) : (
          <>
            <div className="md:hidden p-4 space-y-3">
              {rows.map(({ entreprise, admin }) => {
                const paid = isAdminPaidThisMonth(admin?.id)
                const lastPaidAt = getLastPaidAt(admin?.id)
                const isSelected = selectedEntrepriseId === entreprise.id
                const allowCustomAmount = Boolean(admin?.subscriptionAllowCustomAmount)
                const paymentAmount = resolvePaymentAmount(admin)
                const isPaying = Boolean(admin?.id) && payingAdminId === admin.id
                return (
                  <Card key={entreprise.id} className="border border-[#121B53]/10 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#121B53]/55">Entreprise</p>
                        <p className="text-base font-semibold text-[#121B53] break-words">{entreprise.name || '—'}</p>
                        <p className="text-xs text-[#121B53]/60 break-all">ID: {entreprise.id}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {admin ? <Badge variant="secondary">{admin.name}</Badge> : <Badge variant="outline">—</Badge>}
                        <Badge className={paid ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'}>
                          {paid ? 'Payé ce mois' : 'Non payé'}
                        </Badge>
                        {lastPaidAt ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(lastPaidAt).toLocaleDateString('fr-FR')}
                          </span>
                        ) : null}
                      </div>

                      {isSelected ? (
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            className="w-full bg-[#121B53] text-white hover:bg-[#0B153D]"
                            disabled={!admin || enteringId === admin?.id}
                            onClick={() => onEnterAdmin(admin)}
                          >
                            {enteringId === admin?.id ? 'Ouverture...' : "Entrer dans l'espace"}
                          </Button>
                          {admin ? (
                            <>
                              <Input
                                value={paymentAmount}
                                disabled={!allowCustomAmount || isPaying || paid}
                                onChange={(event) => {
                                  if (!allowCustomAmount) return
                                  setPaymentAmount(admin.id, event.target.value.replace(/[^\d]/g, ''))
                                }}
                                className="border-[#121B53]/20 bg-white"
                              />
                              <Button
                                size="sm"
                                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                                disabled={isPaying || paid}
                                onClick={() => onPaySubscription(admin, Number(paymentAmount))}
                              >
                                {paid ? 'Deja paye' : isPaying ? 'Paiement...' : 'Payer / Valider'}
                              </Button>
                            </>
                          ) : null}
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => onSelectEntreprise(entreprise.id)}>
                          Voir les détails
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-[760px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(({ entreprise, admin }) => {
                      const paid = isAdminPaidThisMonth(admin?.id)
                      const lastPaidAt = getLastPaidAt(admin?.id)
                      const isSelected = selectedEntrepriseId === entreprise.id
                      const allowCustomAmount = Boolean(admin?.subscriptionAllowCustomAmount)
                      const paymentAmount = resolvePaymentAmount(admin)
                      const isPaying = Boolean(admin?.id) && payingAdminId === admin.id
                      return (
                        <TableRow key={entreprise.id}>
                          <TableCell className="font-medium">{entreprise.name || '—'}</TableCell>
                          <TableCell>
                            {isSelected && admin ? <Badge variant="secondary">{admin.name}</Badge> : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{isSelected ? entreprise.id : '—'}</TableCell>
                          <TableCell>
                            {isSelected ? (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  disabled={!admin || enteringId === admin?.id}
                                  onClick={() => onEnterAdmin(admin)}
                                >
                                  {enteringId === admin?.id ? 'Ouverture...' : "Entrer dans l'espace"}
                                </Button>
                                {admin ? (
                                  <>
                                    <Input
                                      value={paymentAmount}
                                      disabled={!allowCustomAmount || isPaying || paid}
                                      onChange={(event) => {
                                        if (!allowCustomAmount) return
                                        setPaymentAmount(admin.id, event.target.value.replace(/[^\d]/g, ''))
                                      }}
                                      className="h-9 w-[150px] border-[#121B53]/20 bg-white"
                                    />
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                                      disabled={isPaying || paid}
                                      onClick={() => onPaySubscription(admin, Number(paymentAmount))}
                                    >
                                      {paid ? 'Deja paye' : isPaying ? 'Paiement...' : 'Payer / Valider'}
                                    </Button>
                                  </>
                                ) : null}
                                <Badge className={paid ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'}>
                                  {paid ? 'Payé ce mois' : 'Non payé'}
                                </Badge>
                                {lastPaidAt ? (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(lastPaidAt).toLocaleDateString('fr-FR')}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => onSelectEntreprise(entreprise.id)}>
                                Voir les détails
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
