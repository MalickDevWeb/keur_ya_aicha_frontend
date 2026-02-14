import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useElectronAPI } from '@/hooks/useElectronAPI';

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
  document: {
    name?: string;
    url?: string;
    type?: string;
    clientPhone?: string;
    clientId?: string;
    [key: string]: unknown;
  } | null;
  onClose: () => void;
}

export default function SendDownloadModal({ document: doc, onClose }: Props) {
  const [generating, setGenerating] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const { isElectron, saveDocument, openFolder } = useElectronAPI();

  useEffect(() => {
    if (!doc) {
      setBlobUrl(null);
      setGenerating(false);
    }
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [doc, blobUrl]);

  if (!doc) return null;

  const handleDownload = async () => {
    try {
      // if original file url exists and not a receipt, download it directly
      if (doc.url && doc.type !== 'receipt') {
        const a = document.createElement('a');
        a.href = doc.url;
        a.download = doc.name || 'document';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      setGenerating(true);
      const { generatePdfForDocument, downloadBlob } = await import('@/lib/pdfUtils');
      const blob = await generatePdfForDocument(doc);

      // Si Electron, sauvegarder dans les dossiers organisés
      if (isElectron) {
        const docType = doc.type === 'receipt' ? 'receipt' : doc.type || 'document';
        const clientPhone = doc.clientPhone || doc.clientId || 'unknown';
        const result = await saveDocument(`${doc.name || 'document'}.pdf`, blob, docType, clientPhone);
        if (result?.success) {
          alert(`Fichier sauvegardé dans:\n${result.folderPath}`);
        }
      } else {
        // Fallback: télécharger normalement
        await downloadBlob(blob, `${doc.name || 'document'}.pdf`);
      }

      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de générer le PDF.';
      alert(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendWhatsapp = async () => {
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
      setGenerating(true);
      const { generatePdfForDocument, shareBlobViaWebShare, uploadBlobToFileIo } = await import('@/lib/pdfUtils');
      let blob: Blob | null = null;
      if (doc.url && doc.type !== 'receipt') {
        try {
          const resp = await fetch(doc.url);
          if (resp.ok) blob = await resp.blob();
        } catch (err) {
          void err;
        }
      }
      if (!blob) {
        blob = await generatePdfForDocument(doc);
      }

      const shared = await shareBlobViaWebShare(blob, `${doc.name || 'document'}.pdf`, `${doc.name || 'Document'}`);

      if (!shared) {
        try {
          const allowUpload = window.confirm('Partager un lien nécessite un envoi du document vers un service externe. Continuer ?');
          if (!allowUpload) {
            const text = `Voici le document ${doc.name || ''}`;
            const webUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            if (win) win.location.href = webUrl;
            else {
              const popup = window.open(webUrl, '_blank', 'noopener,noreferrer');
              if (popup) {
                try {
                  popup.opener = null;
                } catch (err) {
                  void err;
                }
              }
            }
            return;
          }
          const link = await uploadBlobToFileIo(blob, `${doc.name || 'document'}.pdf`);
          const text = `Voici le document ${doc.name || ''} : ${link}`;
          const webUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
          if (win) win.location.href = webUrl;
          else {
            const popup = window.open(webUrl, '_blank', 'noopener,noreferrer');
            if (popup) {
              try {
                popup.opener = null;
              } catch (err) {
                void err;
              }
            }
          }
        } catch (err) {
          void err;
          const text = `Voici le document ${doc.name || ''}`;
          const webUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
          if (win) win.location.href = webUrl;
          else {
            const popup = window.open(webUrl, '_blank', 'noopener,noreferrer');
            if (popup) {
              try {
                popup.opener = null;
              } catch (err) {
                void err;
              }
            }
          }
        }
      } else if (win) {
        try {
          win.close();
        } catch (err) {
          void err;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible d\u2019envoyer le document.';
      alert(message);
      if (win) {
        try {
          win.close();
        } catch (closeErr) {
          void closeErr;
        }
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenFolder = async () => {
    if (!isElectron) {
      alert('Cette fonction n\'est disponible que dans la version desktop');
      return;
    }
    try {
      const docType = doc.type === 'receipt' ? 'receipt' : doc.type || 'document';
      const clientPhone = doc.clientPhone || doc.clientId || 'unknown';

      const typeMap: Record<string, string> = {
        payment: 'Paiements',
        deposit: 'Cautions',
        contract: 'Contrats',
        receipt: 'Reçus',
      };

      const typeFolderName = typeMap[docType] || docType;
      const homeDir = await getHomeDir();
      const folderPath = `${homeDir}/Documents/KeurYaAicha_Documents/${typeFolderName}/${clientPhone}`;

      await openFolder(folderPath);
    } catch (err) {
      void err;
      alert('Erreur lors de l\'ouverture du dossier');
    }
  };

  return (
    <Dialog open={!!doc} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{doc?.name || 'Document'}</DialogTitle>
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
            <Button variant="outline" onClick={onClose}>Fermer</Button>
            {isElectron && (
              <Button variant="secondary" onClick={handleOpenFolder}>📁 Ouvrir le dossier</Button>
            )}
            <Button variant="outline" onClick={handleDownload} disabled={generating}>{generating ? 'Génération...' : 'Télécharger'}</Button>
            <Button className="bg-secondary hover:bg-secondary/90" onClick={handleSendWhatsapp} disabled={generating}>Envoyer sur WhatsApp</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
