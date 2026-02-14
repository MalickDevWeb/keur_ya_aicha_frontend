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
        'border border-white/10 bg-gradient-to-br from-[#0B153D] via-[#121B53] to-[#1A2A78] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_20px_55px_rgba(10,16,48,0.4)]',
    },
    {
      title: 'Entreprises',
      value: entreprisesCount,
      icon: <Shield className="h-6 w-6 text-white" />,
      className:
        'border border-white/10 bg-gradient-to-br from-[#1A2A78] via-[#2546B6] to-[#162B66] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_20px_55px_rgba(18,34,94,0.35)]',
    },
    {
      title: 'Actifs',
      value: actifsCount,
      icon: <Users className="h-6 w-6 text-white" />,
      className:
        'border border-white/10 bg-gradient-to-br from-[#0E3A7A] via-[#1D5AA8] to-[#1970C2] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_20px_55px_rgba(14,38,90,0.35)]',
    },
  ]

  return (
    <StatsCards cards={cards} />
  )
}
