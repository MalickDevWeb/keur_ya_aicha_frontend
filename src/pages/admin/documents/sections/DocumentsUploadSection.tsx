import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type RentalOption = { id: string; propertyName: string }

type ClientOption = {
  id: string
  firstName?: string
  lastName?: string
  rentals?: RentalOption[]
}

type DocumentsUploadSectionProps = {
  clients: ClientOption[]
  clientId: string
  rentalId: string
  docName: string
  docType: 'contract' | 'receipt' | 'other'
  signed: boolean
  isUploading: boolean
  file: File | null
  onClientChange: (clientId: string) => void
  onRentalChange: (rentalId: string) => void
  onNameChange: (value: string) => void
  onTypeChange: (value: 'contract' | 'receipt' | 'other') => void
  onSignedChange: (value: boolean) => void
  onFileChange: (file: File | null) => void
  onUpload: () => void
}

export function DocumentsUploadSection({
  clients,
  clientId,
  rentalId,
  docName,
  docType,
  signed,
  isUploading,
  file,
  onClientChange,
  onRentalChange,
  onNameChange,
  onTypeChange,
  onSignedChange,
  onFileChange,
  onUpload,
}: DocumentsUploadSectionProps) {
  const activeClient = clients.find((client) => client.id === clientId)
  const rentals = activeClient?.rentals ?? []

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="text-lg">📤 Ajouter un nouveau document</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2">
            <select
              className="rounded-md border px-2 py-1"
              value={clientId}
              onChange={(event) => onClientChange(event.target.value)}
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border px-2 py-1"
              value={rentalId}
              onChange={(event) => onRentalChange(event.target.value)}
            >
              {rentals.map((rental) => (
                <option key={rental.id} value={rental.id}>
                  {rental.propertyName}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Nom du document"
            className="rounded-md border px-2 py-1"
            value={docName}
            onChange={(event) => onNameChange(event.target.value)}
          />

          <select
            className="rounded-md border px-2 py-1"
            value={docType}
            onChange={(event) => onTypeChange(event.target.value as 'contract' | 'receipt' | 'other')}
          >
            <option value="contract">📋 Contrat</option>
            <option value="receipt">🧾 Reçu</option>
            <option value="other">📎 Autre</option>
          </select>

          <input type="file" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} className="text-sm" />

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={signed} onChange={(event) => onSignedChange(event.target.checked)} />
            Signé
          </label>

          <Button
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading || !clientId || !rentalId}
            onClick={onUpload}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Upload en cours...' : 'Importer Document'}
          </Button>
        </div>
        {file ? <p className="mt-2 text-xs text-muted-foreground">Fichier sélectionné: {file.name}</p> : null}
      </CardContent>
    </Card>
  )
}
