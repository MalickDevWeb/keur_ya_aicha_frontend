import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type BlacklistedHeaderSectionProps = {
  onBack: () => void
}

export function BlacklistedHeaderSection({ onBack }: BlacklistedHeaderSectionProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Liste Noire</h1>
          <p className="text-muted-foreground">Clients refusés/problématiques</p>
        </div>
      </div>
      <AlertTriangle className="h-6 w-6 text-destructive" />
    </div>
  )
}
