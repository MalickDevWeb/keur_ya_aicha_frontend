import { Filter, Grid3x3, List, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/SearchInput'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RentalFilters, ViewMode } from '../types'

type RentalsFiltersSectionProps = {
  filters: RentalFilters
  onSearchChange: (value: string) => void
  onPropertyTypeChange: (value: string) => void
  onStatusChange: (value: RentalFilters['statusFilter']) => void
  showFilters: boolean
  onToggleFilters: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function RentalsFiltersSection({
  filters,
  onSearchChange,
  onPropertyTypeChange,
  onStatusChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onClearFilters,
  viewMode,
  onViewModeChange,
}: RentalsFiltersSectionProps) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          value={filters.search}
          onChange={onSearchChange}
          placeholder="Rechercher par client, bien..."
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className={cn('w-full sm:w-auto', showFilters && 'bg-muted')}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtres
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
              {(filters.propertyTypeFilter !== 'all' ? 1 : 0) + (filters.statusFilter !== 'all' ? 1 : 0)}
            </Badge>
          )}
        </Button>
        <div className="flex gap-2 border-t pt-3 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('cards')}
            title="Vue en cartes"
            className="flex-1 sm:flex-none"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            title="Vue en liste"
            className="flex-1 sm:flex-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <Select value={filters.propertyTypeFilter} onValueChange={onPropertyTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Type de bien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="apartment">Appartement</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="room">Chambre</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="house">Maison</SelectItem>
              <SelectItem value="shop">Commerce</SelectItem>
              <SelectItem value="office">Bureau</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Caution non soldée</SelectItem>
              <SelectItem value="completed">Caution soldée</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" onClick={onClearFilters} className="col-span-full sm:col-span-2">
              <X className="w-4 h-4 mr-2" />
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
