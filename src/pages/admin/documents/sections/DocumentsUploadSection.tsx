import { FileText, Upload } from 'lucide-react'
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
    <Card className="border-[#121B53]/15 bg-white/90 shadow-[0_22px_60px_rgba(12,18,60,0.14)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-[#121B53]">Ajouter un document PDF</CardTitle>
        <p className="text-sm text-muted-foreground">Stockage sécurisé via Cloudinary, liens instantanés.</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1.2fr_1fr]">
          <div className="rounded-2xl border border-[#121B53]/10 bg-[#F7F9FF] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#121B53]/60">Client & Location</p>
            <div className="mt-3 grid gap-3">
              <select
                className="w-full rounded-xl border border-[#121B53]/15 bg-white px-3 py-2 text-sm"
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
                className="w-full rounded-xl border border-[#121B53]/15 bg-white px-3 py-2 text-sm"
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
          </div>

          <div className="rounded-2xl border border-[#121B53]/10 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#121B53]/60">Détails</p>
            <div className="mt-3 grid gap-3">
              <input
                type="text"
                placeholder="Nom du document"
                className="w-full rounded-xl border border-[#121B53]/15 bg-white px-3 py-2 text-sm"
                value={docName}
                onChange={(event) => onNameChange(event.target.value)}
              />
              <select
                className="w-full rounded-xl border border-[#121B53]/15 bg-white px-3 py-2 text-sm"
                value={docType}
                onChange={(event) => onTypeChange(event.target.value as 'contract' | 'receipt' | 'other')}
              >
                <option value="contract">📋 Contrat</option>
                <option value="receipt">🧾 Reçu</option>
                <option value="other">📎 Autre</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-[#121B53]/80">
                <input
                  type="checkbox"
                  checked={signed}
                  onChange={(event) => onSignedChange(event.target.checked)}
                />
                Document signé
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[#121B53]/10 bg-[#F4F6FF] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#121B53]/60">Fichier</p>
            <div className="mt-3 space-y-3">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-[#121B53]/25 bg-white px-3 py-3 text-sm text-[#121B53]/70">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 text-[#121B53]" />
                  <span className="truncate">{file ? file.name : 'Choisir un PDF'}</span>
                </div>
                <span className="text-xs text-[#121B53]/50">.pdf</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
              <Button
                className="w-full gap-2 bg-gradient-to-r from-[#121B53] via-[#1A2A78] to-[#0B153D] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading || !clientId || !rentalId || !file}
                onClick={onUpload}
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Téléversement...' : 'Téléverser le PDF'}
              </Button>
            </div>
          </div>
        </div>
        {file ? <p className="mt-3 break-all text-xs text-muted-foreground">Fichier sélectionné: {file.name}</p> : null}
      </CardContent>
    </Card>
  )
}
