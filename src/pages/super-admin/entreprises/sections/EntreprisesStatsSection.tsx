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
        'border-0 bg-gradient-to-br from-[#121B53] via-[#1A2A78] to-[#0B153D] text-white shadow-[0_18px_45px_rgba(10,16,48,0.35)]',
    },
    {
      title: 'Admins',
      value: adminsCount,
      icon: <Users className="h-6 w-6 text-white" />,
      className:
        'border-0 bg-gradient-to-br from-[#233A8C] via-[#2E52D0] to-[#162B66] text-white shadow-[0_18px_45px_rgba(18,34,94,0.32)]',
    },
  ]

  return <StatsCards cards={cards} gridClassName="grid gap-4 sm:grid-cols-2" />
}
