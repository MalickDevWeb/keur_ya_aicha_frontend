import { ArrowLeft, Download, Eye } from 'lucide-react'
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
  canViewAll: boolean
  canDownloadAll: boolean
  isDownloadingAll: boolean
  onBack: () => void
  onViewAll: () => void
  onDownloadAll: () => void
}

export function DocumentsHeaderSection({
  filterType,
  canViewAll,
  canDownloadAll,
  isDownloadingAll,
  onBack,
  onViewAll,
  onDownloadAll,
}: DocumentsHeaderSectionProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full items-start gap-2 sm:items-center sm:gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold leading-tight sm:text-3xl">📑 Documents</h1>
          <p className="break-words text-sm text-muted-foreground sm:text-base">
            Gestion complète des documents et contrats
          </p>
          {filterType && <Badge className="mt-2">{FILTER_LABELS[filterType]}</Badge>}
        </div>
      </div>
      <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
        <Button variant="outline" className="w-full sm:w-auto" onClick={onViewAll} disabled={!canViewAll}>
          <Eye className="mr-2 h-4 w-4" />
          Voir tout
        </Button>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onDownloadAll}
          disabled={!canDownloadAll || isDownloadingAll}
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloadingAll ? 'Téléchargement...' : 'Télécharger tout'}
        </Button>
        <Button
          className="w-full bg-[#121B53] text-white hover:bg-[#0B153D] sm:w-auto"
          onClick={() => {
            const el = document.getElementById('upload-document')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }}
        >
          + Téléverser
        </Button>
      </div>
    </div>
  )
}
