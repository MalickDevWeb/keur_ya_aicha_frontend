import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { downloadBlob, generatePdfForDocument, shareBlobViaWebShare, uploadBlobToFileIo } from '@/lib/pdfUtils';
import { useElectronAPI } from '@/hooks/useElectronAPI';

// Dynamic import for os module (only available in Node.js/Electron context)
const getHomeDir = async (): Promise<string> => {
  try {
    // @ts-ignore - os module is not typed in browser context
    const os = await import('os');
    return os.homedir();
  } catch {
    // Fallback for browser environment
    return '/tmp';
  }
};

interface Props {
  document: any | null;
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
  }, [doc]);

  if (!doc) return null;

  const handleDownload = async () => {
    try {
      console.log('📥 handleDownload: Début');
      // if original file url exists and not a receipt, download it directly
      if (doc.url && doc.type !== 'receipt') {
        console.log('💾 Downloading original file from:', doc.url);
        const a = document.createElement('a');
        a.href = doc.url;
        a.download = doc.name || 'document';
        document.body.appendChild(a);
        a.click();
        a.remove();
        console.log('✅ Original file download triggered');
        return;
      }

      setGenerating(true);
      console.log('📄 Generating PDF for:', doc.name);
      const blob = await generatePdfForDocument(doc);
      console.log('✅ PDF generated, size:', blob.size, 'bytes');

      // Si Electron, sauvegarder dans les dossiers organisés
      if (isElectron) {
        const docType = doc.type === 'receipt' ? 'receipt' : doc.type || 'document';
        const clientPhone = doc.clientPhone || doc.clientId || 'unknown';
        console.log('💾 Saving to Electron file system:', { type: docType, client: clientPhone });
        const result = await saveDocument(`${doc.name || 'document'}.pdf`, blob, docType, clientPhone);
        if (result?.success) {
          console.log('✅ File saved to:', result.path);
          alert(`Fichier sauvegardé dans:\n${result.folderPath}`);
        } else {
          console.error('❌ Save failed:', result?.error);
        }
      } else {
        // Fallback: télécharger normalement
        await downloadBlob(blob, `${doc.name || 'document'}.pdf`);
        console.log('✅ PDF download triggered');
      }

      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      console.log('✅ Blob URL created for preview');
    } catch (e: any) {
      console.error('❌ handleDownload error:', e?.message);
      alert(e?.message || 'Impossible de générer le PDF.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendWhatsapp = async () => {
    // Open a blank window synchronously to avoid popup blockers, then navigate it later
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (win) {
      try { win.opener = null; } catch {}
    }
    try {
      setGenerating(true);
      console.log('🔄 handleSendWhatsapp: Début');
      let blob: Blob | null = null;
      if (doc.url && doc.type !== 'receipt') {
        try {
          console.log('📥 Fetching original file from:', doc.url);
          const resp = await fetch(doc.url);
          if (resp.ok) blob = await resp.blob();
        } catch (e) {
          console.log('⚠️ Failed to fetch original, using generated PDF instead');
        }
      }
      if (!blob) {
        console.log('📄 Generating PDF...');
        blob = await generatePdfForDocument(doc);
      }

      console.log('🔗 Attempting Web Share API...');
      const shared = await shareBlobViaWebShare(blob, `${doc.name || 'document'}.pdf`, `${doc.name || 'Document'}`);
      console.log('✅ Web Share result:', shared);

      if (!shared) {
        console.log('📤 Web Share unavailable or rejected, uploading to file.io...');
        try {
          const allowUpload = window.confirm('Partager un lien nécessite un envoi du document vers un service externe. Continuer ?');
          if (!allowUpload) {
            console.log('⚠️ Upload refused by user, opening WhatsApp without link');
            const text = `Voici le document ${doc.name || ''}`;
            const webUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            if (win) win.location.href = webUrl;
            else {
              const popup = window.open(webUrl, '_blank', 'noopener,noreferrer');
              if (popup) {
                try { popup.opener = null; } catch {}
              }
            }
            return;
          }
          const link = await uploadBlobToFileIo(blob, `${doc.name || 'document'}.pdf`);
          console.log('✅ Upload successful:', link);
          const text = `Voici le document ${doc.name || ''} : ${link}`;
          console.log('📱 Navigating WhatsApp Web with link');
          const webUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
          if (win) win.location.href = webUrl;
          else {
            const popup = window.open(webUrl, '_blank', 'noopener,noreferrer');
            if (popup) {
              try { popup.opener = null; } catch {}
            }
          }
        } catch (uploadError: any) {
          console.error('❌ Upload failed:', uploadError?.message);
          console.log('🆘 Fallback: Opening WhatsApp without link');
          const text = `Voici le document ${doc.name || ''}`;
          const webUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
          if (win) win.location.href = webUrl;
          else {
            const popup = window.open(webUrl, '_blank', 'noopener,noreferrer');
            if (popup) {
              try { popup.opener = null; } catch {}
            }
          }
        }
      } else {
        console.log('✅ Web Share succeeded');
        if (win) {
          // Optionally close the blank window if Web Share succeeded
          try { win.close(); } catch {}
        }
      }
    } catch (e: any) {
      console.error('❌ handleSendWhatsapp error:', e?.message);
      alert(e?.message || 'Impossible d\u2019envoyer le document.');
      if (win) {
        try { win.close(); } catch {}
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

      const typeMap = {
        'payment': 'Paiements',
        'deposit': 'Cautions',
        'contract': 'Contrats',
        'receipt': 'Reçus',
      };

      const typeFolderName = (typeMap as any)[docType] || docType;
      const homeDir = await getHomeDir();
      const folderPath = `${homeDir}/Documents/KeurYaAicha_Documents/${typeFolderName}/${clientPhone}`;

      await openFolder(folderPath);
    } catch (e: any) {
      console.error('Error opening folder:', e);
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
