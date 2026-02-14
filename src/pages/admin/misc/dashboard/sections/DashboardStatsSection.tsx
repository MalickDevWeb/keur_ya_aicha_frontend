import { CardStat } from '@/components/CardStat'

type StatCard = {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  variant: 'default' | 'success' | 'danger' | 'warning'
  isCurrency?: boolean
}

type DashboardStatsSectionProps = {
  cards: StatCard[]
}

export function DashboardStatsSection({ cards }: DashboardStatsSectionProps) {
  return (
    <div className="grid gap-3 sm:gap-3 lg:gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 auto-rows-max">
      {cards.map((stat) => (
        <div key={stat.title} className="animate-fade-in">
          <CardStat
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            variant={stat.variant}
            isCurrency={stat.isCurrency}
          />
        </div>
      ))}
    </div>
  )
}
