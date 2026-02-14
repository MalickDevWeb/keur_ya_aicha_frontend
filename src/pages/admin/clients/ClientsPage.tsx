import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import { useStore } from '@/stores/dataStore'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { ClientsHeaderSection } from './sections/ClientsHeaderSection'
import { ClientsFiltersSection } from './sections/ClientsFiltersSection'
import { ClientsCardsSection } from './sections/ClientsCardsSection'
import { ClientsTableSection } from './sections/ClientsTableSection'
import type { ClientFilters, ViewMode } from './types'
import { buildClientRows, filterClientRows } from './utils'

export default function ClientsPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const clients = useStore((state) => state.clients)
  const updateClient = useStore((state) => state.updateClient)
  const [filters, setFilters] = useState<ClientFilters>({
    search: '',
    statusFilter: 'all',
    typeFilter: 'all',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const rows = useMemo(() => buildClientRows(clients), [clients])
  const filteredRows = useMemo(() => filterClientRows(rows, filters), [rows, filters])

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, statusFilter: 'all', typeFilter: 'all' }))
  }

  const hasActiveFilters = filters.statusFilter !== 'all' || filters.typeFilter !== 'all'

  const handleArchiveClient = (clientId: string) => {
    updateClient(clientId, { status: 'archived' })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionWrapper>
        <ClientsHeaderSection
          title={t('clients.title')}
          addLabel={t('nav.addClient')}
          onAddClient={() => navigate('/clients/add')}
          onImportClients={() => navigate('/import/clients')}
        />
      </SectionWrapper>

      <Card>
        <CardHeader className="pb-4">
          <ClientsFiltersSection
            search={filters.search}
            onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            statusFilter={filters.statusFilter}
            onStatusFilterChange={(value) => setFilters((prev) => ({ ...prev, statusFilter: value as ClientFilters['statusFilter'] }))}
            typeFilter={filters.typeFilter}
            onTypeFilterChange={(value) => setFilters((prev) => ({ ...prev, typeFilter: value }))}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((prev) => !prev)}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            t={t}
          />
        </CardHeader>

        <CardContent className="p-0">
          {filteredRows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t('clients.noResults')}</div>
          ) : viewMode === 'cards' ? (
            <ClientsCardsSection
              rows={filteredRows}
              onView={(clientId) => navigate(`/clients/${clientId}`)}
              onEdit={(clientId) => navigate(`/clients/${clientId}/edit`)}
              onArchive={handleArchiveClient}
              t={t}
            />
          ) : (
            <ClientsTableSection
              rows={filteredRows}
              onView={(clientId) => navigate(`/clients/${clientId}`)}
              onEdit={(clientId) => navigate(`/clients/${clientId}/edit`)}
              onArchive={handleArchiveClient}
              t={t}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
