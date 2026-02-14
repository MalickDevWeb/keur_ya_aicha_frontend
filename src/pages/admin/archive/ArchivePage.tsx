import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { useStore } from '@/stores/dataStore'
import { ArchiveHeaderSection } from './sections/ArchiveHeaderSection'
import { ArchiveStatsSection } from './sections/ArchiveStatsSection'
import { ArchiveFiltersSection } from './sections/ArchiveFiltersSection'
import { ArchiveTableSection } from './sections/ArchiveTableSection'
import type { ArchiveClient, ArchiveFilterType } from './types'
import { filterByStatus, formatArchiveDate, getArchiveClients, getArchiveStats, matchesClientSearch } from './utils'

export default function ArchivePage() {
  const navigate = useNavigate()
  const clients = useStore((state) => state.clients)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ArchiveFilterType>('all')
  const [showFilters, setShowFilters] = useState(false)

  const archivedClients = useMemo(() => getArchiveClients(clients as ArchiveClient[]), [clients])
  const stats = useMemo(() => getArchiveStats(archivedClients), [archivedClients])

  const filteredClients = useMemo(() => {
    const byStatus = filterByStatus(archivedClients, typeFilter)
    return byStatus.filter((client) => matchesClientSearch(client, search))
  }, [archivedClients, search, typeFilter])

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionWrapper>
        <ArchiveHeaderSection />
      </SectionWrapper>

      <SectionWrapper>
        <ArchiveStatsSection archived={stats.archived} blacklisted={stats.blacklisted} />
      </SectionWrapper>

      <SectionWrapper>
        <ArchiveFiltersSection
          search={search}
          typeFilter={typeFilter}
          showFilters={showFilters}
          onSearchChange={setSearch}
          onTypeFilterChange={setTypeFilter}
          onToggleFilters={() => setShowFilters((prev) => !prev)}
          onClearFilters={() => setTypeFilter('all')}
        />
      </SectionWrapper>

      <SectionWrapper>
        <ArchiveTableSection
          clients={filteredClients}
          formatDate={formatArchiveDate}
          onViewClient={(id) => navigate(`/clients/${id}`)}
          onRestoreClient={() => undefined}
        />
      </SectionWrapper>
    </div>
  )
}
