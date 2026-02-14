import { Filter, Grid3x3, List, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/SearchInput'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PaymentFilters, ViewMode } from '../types'

type PaymentsFiltersSectionProps = {
  filters: PaymentFilters
  onSearchChange: (value: string) => void
  onStatusChange: (value: PaymentFilters['statusFilter']) => void
  showFilters: boolean
  onToggleFilters: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function PaymentsFiltersSection({
  filters,
  onSearchChange,
  onStatusChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onClearFilters,
  viewMode,
  onViewModeChange,
}: PaymentsFiltersSectionProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={filters.search}
          onChange={onSearchChange}
          placeholder="Rechercher par client, bien..."
          className="flex-1"
        />
        <Button variant="outline" onClick={onToggleFilters} className={cn(showFilters && 'bg-muted')}>
          <Filter className="w-4 h-4 mr-2" />
          Filtres
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
              1
            </Badge>
          )}
        </Button>
        <div className="flex gap-2 border-l pl-4">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('cards')}
            title="Vue en cartes"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            title="Vue en liste"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <Select value={filters.statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
              <SelectItem value="partial">Partiel</SelectItem>
              <SelectItem value="unpaid">Impayé</SelectItem>
              <SelectItem value="late">En retard</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" onClick={onClearFilters} className="col-full sm:col-span-2">
              <X className="w-4 h-4 mr-2" />
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
