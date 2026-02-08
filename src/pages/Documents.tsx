import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Upload, Download, Trash2, FileText, Edit, X, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function Documents() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clients, addDocument, deleteDocument } = useData();
  const { toast } = useToast();

  const [clientId, setClientId] = useState<string>(clients[0]?.id || '');
  const [rentalId, setRentalId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<'contract' | 'receipt' | 'other'>('contract');
  const [signed, setSigned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Apply filter from URL parameter
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter) {
      setFilterType(filter);

      // Pre-select the first rental without contract for easier editing
      if (filter === 'missing-contracts' && clients.length > 0) {
        for (const client of clients) {
          for (const rental of client.rentals || []) {
            if (!rental.documents || rental.documents.filter(d => d.type === 'contract').length === 0) {
              setClientId(client.id);
              setRentalId(rental.id);
              return;
            }
          }
        }
      }
    }
  }, [searchParams, clients]);

  // Get all documents
  const allDocuments = useMemo(() => {
    const docs: any[] = [];
    clients.forEach(client => {
      // Valider que le client a un prénom et nom valides
      if (!client.firstName || !client.lastName) {
        console.warn('⚠️ Client sans nom valide ignoré:', client.id);
        return;
      }

      client.rentals.forEach(rental => {
        // Valider que la location a un nom
        if (!rental.propertyName) {
          console.warn('⚠️ Location sans nom ignorée:', rental.id);
          return;
        }

        const clientName = `${client.firstName} ${client.lastName}`.trim();

        // Ignorer si le nom du client est vide
        if (!clientName || clientName === ' ') {
          console.warn('⚠️ Document avec client invalide ignoré');
          return;
        }

        rental.documents?.forEach(doc => {
          docs.push({
            id: doc.id,
            clientId: client.id,
            clientName: clientName,
            rentalId: rental.id,
            rentalName: rental.propertyName,
            ...doc,
          });
        });
      });
    });
    return docs
      .filter(d => d.clientName && d.rentalName && d.clientId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
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

  // Recherche intelligente par client (nom, prénom, téléphone)
  const filteredDocuments = useMemo(() => {
    let docs = allDocuments;

    // Apply filter from Work page
    if (filterType === 'missing-contracts') {
      // Show only rentals without contracts
      docs = [];
      clients.forEach(client => {
        client.rentals.forEach(rental => {
          if (!rental.documents || rental.documents.filter(d => d.type === 'contract').length === 0) {
            // Add a placeholder doc for missing contracts
            docs.push({
              id: `missing-${rental.id}`,
              clientId: client.id,
              rentalId: rental.id,
              name: `[MANQUANT] Contrat - ${rental.propertyName}`,
              type: 'contract',
              signed: false,
              url: '',
              clientName: `${client.firstName} ${client.lastName}`,
              rentalName: rental.propertyName,
              uploadedAt: new Date().toISOString(),
              isMissing: true,
            });
          }
        });
      });
      return docs;
    } else if (filterType === 'unsigned-contracts') {
      // Show only unsigned contracts
      docs = allDocuments.filter(d => d.type === 'contract' && !d.signed);
      return docs;
    }

    // Regular search
    if (!searchQuery.trim()) return docs;

    const search = searchQuery.toLowerCase();
    return docs.filter(doc => {
      const client = clients.find(c => c.id === doc.clientId);
      if (!client) return false;

      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const phone = client.phone.toLowerCase();

      return (
        fullName.includes(search) ||
        phone.includes(search) ||
        doc.clientName.toLowerCase().includes(search) ||
        doc.rentalName.toLowerCase().includes(search) ||
        doc.name.toLowerCase().includes(search)
      );
    });
  }, [allDocuments, searchQuery, clients, filterType]);

  // Group filtered documents by type
  const filteredDocumentsByType = {
    contracts: filteredDocuments.filter(d => d.type === 'contract'),
    receipts: filteredDocuments.filter(d => d.type === 'receipt'),
    others: filteredDocuments.filter(d => d.type === 'other'),
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
          const win = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
          if (win) {
            try { win.opener = null; } catch {}
          }
        } catch (e) {
          const text = `Voici le document ${modalDoc.name || ''}`;
          const win = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
          if (win) {
            try { win.opener = null; } catch {}
          }
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
            <h1 className="text-3xl font-bold">📑 Documents</h1>
            <p className="text-muted-foreground">Gestion complète des documents et contrats</p>
            {filterType && (
              <Badge className="mt-2">
                {filterType === 'missing-contracts' && '🔧 Mode correction: Locations sans contrat'}
                {filterType === 'unsigned-contracts' && '🔧 Mode correction: Contrats non signés'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar - Recherche intelligente */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Rechercher des documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tapez le nom, prénom ou téléphone du client... (ex: Amadou Diallo, +221 77 123 45 67)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <div className="mt-3 text-sm text-muted-foreground">
              <strong>{filteredDocuments.length}</strong> document(s) trouvé(s) pour "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Section */}
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
              <option value="contract">📋 Contrat</option>
              <option value="receipt">🧾 Reçu</option>
              <option value="other">📎 Autre</option>
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
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUploading || !clientId || !rentalId}
              onClick={async () => {
                console.log('🔵 [Documents] Upload button clicked');
                console.log('clientId:', clientId, 'rentalId:', rentalId, 'file:', file?.name);

                if (!clientId) {
                  console.error('❌ [Documents] No client selected');
                  toast({ title: '❌ Erreur', description: 'Sélectionnez un client', variant: 'destructive' });
                  return;
                }

                if (!rentalId) {
                  console.error('❌ [Documents] No rental selected');
                  toast({ title: '❌ Erreur', description: 'Sélectionnez une localité', variant: 'destructive' });
                  return;
                }

                if (!file) {
                  console.error('❌ [Documents] No file selected');
                  toast({ title: '❌ Erreur', description: 'Sélectionnez un fichier', variant: 'destructive' });
                  return;
                }

                try {
                  setIsUploading(true);
                  const name = docName || file?.name || 'Document';
                  console.log('🟢 [Documents] Starting upload:', { name, docType, signed, fileSize: file.size });

                  await addDocument(clientId, rentalId, { name, type: docType, signed, file });

                  console.log('✅ [Documents] Upload successful');
                  toast({ title: '✅ Succès', description: `Document "${name}" importé avec succès!` });

                  // reset
                  setDocName('');
                  setFile(null);
                  setSigned(false);
                } catch (error: any) {
                  console.error('❌ [Documents] Upload failed:', error);
                  toast({
                    title: '❌ Erreur',
                    description: error?.message || 'Erreur lors de l\'import du document',
                    variant: 'destructive'
                  });
                } finally {
                  setIsUploading(false);
                }
              }}
            >
              <Upload className="h-4 w-4" />
              {isUploading ? 'Upload en cours...' : 'Importer Document'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredDocuments.length}</p>
            {(searchQuery || filterType) && <p className="text-xs text-muted-foreground">/ {allDocuments.length}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Contrats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredDocumentsByType.contracts.length}</p>
            {(searchQuery || filterType) && <p className="text-xs text-muted-foreground">/ {documentsByType.contracts.length}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reçus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredDocumentsByType.receipts.length}</p>
            {(searchQuery || filterType) && <p className="text-xs text-muted-foreground">/ {documentsByType.receipts.length}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Autres</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredDocumentsByType.others.length}</p>
            {(searchQuery || filterType) && <p className="text-xs text-muted-foreground">/ {documentsByType.others.length}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Contracts Section */}
      {filteredDocumentsByType.contracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋</span> Contrats ({filteredDocumentsByType.contracts.length})
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
                  {filteredDocumentsByType.contracts.map(doc => (
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
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/documents/${doc.id}/edit`)}>
                            <Edit className="h-4 w-4" />
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
      {filteredDocumentsByType.receipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🧾</span> Reçus ({filteredDocumentsByType.receipts.length})
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
                  {filteredDocumentsByType.receipts.map(doc => (
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
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/documents/${doc.id}/edit`)}>
                            <Edit className="h-4 w-4" />
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
      {filteredDocumentsByType.others.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📎</span> Autres Documents ({filteredDocumentsByType.others.length})
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
                  {filteredDocumentsByType.others.map(doc => (
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
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/documents/${doc.id}/edit`)}>
                            <Edit className="h-4 w-4" />
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

      {filteredDocuments.length === 0 && (searchQuery || filterType) && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery
                ? `Aucun document ne correspond à votre recherche "${searchQuery}"`
                : 'Aucun document trouvé avec les filtres appliqués'}
            </p>
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
