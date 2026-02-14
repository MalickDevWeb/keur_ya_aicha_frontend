import { Button } from '@/components/ui/button'
import { PageHeader } from '@/pages/common/PageHeader'
import { Upload, Plus } from 'lucide-react'

type ClientsHeaderSectionProps = {
  title: string
  addLabel: string
  onAddClient: () => void
  onImportClients: () => void
}

export function ClientsHeaderSection({
  title,
  addLabel,
  onAddClient,
  onImportClients,
}: ClientsHeaderSectionProps) {
  return (
    <PageHeader
      title={title}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onImportClients}>
            <Upload className="w-4 h-4 mr-2" />
            Importer Excel
          </Button>
          <Button onClick={onAddClient} className="bg-secondary hover:bg-secondary/90">
            <Plus className="w-4 h-4 mr-2" />
            {addLabel}
          </Button>
        </div>
      }
    />
  )
}
