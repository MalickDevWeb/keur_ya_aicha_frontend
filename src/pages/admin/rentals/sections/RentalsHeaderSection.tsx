import { Button } from '@/components/ui/button'
import { PageHeader } from '@/pages/common/PageHeader'
import { Plus } from 'lucide-react'

type RentalsHeaderSectionProps = {
  onAddRental: () => void
}

export function RentalsHeaderSection({ onAddRental }: RentalsHeaderSectionProps) {
  return (
    <PageHeader
      title="Locations"
      actions={
        <Button onClick={onAddRental} className="bg-secondary hover:bg-secondary/90">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une location
        </Button>
      }
    />
  )
}
