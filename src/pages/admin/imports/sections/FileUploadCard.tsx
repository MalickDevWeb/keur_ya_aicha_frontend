import { useId } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Upload } from 'lucide-react'

type FileUploadCardProps = {
  fileName: string
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function FileUploadCard({ fileName, onFileChange }: FileUploadCardProps) {
  const fileInputId = useId()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Charger un fichier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          id={fileInputId}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFileChange}
          className="sr-only"
        />

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Button asChild variant="outline" className="w-full md:w-auto whitespace-normal text-center">
            <label htmlFor={fileInputId} className="cursor-pointer">
              <Upload className="w-4 h-4" />
              Choisir un fichier
            </label>
          </Button>
          <p className="min-w-0 text-sm text-muted-foreground break-all">
            {fileName || 'Aucun fichier sélectionné'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
