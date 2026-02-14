import { Filter, Grid3x3, List, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/SearchInput'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ViewMode } from '../types'

type ClientsFiltersSectionProps = {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  t: (key: string) => string
}

export function ClientsFiltersSection({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onClearFilters,
  viewMode,
  onViewModeChange,
  t,
}: ClientsFiltersSectionProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={onSearchChange} className="flex-1" />
        <Button variant="outline" onClick={onToggleFilters} className={cn(showFilters && 'bg-muted')}>
          <Filter className="w-4 h-4 mr-2" />
          {t('filter.status')}
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
              2
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
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t mt-4">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('filter.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filter.all')}</SelectItem>
              <SelectItem value="paid">{t('status.paid')}</SelectItem>
              <SelectItem value="partial">{t('status.partial')}</SelectItem>
              <SelectItem value="unpaid">{t('status.unpaid')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('filter.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filter.all')}</SelectItem>
              <SelectItem value="studio">{t('property.studio')}</SelectItem>
              <SelectItem value="room">{t('property.room')}</SelectItem>
              <SelectItem value="apartment">{t('property.apartment')}</SelectItem>
              <SelectItem value="villa">{t('property.villa')}</SelectItem>
              <SelectItem value="other">{t('property.other')}</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="w-4 h-4 mr-1" />
              {t('common.cancel')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
