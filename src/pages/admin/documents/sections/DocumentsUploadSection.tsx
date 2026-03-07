import { useEffect, useState } from 'react'
import { Camera, CheckCircle2, FileText, ImagePlus, RotateCcw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDocumentUploadPreviewKind } from '@/lib/documentUpload'

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
  const [selectionSource, setSelectionSource] = useState<'library' | 'camera' | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewKind = getDocumentUploadPreviewKind(file)
  const isCameraCapture = selectionSource === 'camera'

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      setSelectionSource(null)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(nextPreviewUrl)
    return () => {
      URL.revokeObjectURL(nextPreviewUrl)
    }
  }, [file])

  const handleFileSelection = (
    nextFile: File | null,
    source: 'library' | 'camera',
    input: HTMLInputElement
  ) => {
    setSelectionSource(nextFile ? source : null)
    onFileChange(nextFile)
    input.value = ''
  }

  const uploadLabel = isUploading
    ? previewKind === 'image'
      ? 'Préparation et téléversement...'
      : 'Téléversement...'
    : isCameraCapture
      ? 'Confirmer et téléverser'
      : 'Téléverser le document'

  const pickerLabelClassName =
    'relative flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#121B53]/20 bg-white px-4 py-2 text-sm font-medium text-[#121B53] transition hover:bg-[#F7F9FF] focus-within:ring-2 focus-within:ring-[#121B53]/20'
  const pickerInputClassName = 'absolute inset-0 h-full w-full cursor-pointer opacity-0'

  return (
    <Card className="border-[#121B53]/15 bg-white/90 shadow-[0_22px_60px_rgba(12,18,60,0.14)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-[#121B53]">Ajouter un document</CardTitle>
        <p className="text-sm text-muted-foreground">
          Mobile friendly: choisissez un fichier, ouvrez la caméra, prévisualisez puis confirmez l’envoi.
        </p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#121B53]/60">Fichier / Caméra</p>
            <div className="mt-3 space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className={pickerLabelClassName}>
                  <ImagePlus className="h-4 w-4" />
                  Galerie / Fichiers
                  <input
                    type="file"
                    accept=".pdf,application/pdf,image/*"
                    className={pickerInputClassName}
                    onChange={(event) =>
                      handleFileSelection(event.target.files?.[0] ?? null, 'library', event.currentTarget)
                    }
                  />
                </label>
                <label className={pickerLabelClassName}>
                  <Camera className="h-4 w-4" />
                  Prendre une photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className={pickerInputClassName}
                    onChange={(event) =>
                      handleFileSelection(event.target.files?.[0] ?? null, 'camera', event.currentTarget)
                    }
                  />
                </label>
              </div>
              <div className="rounded-xl border border-dashed border-[#121B53]/25 bg-white p-3">
                {file ? (
                  <div className="space-y-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm text-[#121B53]/80">
                      <FileText className="h-4 w-4 shrink-0 text-[#121B53]" />
                      <span className="truncate font-medium">{file.name}</span>
                    </div>
                    {previewUrl ? (
                      previewKind === 'image' ? (
                        <div className="overflow-hidden rounded-xl border border-[#121B53]/10 bg-[#F7F9FF]">
                          <img
                            src={previewUrl}
                            alt="Prévisualisation du document"
                            className="h-48 w-full object-contain bg-white"
                          />
                        </div>
                      ) : previewKind === 'pdf' ? (
                        <div className="overflow-hidden rounded-xl border border-[#121B53]/10 bg-[#F7F9FF]">
                          <iframe
                            src={previewUrl}
                            title="Prévisualisation PDF"
                            className="h-48 w-full bg-white"
                          />
                        </div>
                      ) : (
                        <div className="rounded-xl border border-[#121B53]/10 bg-[#F7F9FF] px-3 py-6 text-center text-sm text-[#121B53]/65">
                          Prévisualisation non disponible pour ce format, mais le fichier sera envoyé tel quel.
                        </div>
                      )
                    ) : null}
                    <div className="space-y-1 text-xs text-[#121B53]/65">
                      <p>
                        Source: {isCameraCapture ? 'Caméra du téléphone' : 'Galerie ou gestionnaire de fichiers'}
                      </p>
                      <p>
                        {previewKind === 'image'
                          ? 'La photo sera automatiquement convertie en PDF avant envoi.'
                          : 'Le fichier sera envoyé au serveur après validation.'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <label
                          className={`${pickerLabelClassName} justify-center border-[#121B53]/15 sm:w-auto`}
                        >
                          {isCameraCapture ? <RotateCcw className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
                          {isCameraCapture ? 'Reprendre la photo' : 'Changer le fichier'}
                          <input
                            type="file"
                            accept={isCameraCapture ? 'image/*' : '.pdf,application/pdf,image/*'}
                            capture={isCameraCapture ? 'environment' : undefined}
                            className={pickerInputClassName}
                            onChange={(event) =>
                              handleFileSelection(
                                event.target.files?.[0] ?? null,
                                isCameraCapture ? 'camera' : 'library',
                                event.currentTarget
                              )
                            }
                          />
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-[#121B53]/70"
                          onClick={() => onFileChange(null)}
                        >
                          Annuler la sélection
                        </Button>
                      </div>
                      <Button
                        type="button"
                        className="w-full gap-2 bg-gradient-to-r from-[#121B53] via-[#1A2A78] to-[#0B153D] text-white disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isUploading || !clientId || !rentalId || !file}
                        onClick={onUpload}
                      >
                        {isCameraCapture && !isUploading ? <CheckCircle2 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                        {uploadLabel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-[#121B53]/65">
                    <p>Choisissez un document depuis le téléphone ou prenez une photo directement.</p>
                    <p className="text-xs">
                      Formats acceptés: PDF, JPG, PNG, WEBP. Les photos prises avec la caméra sont converties en PDF avant upload.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {file ? (
          <p className="mt-3 break-all text-xs text-muted-foreground">
            Fichier sélectionné: {file.name}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
