import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

type DashboardHeaderSectionProps = {
  title: string
  subtitle: string
  onImport: () => void
  onAddClient: () => void
}

export function DashboardHeaderSection({ title, subtitle, onImport, onAddClient }: DashboardHeaderSectionProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-foreground">{title}</h1>
        <p className="text-base text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onImport}>
          <Upload className="w-4 h-4 mr-2" />
          Importer Excel
        </Button>
        <Button onClick={onAddClient} className="bg-secondary hover:bg-secondary/90">
          Ajouter client
        </Button>
      </div>
    </div>
  )
}
