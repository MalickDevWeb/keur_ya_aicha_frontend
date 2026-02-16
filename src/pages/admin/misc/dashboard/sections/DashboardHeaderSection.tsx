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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <h1 className="text-3xl font-black text-foreground sm:text-4xl">{title}</h1>
        <p className="text-base text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-none sm:flex sm:gap-2">
        <Button type="button" variant="outline" onClick={onImport} className="w-full sm:w-auto">
          <Upload className="w-4 h-4 mr-2" />
          Importer Excel
        </Button>
        <Button type="button" onClick={onAddClient} className="w-full bg-secondary hover:bg-secondary/90 sm:w-auto">
          Ajouter client
        </Button>
      </div>
    </div>
  )
}
