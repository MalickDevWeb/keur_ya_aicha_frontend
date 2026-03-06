import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useElectronAPI } from '@/hooks/useElectronAPI';
import { getCloudinaryOpenUrl } from '@/services/api/uploads.api';
import { useToast } from '@/hooks/use-toast';
import { buildReadableDocumentName, toSafeFileBaseName } from '@/lib/documentDisplay';

// Dynamic import for os module (only available in Node.js/Electron context)
const getHomeDir = async (): Promise<string> => {
  try {
    // @ts-expect-error - os module is not typed in browser context
    const os = await import('os');
    return os.homedir();
  } catch {
    // Fallback for browser environment
    return '/tmp';
  }
};

interface Props {
  open?: boolean;
  document: {
    name?: string;
    url?: string;
    type?: string;
    clientPhone?: string;
    payerPhone?: string;
    clientId?: string;
    [key: string]: unknown;
  } | null;
  onClose: () => void;
}

const normalizeWhatsappPhone = (phone?: string): string => {
  const digits = String(phone || '').replace(/[^\d]/g, '')
  if (!digits) return ''
  if (digits.startsWith('221')) return digits
  if (digits.length === 9) return `221${digits}`
  return digits
}

const buildWhatsAppUrl = (phone: string, text: string): string => {
  const encoded = encodeURIComponent(text)
  if (!phone) return `https://wa.me/?text=${encoded}`
  return `https://wa.me/${phone}?text=${encoded}`
}

export default function SendDownloadModal({ open, document: doc, onClose }: Props) {
  const [actionInProgress, setActionInProgress] = useState<'download' | 'whatsapp' | 'folder' | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const { isElectron, saveDocument, openFolder } = useElectronAPI();
  const { toast } = useToast();
  const isBusy = actionInProgress !== null;
  const isDownloading = actionInProgress === 'download';
  const isSendingWhatsapp = actionInProgress === 'whatsapp';
  const isOpeningFolder = actionInProgress === 'folder';

  useEffect(() => {
    if (!doc) {
      setBlobUrl(null);
      setActionInProgress(null);
    }
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [doc, blobUrl]);

  if (!doc) return null;

  const displayName = buildReadableDocumentName({
    name: String(doc.name || ''),
    type: String(doc.type || ''),
    context: String(doc.clientName || doc.payerName || ''),
    uploadedAt: doc.uploadedAt as string | number | Date | null | undefined,
  });
  const fileName = `${toSafeFileBaseName(displayName)}.pdf`;

  const normalizeFolderSegment = (value: string): string =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const resolveClientFolderKey = (): string => {
    const phoneCandidate = normalizeWhatsappPhone(String(doc.clientPhone || doc.payerPhone || ''));
    if (phoneCandidate) return phoneCandidate;

    const nameCandidateRaw = doc.clientName ?? doc.payerName;
    const nameCandidate = normalizeFolderSegment(String(nameCandidateRaw || '').trim());
    return nameCandidate || 'client-inconnu';
  };

  const handleDownload = async () => {
    if (isBusy) return;
    setActionInProgress('download');
    try {
      // if original file url exists and not a receipt, download it directly
      if (doc.url && doc.type !== 'receipt') {
        const openUrl = await getCloudinaryOpenUrl(String(doc.url));
        const a = document.createElement('a');
        a.href = openUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      const { generatePdfForDocument, downloadBlob } = await import('@/lib/pdfUtils');
      const blob = await generatePdfForDocument(doc);

      // Si Electron, sauvegarder dans les dossiers organisés
      if (isElectron) {
        const docType = doc.type === 'receipt' ? 'receipt' : doc.type || 'document';
        const clientFolder = resolveClientFolderKey();
        const result = await saveDocument(fileName, blob, docType, clientFolder);
        if (result?.success) {
          toast({
            title: 'Document sauvegardé',
            description: String(result.folderPath || 'Le fichier a été sauvegardé.'),
          });
        }
      } else {
        // Fallback: télécharger normalement
        await downloadBlob(blob, fileName);
      }

      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de générer le PDF.';
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSendWhatsapp = async () => {
    if (isBusy) return;
    // Open a blank window synchronously to avoid popup blockers, then navigate it later
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (win) {
      try {
        win.opener = null;
      } catch (err) {
        void err;
      }
    }
    try {
      setActionInProgress('whatsapp');
      const { generatePdfForDocument, shareBlobViaWebShare } = await import('@/lib/pdfUtils');
      const whatsappPhone = normalizeWhatsappPhone(String(doc.clientPhone || doc.payerPhone || ''))
      let text = `Voici le document ${displayName}`;
      let shareableUrl = '';

      let blob: Blob | null = null;
      if (doc.url && doc.type !== 'receipt') {
        try {
          const openUrl = await getCloudinaryOpenUrl(String(doc.url));
          shareableUrl = openUrl;
          const resp = await fetch(openUrl);
          if (resp.ok) blob = await resp.blob();
        } catch (err) {
          void err;
        }
      }
      if (!blob) {
        blob = await generatePdfForDocument(doc);
      }

      const shared = await shareBlobViaWebShare(blob, fileName, text);
      if (shared) {
        if (win) {
          try {
            win.close();
          } catch (closeErr) {
            void closeErr;
          }
        }
        return;
      }

      if (shareableUrl) {
        text = `Voici le document ${displayName} : ${shareableUrl}`;
      }

      const webUrl = buildWhatsAppUrl(whatsappPhone, text);
      if (win) {
        win.location.href = webUrl;
      } else {
        const popup = window.open(webUrl, '_blank', 'noopener,noreferrer');
        if (popup) {
          try {
            popup.opener = null;
          } catch (err) {
            void err;
          }
        }
      }

      if (!shareableUrl) {
        toast({
          title: 'Information',
          description: "Le PDF a été généré localement. Joignez-le manuellement dans WhatsApp si nécessaire.",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible d\u2019envoyer le document.';
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      if (win) {
        try {
          win.close();
        } catch (closeErr) {
          void closeErr;
        }
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenFolder = async () => {
    if (isBusy) return;
    if (!isElectron) {
      toast({
        title: 'Information',
        description: "Cette fonction n'est disponible que dans la version desktop.",
      });
      return;
    }
    try {
      setActionInProgress('folder');
      const docType = doc.type === 'receipt' ? 'receipt' : doc.type || 'document';
      const clientFolder = resolveClientFolderKey();

      const typeMap: Record<string, string> = {
        payment: 'Paiements',
        deposit: 'Cautions',
        contract: 'Contrats',
        receipt: 'Reçus',
      };

      const typeFolderName = typeMap[docType] || docType;
      const homeDir = await getHomeDir();
      const folderPath = `${homeDir}/Documents/KeurYaAicha_Documents/${typeFolderName}/${clientFolder}`;

      await openFolder(folderPath);
    } catch (err) {
      void err;
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'ouverture du dossier.",
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <Dialog open={open ?? !!doc} onOpenChange={(openState) => { if (!openState) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <DialogDescription className="text-sm text-muted-foreground">Choisissez une action pour ce document.</DialogDescription>
          {blobUrl ? (
            <div className="border rounded p-2">
              <iframe src={blobUrl} className="w-full h-64" title="preview" />
            </div>
          ) : (
            <div className="border rounded p-4 text-sm text-muted-foreground">
              Aperçu non disponible. Cliquez sur Télécharger pour générer le PDF avant l'envoi.
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2 justify-end w-full flex-wrap">
            <Button variant="outline" onClick={onClose} disabled={isBusy}>Fermer</Button>
            {isElectron && (
              <Button variant="secondary" onClick={handleOpenFolder} disabled={isBusy}>
                {isOpeningFolder ? 'Ouverture...' : '📁 Ouvrir le dossier'}
              </Button>
            )}
            <Button variant="outline" onClick={handleDownload} disabled={isBusy}>
              {isDownloading ? 'Téléchargement...' : 'Télécharger'}
            </Button>
            <Button className="bg-secondary hover:bg-secondary/90" onClick={handleSendWhatsapp} disabled={isBusy}>
              {isSendingWhatsapp ? 'Envoi WhatsApp...' : 'Envoyer au client (WhatsApp)'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
