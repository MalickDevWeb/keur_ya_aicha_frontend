import { ResponsiveContainer, Pie, PieChart, Cell, Tooltip, Legend } from 'recharts'
import type { PaymentDistributionEntry } from '../types'

type PaymentsDistributionSectionProps = {
  paymentDistribution: PaymentDistributionEntry[]
  totalPayments: number
  pieColors: string[]
}

export function PaymentsDistributionSection({
  paymentDistribution,
  totalPayments,
  pieColors,
}: PaymentsDistributionSectionProps) {
  return (
    <div className="grid gap-4 rounded-3xl border border-border bg-card/80 p-4 shadow-xl sm:grid-cols-2">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">Répartition des paiements</p>
        <p className="text-sm text-foreground/80">Visualise le ratio paiements payés, non payés et partiels.</p>
        <ul className="mt-3 space-y-1 text-sm">
          {paymentDistribution.map((entry) => (
            <li key={entry.name}>
              <span className="font-semibold">{entry.name}</span>{' '}
              {`(${totalPayments === 0 ? 0 : Math.round((entry.value / totalPayments) * 100)}% • ${entry.value})`}
            </li>
          ))}
        </ul>
        <div className="mt-3 text-xs text-muted-foreground">
          Total paiements suivis : <span className="font-semibold">{totalPayments}</span>
        </div>
        {totalPayments === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">Aucune donnée de paiement disponible.</p>
        )}
      </div>
      <div className="min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={paymentDistribution}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              innerRadius={40}
              label={(entry) => `${entry.name} (${entry.value})`}
            >
              {paymentDistribution.map((entry, index) => (
                <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value} locations`} />
            <Legend layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
