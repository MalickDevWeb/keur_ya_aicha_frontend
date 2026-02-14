import { Filter, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/SearchInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ArchiveFilterType } from '../types'

type ArchiveFiltersSectionProps = {
  search: string
  typeFilter: ArchiveFilterType
  showFilters: boolean
  onSearchChange: (value: string) => void
  onTypeFilterChange: (value: ArchiveFilterType) => void
  onToggleFilters: () => void
  onClearFilters: () => void
}

export function ArchiveFiltersSection({
  search,
  typeFilter,
  showFilters,
  onSearchChange,
  onTypeFilterChange,
  onToggleFilters,
  onClearFilters,
}: ArchiveFiltersSectionProps) {
  const hasActiveFilters = typeFilter !== 'all'

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Rechercher par nom, téléphone, CNI..."
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
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="archived">Archivés</SelectItem>
              <SelectItem value="blacklisted">Blacklist</SelectItem>
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
