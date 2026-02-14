import { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

interface ImportClientsFileUploadSectionProps {
  fileName: string
  isLoading?: boolean
  onFile: (file: File) => Promise<void>
}

/**
 * File upload section for import clients
 * Handles file selection and upload
 */
export function ImportClientsFileUploadSection({
  fileName,
  isLoading = false,
  onFile,
}: ImportClientsFileUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await onFile(file)
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const file = event.dataTransfer.files?.[0]
    if (!file) return
    await onFile(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Charger un fichier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition"
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">Glissez-déposez votre fichier CSV/Excel</p>
          <p className="text-xs text-gray-500 mb-4">ou</p>
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            variant="outline"
          >
            Parcourir les fichiers
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="hidden"
          />
        </div>

        {fileName && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            ✓ Fichier chargé: <strong>{fileName}</strong>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
