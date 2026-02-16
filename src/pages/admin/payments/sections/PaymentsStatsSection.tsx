import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartColumnBig, CircleCheckBig, Hourglass, WalletCards } from 'lucide-react'
import type { PaymentStats } from '../types'

type PaymentsStatsSectionProps = {
  stats: PaymentStats
}

export function PaymentsStatsSection({ stats }: PaymentsStatsSectionProps) {
  const cards = [
    {
      id: 'total',
      title: 'Total Paiements',
      value: stats.total,
      suffix: '',
      helper: `${stats.paid} complètement payés`,
      icon: ChartColumnBig,
      wrapperClass: 'from-[#78C8FF] via-[#5BA5E2] to-[#3A79C8]',
      titleClass: 'text-[#102A6A]',
    },
    {
      id: 'totalAmount',
      title: 'Montant Total',
      value: (stats.totalAmount / 1000).toFixed(0),
      suffix: 'K',
      helper: 'FCFA',
      icon: WalletCards,
      wrapperClass: 'from-[#D6F2FF] via-[#C2E8F8] to-[#B7DDEB]',
      titleClass: 'text-[#1E2D56]',
    },
    {
      id: 'paid',
      title: 'Montant Payé',
      value: (stats.paidAmount / 1000).toFixed(0),
      suffix: 'K',
      helper: 'FCFA encaissés',
      icon: CircleCheckBig,
      wrapperClass: 'from-[#55E7C1] via-[#16D3A8] to-[#00B975]',
      titleClass: 'text-[#047857]',
    },
    {
      id: 'remaining',
      title: 'Restant',
      value: (stats.remainingAmount / 1000).toFixed(0),
      suffix: 'K',
      helper: 'FCFA à recouvrer',
      icon: Hourglass,
      wrapperClass: 'from-[#D0ECF3] via-[#E7D58A] to-[#F5A300]',
      titleClass: 'text-[#B36A00]',
    },
  ] as const

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card
            key={card.id}
            style={{ animationDelay: `${index * 70}ms` }}
            className={`group relative overflow-hidden border border-white/50 bg-gradient-to-br ${card.wrapperClass} shadow-[0_10px_28px_rgba(12,18,60,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(12,18,60,0.24)] animate-fade-in`}
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/25 transition-transform duration-500 group-hover:scale-125" />
            <div className="pointer-events-none absolute -left-6 -bottom-10 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className={`text-xs font-semibold uppercase tracking-[0.16em] ${card.titleClass}`}>{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[52px] leading-none font-black text-[#121B53]">
                    {card.value}
                    {card.suffix ? <span className="ml-1 text-3xl">{card.suffix}</span> : null}
                  </p>
                  <p className="mt-3 text-base font-medium text-[#2F4A8F]">{card.helper}</p>
                </div>
                <div className="rounded-2xl bg-white/18 p-3 text-[#121B53]/50 transition-colors duration-300 group-hover:bg-white/30 group-hover:text-[#121B53]/70">
                  <Icon className="h-11 w-11" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
