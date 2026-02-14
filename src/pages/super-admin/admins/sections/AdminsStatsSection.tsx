import { StatsCards } from '@/pages/common/StatsCards'
import { Shield, Users } from 'lucide-react'

type AdminsStatsSectionProps = {
  adminsCount: number
  entreprisesCount: number
  actifsCount: number
}

export function AdminsStatsSection({ adminsCount, entreprisesCount, actifsCount }: AdminsStatsSectionProps) {
  const cards = [
    {
      title: 'Admins',
      value: adminsCount,
      icon: <Users className="h-6 w-6 text-white" />,
      className:
        'border-0 bg-gradient-to-br from-[#121B53] via-[#1A2A78] to-[#0B153D] text-white shadow-[0_18px_45px_rgba(10,16,48,0.35)]',
    },
    {
      title: 'Entreprises',
      value: entreprisesCount,
      icon: <Shield className="h-6 w-6 text-white" />,
      className:
        'border-0 bg-gradient-to-br from-[#233A8C] via-[#2E52D0] to-[#162B66] text-white shadow-[0_18px_45px_rgba(18,34,94,0.32)]',
    },
    {
      title: 'Actifs',
      value: actifsCount,
      icon: <Users className="h-6 w-6 text-white" />,
      className:
        'border-0 bg-gradient-to-br from-[#1A4E9A] via-[#1970C2] to-[#0E3A7A] text-white shadow-[0_18px_45px_rgba(14,38,90,0.32)]',
    },
  ]

  return (
    <StatsCards cards={cards} />
  )
}
