import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { DocumentRow } from '../types'

type DocumentActionDialogProps = {
  document: DocumentRow | null
  previewUrl: string | null
  isGenerating: boolean
  onClose: () => void
  onDownload: () => void
  onSendWhatsapp: () => void
}

export function DocumentActionDialog({
  document,
  previewUrl,
  isGenerating,
  onClose,
  onDownload,
  onSendWhatsapp,
}: DocumentActionDialogProps) {
  return (
    <Dialog
      open={!!document}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{document?.name || 'Document'}</DialogTitle>
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
          <div className="flex gap-2 justify-end w-full">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button variant="outline" onClick={onDownload} disabled={isGenerating}>
              {isGenerating ? 'Génération...' : 'Télécharger'}
            </Button>
            <Button className="bg-secondary hover:bg-secondary/90" onClick={onSendWhatsapp} disabled={isGenerating}>
              Envoyer sur WhatsApp
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
