import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

type RentalsEmptySectionProps = {
  onAddRental: () => void
}

export function RentalsEmptySection({ onAddRental }: RentalsEmptySectionProps) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">Aucune location trouvée</p>
      <Button onClick={onAddRental}>
        <Plus className="w-4 h-4 mr-2" />
        Ajouter une location
      </Button>
    </div>
  )
}
