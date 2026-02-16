import { ArrowLeft, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ArchivedHeaderSectionProps = {
  onBack: () => void
}

export function ArchivedHeaderSection({ onBack }: ArchivedHeaderSectionProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl">Clients Archivés</h1>
          <p className="text-sm text-muted-foreground sm:text-base break-words">
            Gérez les clients archivés et inactifs
          </p>
        </div>
      </div>
      <Archive className="hidden h-6 w-6 text-slate-500 sm:block" />
    </div>
  )
}
