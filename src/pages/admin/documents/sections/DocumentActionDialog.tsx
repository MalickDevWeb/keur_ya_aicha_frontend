import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react'
import { buildReadableDocumentName } from '@/lib/documentDisplay'
import type { DocumentRow } from '../types'

type DocumentActionDialogProps = {
  document: DocumentRow | null
  previewUrl: string | null
  isPreviewLoading: boolean
  activeAction: 'download' | 'whatsapp' | 'download-all' | null
  currentIndex: number
  totalDocuments: number
  canGoPrevious: boolean
  canGoNext: boolean
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onOpenInNewTab: () => void
  onDownload: () => void
  onSendWhatsapp: () => void
}

export function DocumentActionDialog({
  document,
  previewUrl,
  isPreviewLoading,
  activeAction,
  currentIndex,
  totalDocuments,
  canGoPrevious,
  canGoNext,
  onClose,
  onPrevious,
  onNext,
  onOpenInNewTab,
  onDownload,
  onSendWhatsapp,
}: DocumentActionDialogProps) {
  const documentTitle = buildReadableDocumentName({
    name: document?.name,
    type: document?.type,
    context: document?.rentalName || document?.clientName,
    uploadedAt: document?.uploadedAt,
  })
  const isBusy = activeAction !== null
  const isDownloading = activeAction === 'download'
  const isSending = activeAction === 'whatsapp'
  const isMultipleDocuments = totalDocuments > 1

  return (
    <Dialog
      open={!!document}
      onOpenChange={(open) => {
        if (!open && !isBusy) onClose()
      }}
    >
      <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto p-4 sm:max-w-5xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="break-words">{documentTitle}</span>
            {isMultipleDocuments ? (
              <span className="text-sm font-normal text-muted-foreground">
                Document {currentIndex + 1} sur {totalDocuments}
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Consultez uniquement ce document, puis téléchargez-le ou partagez-le si nécessaire.
          </div>
          {isMultipleDocuments ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/20 p-2">
              <Button variant="outline" size="sm" onClick={onPrevious} disabled={!canGoPrevious || isBusy}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Précédent
              </Button>
              <span className="text-xs text-muted-foreground sm:text-sm">
                Navigation dans la sélection visible
              </span>
              <Button variant="outline" size="sm" onClick={onNext} disabled={!canGoNext || isBusy}>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : null}
          {isPreviewLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-border bg-muted/20 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement du document...
            </div>
          ) : previewUrl ? (
            <div className="border rounded p-2">
              <iframe src={previewUrl} className="h-[65vh] min-h-[320px] w-full rounded" title="preview" />
            </div>
          ) : (
            <div className="border rounded p-4 text-sm text-muted-foreground">
              Aperçu non disponible pour ce document.
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} disabled={isBusy}>
              Fermer
            </Button>
            <Button variant="outline" onClick={onOpenInNewTab} disabled={isBusy || !previewUrl || isPreviewLoading}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Ouvrir
            </Button>
            <Button variant="outline" onClick={onDownload} disabled={isBusy}>
              {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isDownloading ? 'Téléchargement...' : 'Télécharger'}
            </Button>
            <Button className="bg-secondary hover:bg-secondary/90" onClick={onSendWhatsapp} disabled={isBusy}>
              {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isSending ? 'Envoi...' : 'Envoyer sur WhatsApp'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
