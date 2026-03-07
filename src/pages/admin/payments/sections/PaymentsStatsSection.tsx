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
      wrapperClass: 'border-[#B8D4FF] bg-[#EDF5FF]',
      titleClass: 'text-[#5D73A8]',
      iconClass: 'bg-[#C6D8FF] text-[#4939F5]',
    },
    {
      id: 'totalAmount',
      title: 'Montant Total',
      value: (stats.totalAmount / 1000).toFixed(0),
      suffix: 'K',
      helper: 'FCFA',
      icon: WalletCards,
      wrapperClass: 'border-[#B8D4FF] bg-[#EAF2FF]',
      titleClass: 'text-[#5D73A8]',
      iconClass: 'bg-[#CFE0FF] text-[#2E49B6]',
    },
    {
      id: 'paid',
      title: 'Montant Payé',
      value: (stats.paidAmount / 1000).toFixed(0),
      suffix: 'K',
      helper: 'FCFA encaissés',
      icon: CircleCheckBig,
      wrapperClass: 'border-[#9BE7BE] bg-[#EAFBF0]',
      titleClass: 'text-[#2F8F5B]',
      iconClass: 'bg-[#B8F0CC] text-[#16A34A]',
    },
    {
      id: 'remaining',
      title: 'Restant',
      value: (stats.remainingAmount / 1000).toFixed(0),
      suffix: 'K',
      helper: 'FCFA à recouvrer',
      icon: Hourglass,
      wrapperClass: 'border-[#E7D778] bg-[#FFF8E7]',
      titleClass: 'text-[#A46A0B]',
      iconClass: 'bg-[#F4E58E] text-[#D97706]',
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
            className={`group relative overflow-hidden rounded-[20px] border ${card.wrapperClass} shadow-[0_14px_32px_rgba(18,27,83,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(18,27,83,0.16)] animate-fade-in`}
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/55 transition-transform duration-500 group-hover:scale-125" />
            <div className="pointer-events-none absolute -left-6 -bottom-10 h-24 w-24 rounded-full bg-white/35 transition-transform duration-500 group-hover:scale-125" />
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
                <div className={`rounded-2xl p-3 transition-colors duration-300 ${card.iconClass}`}>
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
