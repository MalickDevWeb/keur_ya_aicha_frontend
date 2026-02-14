import { Button } from '@/components/ui/button'
import { PageHeader } from '@/pages/common/PageHeader'
import { Plus } from 'lucide-react'

type PaymentsHeaderSectionProps = {
  onAddPayment: () => void
}

export function PaymentsHeaderSection({ onAddPayment }: PaymentsHeaderSectionProps) {
  return (
    <PageHeader
      title="Paiements Mensuels"
      description="Gérez et suivez tous les paiements de locations"
      actions={
        <Button onClick={onAddPayment} className="bg-secondary hover:bg-secondary/90 text-white font-bold shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un paiement
        </Button>
      }
    />
  )
}
