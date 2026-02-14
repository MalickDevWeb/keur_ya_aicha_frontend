import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DocumentFilter } from '../types'

const FILTER_LABELS: Record<DocumentFilter, string> = {
  'missing-contracts': '🔧 Mode correction: Locations sans contrat',
  'unsigned-contracts': '🔧 Mode correction: Contrats non signés',
  '': '',
}

type DocumentsHeaderSectionProps = {
  filterType: DocumentFilter
  onBack: () => void
}

export function DocumentsHeaderSection({ filterType, onBack }: DocumentsHeaderSectionProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">📑 Documents</h1>
          <p className="text-muted-foreground">Gestion complète des documents et contrats</p>
          {filterType && <Badge className="mt-2">{FILTER_LABELS[filterType]}</Badge>}
        </div>
      </div>
    </div>
  )
}
