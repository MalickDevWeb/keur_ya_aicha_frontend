import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FileSpreadsheet } from 'lucide-react'

type FileUploadCardProps = {
  fileName: string
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function FileUploadCard({ fileName, onFileChange }: FileUploadCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Charger un fichier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} />
        {fileName ? <div className="text-sm text-muted-foreground">Fichier: {fileName}</div> : null}
      </CardContent>
    </Card>
  )
}
