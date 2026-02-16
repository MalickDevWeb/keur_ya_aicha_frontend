import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useStore } from '@/stores/dataStore'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import type { RentalFilters, ViewMode } from './types'
import { buildRentalRows, filterRentalRows } from './utils'
import { RentalsHeaderSection } from './sections/RentalsHeaderSection'
import { RentalsFiltersSection } from './sections/RentalsFiltersSection'
import { RentalsCardsSection } from './sections/RentalsCardsSection'
import { RentalsTableSection } from './sections/RentalsTableSection'
import { RentalsEmptySection } from './sections/RentalsEmptySection'
import { RentalsFooterSection } from './sections/RentalsFooterSection'

export default function RentalsPage() {
  const navigate = useNavigate()
  const clients = useStore((state) => state.clients)
  const [filters, setFilters] = useState<RentalFilters>({
    search: '',
    propertyTypeFilter: 'all',
    statusFilter: 'all',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const rows = useMemo(() => buildRentalRows(clients), [clients])
  const filteredRows = useMemo(() => filterRentalRows(rows, filters), [rows, filters])

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, propertyTypeFilter: 'all', statusFilter: 'all' }))
  }

  const hasActiveFilters = filters.propertyTypeFilter !== 'all' || filters.statusFilter !== 'all'

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionWrapper>
        <RentalsHeaderSection onAddRental={() => navigate('/clients')} />
      </SectionWrapper>

      <Card>
        <CardHeader className="pb-4">
          <RentalsFiltersSection
            filters={filters}
            onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            onPropertyTypeChange={(value) => setFilters((prev) => ({ ...prev, propertyTypeFilter: value }))}
            onStatusChange={(value) => setFilters((prev) => ({ ...prev, statusFilter: value }))}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((prev) => !prev)}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </CardHeader>

        <CardContent className={viewMode === 'cards' ? 'p-4 sm:p-6' : 'p-4 md:p-0'}>
          {filteredRows.length > 0 ? (
            viewMode === 'cards' ? (
              <RentalsCardsSection
                rows={filteredRows}
                onView={(clientId) => navigate(`/clients/${clientId}`)}
                onEdit={(rentalId) => navigate(`/rentals/${rentalId}/edit`)}
              />
            ) : (
              <RentalsTableSection
                rows={filteredRows}
                onView={(clientId) => navigate(`/clients/${clientId}`)}
                onEdit={(rentalId) => navigate(`/rentals/${rentalId}/edit`)}
              />
            )
          ) : (
            <RentalsEmptySection onAddRental={() => navigate('/rentals/add')} />
          )}

          {filteredRows.length > 0 && <RentalsFooterSection total={filteredRows.length} />}
        </CardContent>
      </Card>
    </div>
  )
}
