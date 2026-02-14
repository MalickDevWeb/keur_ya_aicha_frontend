import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type StatsCard = {
  title: string
  value: ReactNode
  icon?: ReactNode
  className?: string
  contentClassName?: string
}

type StatsCardsProps = {
  cards?: StatsCard[]
  children?: ReactNode
  gridClassName?: string
  className?: string
}

export function StatsCards({ cards, children, gridClassName, className }: StatsCardsProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-3', gridClassName, className)}>
      {cards?.map((card, index) => (
        <Card
          key={`${card.title}-${index}`}
          className={cn(
            'relative overflow-hidden border border-white/10 shadow-[0_14px_30px_rgba(11,20,60,0.25),inset_0_1px_0_rgba(255,255,255,0.22)]',
            'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_55%)]',
            card.className
          )}
        >
          <CardContent className={cn('p-5', card.contentClassName)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">{card.title}</p>
                <p className="text-2xl font-semibold">{card.value}</p>
              </div>
              {card.icon ? (
                <div className="rounded-2xl bg-white/12 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                  {card.icon}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
      {children}
    </div>
  )
}
