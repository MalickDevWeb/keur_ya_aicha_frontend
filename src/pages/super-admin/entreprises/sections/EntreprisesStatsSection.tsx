import { StatsCards } from '@/pages/common/StatsCards'
import { Building2, Users } from 'lucide-react'

type EntreprisesStatsSectionProps = {
  entreprisesCount: number
  adminsCount: number
}

export function EntreprisesStatsSection({ entreprisesCount, adminsCount }: EntreprisesStatsSectionProps) {
  const cards = [
    {
      title: 'Entreprises',
      value: entreprisesCount,
      icon: <Building2 className="h-6 w-6 text-white" />,
      className:
        'border-0 bg-[#121B53] text-white shadow-[0_18px_45px_rgba(10,16,48,0.35)]',
    },
    {
      title: 'Admins',
      value: adminsCount,
      icon: <Users className="h-6 w-6 text-white" />,
      className:
        'border-0 bg-[#233A8C] text-white shadow-[0_18px_45px_rgba(18,34,94,0.32)]',
    },
  ]

  return <StatsCards cards={cards} gridClassName="grid gap-4 sm:grid-cols-2" />
}
