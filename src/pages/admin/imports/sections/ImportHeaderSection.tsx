import { Button } from '@/components/ui/button'
import { PageHeader } from '@/pages/common/PageHeader'

type ImportHeaderSectionProps = {
  onBack: () => void
}

export function ImportHeaderSection({ onBack }: ImportHeaderSectionProps) {
  return (
    <PageHeader
      title="Import clients (Excel)"
      description="Mapper les colonnes, corriger les erreurs, puis importer."
      actions={
        <Button variant="outline" onClick={onBack}>
          Retour clients
        </Button>
      }
    />
  )
}
