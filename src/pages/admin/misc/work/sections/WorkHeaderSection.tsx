import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type WorkHeaderSectionProps = {
  onBack: () => void
  showGuide: boolean
  onToggleGuide: () => void
}

export function WorkHeaderSection({ onBack, showGuide, onToggleGuide }: WorkHeaderSectionProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">📋 Travaux à faire</h1>
          <p className="text-muted-foreground">Gérez les tâches et travaux de maintenance</p>
        </div>
      </div>
      <Button variant="outline" onClick={onToggleGuide}>
        {showGuide ? 'Masquer le guide' : "❓ Guide d'utilisation"}
      </Button>
    </div>
  )
}
