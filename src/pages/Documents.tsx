import { useMemo, useState } from "react";
import { ArrowLeft, Upload, Download, Trash2, FileText, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Documents() {
  const navigate = useNavigate();
  const { clients, addDocument, deleteDocument } = useData();

  const [clientId, setClientId] = useState<string>(clients[0]?.id || '');
  const [rentalId, setRentalId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<'contract' | 'receipt' | 'other'>('contract');
  const [signed, setSigned] = useState(false);

  // Get all documents
  const allDocuments = useMemo(() => {
    const docs: any[] = [];
    clients.forEach(client => {
      client.rentals.forEach(rental => {
        rental.documents?.forEach(doc => {
          docs.push({
            id: doc.id,
            clientId: client.id,
            clientName: `${client.firstName} ${client.lastName}`,
            rentalId: rental.id,
            rentalName: rental.propertyName,
            ...doc,
          });
        });
      });
    });
    return docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [clients]);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return '📋';
      case 'receipt':
        return '🧾';
      default:
        return '📎';
    }
  };

  const getDocumentType = (type: string) => {
    switch (type) {
      case 'contract':
        return 'Contrat';
      case 'receipt':
        return 'Reçu';
      default:
        return 'Autre';
    }
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  // Group by type
  const documentsByType = {
    contracts: allDocuments.filter(d => d.type === 'contract'),
    receipts: allDocuments.filter(d => d.type === 'receipt'),
    others: allDocuments.filter(d => d.type === 'other'),
  };

  const [modalDoc, setModalDoc] = useState<any | null>(null);
  const [modalGenerating, setModalGenerating] = useState(false);
  const [modalBlobUrl, setModalBlobUrl] = useState<string | null>(null);

  const downloadDoc = async (doc: any) => {
    // Open modal to let user choose Download or Send via WhatsApp
    setModalDoc(doc);
    setModalBlobUrl(null);
  };

  const generateAndGetBlob = async (doc: any) => {
    setModalGenerating(true);
    try {
      const { generatePdfForDocument } = await import('@/lib/pdfUtils');
      const blob = await generatePdfForDocument(doc);
      return blob;
    } finally {
      setModalGenerating(false);
    }
  };

  const handleModalDownload = async () => {
    if (!modalDoc) return;
    try {
      // If original file exists and is not a receipt, download it directly
      if (modalDoc.url && modalDoc.type !== 'receipt') {
        const a = document.createElement('a');
        a.href = modalDoc.url;
        a.download = modalDoc.name || 'document';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      const blob = await generateAndGetBlob(modalDoc);
      const { downloadBlob } = await import('@/lib/pdfUtils');
      downloadBlob(blob, `${modalDoc.name || 'document'}.pdf`);
      const url = URL.createObjectURL(blob);
      setModalBlobUrl(url);
    } catch (e: any) {
      alert(e?.message || 'Impossible de générer le PDF.');
    }
  };

  const handleModalSendWhatsapp = async () => {
    if (!modalDoc) return;
    try {
      let blob: Blob | null = null;
      if (modalDoc.url && modalDoc.type !== 'receipt') {
        try {
          const resp = await fetch(modalDoc.url);
          if (resp.ok) blob = await resp.blob();
        } catch (e) {
          // fallback to generated
        }
      }

      if (!blob) blob = await generateAndGetBlob(modalDoc);

      const { shareBlobViaWebShare, uploadBlobToFileIo } = await import('@/lib/pdfUtils');
      const shared = await shareBlobViaWebShare(blob, `${modalDoc.name || 'document'}.pdf`, `${modalDoc.name || 'Document'}`);
      if (!shared) {
        try {
          const link = await uploadBlobToFileIo(blob, `${modalDoc.name || 'document'}.pdf`);
          const text = `Voici le document ${modalDoc.name || ''} : ${link}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        } catch (e) {
          const text = `Voici le document ${modalDoc.name || ''}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }
      }
    } catch (e: any) {
      alert(e?.message || 'Impossible d\u2019envoyer le document.');
    }
  };

  const handleDelete = (doc: any) => {
    if (!confirm(`Supprimer le document "${doc.name}" ?`)) return;
    deleteDocument(doc.clientId, doc.rentalId, doc.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground">Gestion complète des documents</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <select
              className="rounded-md border px-2 py-1"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                // reset rental selection
                const c = clients.find(c => c.id === e.target.value);
                setRentalId(c?.rentals?.[0]?.id || '');
              }}
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
            <select
              className="rounded-md border px-2 py-1"
              value={rentalId}
              onChange={(e) => setRentalId(e.target.value)}
            >
              {(clients.find(c => c.id === clientId)?.rentals || []).map(r => (
                <option key={r.id} value={r.id}>{r.propertyName}</option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Nom du document"
            className="rounded-md border px-2 py-1"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
          />

          <select className="rounded-md border px-2 py-1" value={docType} onChange={(e) => setDocType(e.target.value as any)}>
            <option value="contract">Contrat</option>
            <option value="receipt">Reçu</option>
            <option value="other">Autre</option>
          </select>

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
          />

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} />
            Signé
          </label>

          <Button
            className="gap-2"
            onClick={() => {
              if (!clientId || !rentalId) return;
              const name = docName || file?.name || 'Document';
              addDocument(clientId, rentalId, { name, type: docType, signed, file });
              // reset
              setDocName('');
              setFile(null);
              setSigned(false);
            }}
          >
            <Upload className="h-4 w-4" />
            Importer Document
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allDocuments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Contrats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{documentsByType.contracts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reçus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{documentsByType.receipts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Autres</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{documentsByType.others.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Section */}
      {documentsByType.contracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋</span> Contrats ({documentsByType.contracts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Propriété</TableHead>
                    <TableHead>Date Upload</TableHead>
                    <TableHead>Signé</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentsByType.contracts.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <p className="font-medium truncate max-w-xs">{doc.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{doc.clientName}</TableCell>
                      <TableCell>{doc.rentalName}</TableCell>
                      <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                      <TableCell>
                        {doc.signed ? (
                          <Badge className="bg-green-600">✓</Badge>
                        ) : (
                          <Badge variant="secondary">Non</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => downloadDoc(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(doc)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipts Section */}
      {documentsByType.receipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🧾</span> Reçus ({documentsByType.receipts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Propriété</TableHead>
                    <TableHead>Date Upload</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentsByType.receipts.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <p className="font-medium truncate max-w-xs">{doc.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{doc.clientName}</TableCell>
                      <TableCell>{doc.rentalName}</TableCell>
                      <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => downloadDoc(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(doc)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Documents Section */}
      {documentsByType.others.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📎</span> Autres Documents ({documentsByType.others.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Propriété</TableHead>
                    <TableHead>Date Upload</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentsByType.others.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <p className="font-medium truncate max-w-xs">{doc.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{doc.clientName}</TableCell>
                      <TableCell>{doc.rentalName}</TableCell>
                      <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => downloadDoc(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(doc)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {allDocuments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun document disponible</p>
          </CardContent>
        </Card>
      )}
      {/* Download / Share Modal */}
      <Dialog open={!!modalDoc} onOpenChange={(open) => { if (!open) { setModalDoc(null); setModalBlobUrl(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{modalDoc?.name || 'Document'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Choisissez une action pour ce document.</div>
            {modalBlobUrl ? (
              <div className="border rounded p-2">
                <iframe src={modalBlobUrl} className="w-full h-64" title="preview" />
              </div>
            ) : (
              <div className="border rounded p-4 text-sm text-muted-foreground">
                Aperçu non disponible. Cliquez sur Télécharger pour générer le PDF avant l'envoi.
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="flex gap-2 justify-end w-full">
              <Button variant="outline" onClick={() => { setModalDoc(null); setModalBlobUrl(null); }}>
                Fermer
              </Button>
              <Button variant="outline" onClick={handleModalDownload} disabled={modalGenerating}>
                {modalGenerating ? 'Génération...' : 'Télécharger'}
              </Button>
              <Button className="bg-secondary hover:bg-secondary/90" onClick={handleModalSendWhatsapp} disabled={modalGenerating}>
                Envoyer sur WhatsApp
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
