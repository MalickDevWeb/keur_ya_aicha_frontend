import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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

type ClientQuickFilter = '' | 'invalid' | 'no-rentals' | 'incomplete-rentals'

const hasMeaningfulPropertyName = (value: string | undefined) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return false
  return !['non renseigné', 'bien inconnu', 'n/a', 'na'].includes(normalized)
}

export default function ClientsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useI18n()
  const clients = useStore((state) => state.clients)
  const updateClient = useStore((state) => state.updateClient)
  const [filters, setFilters] = useState<ClientFilters>({
    search: '',
    statusFilter: 'all',
    typeFilter: 'all',
  })
  const [quickFilter, setQuickFilter] = useState<ClientQuickFilter>('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter === 'invalid' || filter === 'no-rentals' || filter === 'incomplete-rentals') {
      setQuickFilter(filter)
      return
    }
    setQuickFilter('')
  }, [searchParams])

  const rows = useMemo(() => buildClientRows(clients), [clients])
  const filteredRows = useMemo(() => {
    const baseRows = filterClientRows(rows, filters)
    if (!quickFilter) return baseRows

    return baseRows.filter(({ client }) => {
      if (quickFilter === 'invalid') {
        return !String(client.firstName || '').trim() || !String(client.lastName || '').trim()
      }
      if (quickFilter === 'no-rentals') {
        return !Array.isArray(client.rentals) || client.rentals.length === 0
      }
      if (quickFilter === 'incomplete-rentals') {
        return (client.rentals || []).some((rental) => !hasMeaningfulPropertyName(rental.propertyName))
      }
      return true
    })
  }, [rows, filters, quickFilter])

  const clearQuickFilterParam = () => {
    const next = new URLSearchParams(searchParams)
    if (!next.has('filter')) return
    next.delete('filter')
    setSearchParams(next, { replace: true })
  }

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, statusFilter: 'all', typeFilter: 'all' }))
    setQuickFilter('')
    clearQuickFilterParam()
  }

  const hasActiveFilters = filters.statusFilter !== 'all' || filters.typeFilter !== 'all' || quickFilter !== ''

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
          {quickFilter && (
            <p className="mt-3 text-xs text-muted-foreground">
              Filtre rapide actif:{' '}
              {quickFilter === 'invalid'
                ? 'clients invalides'
                : quickFilter === 'no-rentals'
                  ? 'clients sans location'
                  : 'locations incomplètes'}
            </p>
          )}
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
