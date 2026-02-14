import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SignedContractsHeaderSectionProps = {
  onBack: () => void
}

export function SignedContractsHeaderSection({ onBack }: SignedContractsHeaderSectionProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Contrats Signés</h1>
          <p className="text-muted-foreground">Tous les contrats de location signés</p>
        </div>
      </div>
    </div>
  )
}
