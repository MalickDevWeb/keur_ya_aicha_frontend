import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { buildReadableDocumentName } from '@/lib/documentDisplay'
import type { DocumentRow } from '../types'

type DocumentActionDialogProps = {
  document: DocumentRow | null
  previewUrl: string | null
  activeAction: 'download' | 'whatsapp' | null
  onClose: () => void
  onDownload: () => void
  onSendWhatsapp: () => void
}

export function DocumentActionDialog({
  document,
  previewUrl,
  activeAction,
  onClose,
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

  return (
    <Dialog
      open={!!document}
      onOpenChange={(open) => {
        if (!open && !isBusy) onClose()
      }}
    >
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl">
        <DialogHeader>
          <DialogTitle>{documentTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">Choisissez une action pour ce document.</div>
          {previewUrl ? (
            <div className="border rounded p-2">
              <iframe src={previewUrl} className="w-full h-64" title="preview" />
            </div>
          ) : (
            <div className="border rounded p-4 text-sm text-muted-foreground">
              Aperçu non disponible. Cliquez sur Télécharger pour générer le PDF avant l'envoi.
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} disabled={isBusy}>
              Fermer
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
