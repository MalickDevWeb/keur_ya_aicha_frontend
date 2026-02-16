import { CardStat } from '@/components/CardStat'
import { StatsCards } from '@/pages/common/StatsCards'
import { Building2, Shield, Users } from 'lucide-react'

type StatsSummarySectionProps = {
  adminsCount: number
  entreprisesCount: number
  pendingCount: number
}

export function StatsSummarySection({ adminsCount, entreprisesCount, pendingCount }: StatsSummarySectionProps) {
  const showEntreprises = entreprisesCount > 0
  const statsGridClassName = showEntreprises
    ? 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : 'grid gap-4 grid-cols-1 sm:grid-cols-2'

  return (
    <StatsCards gridClassName={statsGridClassName}>
      <CardStat title="Admins actifs" value={adminsCount} icon={Users} variant="default" />
      {showEntreprises ? (
        <CardStat title="Entreprises actives" value={entreprisesCount} icon={Building2} variant="success" />
      ) : null}
      <CardStat
        title="Demandes en attente"
        value={pendingCount}
        icon={Shield}
        variant={pendingCount > 0 ? 'warning' : 'default'}
      />
    </StatsCards>
  )
}
