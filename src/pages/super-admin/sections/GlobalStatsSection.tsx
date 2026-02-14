import { CardStat } from '@/components/CardStat'
import { StatsCards } from '@/pages/common/StatsCards'
import { Building2, Shield, Users } from 'lucide-react'
import { ResponsiveContainer, Pie, PieChart, Cell, Tooltip, Legend } from 'recharts'
import { AdminDTO, EntrepriseDTO, AdminRequestDTO } from '@/dto/frontend/responses'
import type { PaymentDistributionEntry } from '../types'

type GlobalStatsSectionProps = {
  sectionId: string
  admins: AdminDTO[]
  entreprises: EntrepriseDTO[]
  pendingRequests: AdminRequestDTO[]
  paymentDistribution: PaymentDistributionEntry[]
  totalPayments: number
  pieColors: string[]
}

export function GlobalStatsSection({
  sectionId,
  admins,
  entreprises,
  pendingRequests,
  paymentDistribution,
  totalPayments,
  pieColors,
}: GlobalStatsSectionProps) {
  return (
    <section id={sectionId} aria-labelledby={`${sectionId}-title`} className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={`${sectionId}-title`} className="text-lg font-semibold text-[#121B53]">Stats globales & paiements</h2>
          <p className="text-sm text-muted-foreground">Suivi global des administrations et des encaissements</p>
        </div>
        <p className="text-xs uppercase tracking-[0.25em] text-[#121B53]/60">Performance</p>
      </div>
      <StatsCards gridClassName="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <CardStat title="Admins" value={admins.length} icon={Users} variant="default" />
        <CardStat title="Entreprises" value={entreprises.length} icon={Building2} variant="success" />
        <CardStat title="Demandes en attente" value={pendingRequests.length} icon={Shield} variant={pendingRequests.length > 0 ? 'warning' : 'default'} />
      </StatsCards>
      <div className="grid gap-4 rounded-3xl border border-[#121B53]/10 bg-white/90 p-4 shadow-xl sm:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold text-[#121B53]">Répartition des paiements</p>
          <p className="text-sm text-muted-foreground mb-3">
            Visualise le ratio paiements payés, non payés et partiels.
          </p>
          <ul className="space-y-2 text-sm">
            {paymentDistribution.map((entry, index) => (
              <li key={entry.name} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pieColors[index % pieColors.length] }}
                  />
                  <span className="font-medium text-[#121B53]">{entry.name}</span>
                </div>
                <span className="text-muted-foreground">
                  {entry.value} ({totalPayments === 0 ? 0 : Math.round((entry.value / totalPayments) * 100)}%)
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between py-2 border-t mt-2">
              <span className="font-semibold text-[#121B53]">Total paiements suivis</span>
              <span className="font-semibold text-[#121B53]">{totalPayments}</span>
            </li>
          </ul>
          {totalPayments === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">Aucune donnée de paiement disponible.</p>
          )}
        </div>
        <div className="min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={paymentDistribution}
                dataKey="value"
                nameKey="name"
                outerRadius={86}
                innerRadius={52}
                paddingAngle={4}
                labelLine={false}
              >
                {paymentDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value} paiements`} />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', color: '#121B53' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
