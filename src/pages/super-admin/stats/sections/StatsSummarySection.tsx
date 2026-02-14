import { CardStat } from '@/components/CardStat'
import { StatsCards } from '@/pages/common/StatsCards'
import { Building2, Shield, Users } from 'lucide-react'

type StatsSummarySectionProps = {
  adminsCount: number
  entreprisesCount: number
  pendingCount: number
}

export function StatsSummarySection({ adminsCount, entreprisesCount, pendingCount }: StatsSummarySectionProps) {
  return (
    <StatsCards gridClassName="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <CardStat title="Admins" value={adminsCount} icon={Users} variant="default" />
      <CardStat title="Entreprises" value={entreprisesCount} icon={Building2} variant="success" />
      <CardStat
        title="Demandes en attente"
        value={pendingCount}
        icon={Shield}
        variant={pendingCount > 0 ? 'warning' : 'default'}
      />
    </StatsCards>
  )
}
