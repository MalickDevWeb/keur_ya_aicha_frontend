import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PaymentStats } from '../types'

type PaymentsStatsSectionProps = {
  stats: PaymentStats
}

export function PaymentsStatsSection({ stats }: PaymentsStatsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-highlight to-accent shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-secondary uppercase tracking-wider">Total Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">{stats.paid} complètement payés</p>
            </div>
            <div className="text-5xl opacity-20">📊</div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-highlight to-card shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Montant Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black text-foreground">
                {(stats.totalAmount / 1000).toFixed(0)}
                <span className="text-lg">K</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">FCFA</p>
            </div>
            <div className="text-5xl opacity-20">💰</div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-highlight to-success shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-success uppercase tracking-wider">Montant Payé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black text-foreground">
                {(stats.paidAmount / 1000).toFixed(0)}
                <span className="text-lg">K</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">FCFA encaissés</p>
            </div>
            <div className="text-5xl opacity-20">✅</div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-highlight to-warning shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-warning uppercase tracking-wider">Restant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black text-foreground">
                {(stats.remainingAmount / 1000).toFixed(0)}
                <span className="text-lg">K</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">FCFA à recouvrer</p>
            </div>
            <div className="text-5xl opacity-20">⏳</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
