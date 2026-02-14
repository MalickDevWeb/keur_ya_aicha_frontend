import { ArrowLeft, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ArchivedHeaderSectionProps = {
  onBack: () => void
}

export function ArchivedHeaderSection({ onBack }: ArchivedHeaderSectionProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Clients Archivés</h1>
          <p className="text-muted-foreground">Gérez les clients archivés et inactifs</p>
        </div>
      </div>
      <Archive className="h-6 w-6 text-slate-500" />
    </div>
  )
}
