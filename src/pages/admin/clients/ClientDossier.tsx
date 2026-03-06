import { useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useStore } from '@/stores/dataStore';
import SendDownloadModal from '@/components/SendDownloadModal';
import { Document } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useGoBack } from '@/hooks/useGoBack';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { buildReadableDocumentName } from '@/lib/documentDisplay';

type DocumentRow = Document & {
  clientId: string;
  clientName: string;
  rentalId: string;
  rentalName: string;
};

export default function ClientDossier() {
  const navigate = useNavigate()
  const goBack = useGoBack('/documents');
  const { toast } = useToast();
  const clients = useStore((state) => state.clients)
  const deleteDocument = useStore((state) => state.deleteDocument)
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get all documents from all clients
  const allDocuments = useMemo(() => {
    const docs: DocumentRow[] = [];
    clients.forEach((client) => {
      client.rentals.forEach((rental) => {
        rental.documents?.forEach((doc) => {
          docs.push({
            ...doc,
            clientId: client.id,
            clientName: `${client.firstName} ${client.lastName}`,
            rentalId: rental.id,
            rentalName: rental.propertyName,
          });
        });
      });
    });
    return docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [clients]);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return '📄';
      case 'receipt':
        return '🧾';
      default:
        return '📎';
    }
  };

  const getDocumentLabel = (type: string) => {
    switch (type) {
      case 'contract':
        return 'Contrat';
      case 'receipt':
        return 'Reçu';
      default:
        return 'Document';
    }
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  const [modalDoc, setModalDoc] = useState<DocumentRow | null>(null);

  const getDisplayName = (doc: DocumentRow) =>
    buildReadableDocumentName({
      name: doc.name,
      type: doc.type,
      context: doc.rentalName || doc.clientName,
      uploadedAt: doc.uploadedAt,
    })

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteDocument(deleteTarget.clientId, deleteTarget.rentalId, deleteTarget.id);
      const displayName = buildReadableDocumentName({
        name: deleteTarget.name,
        type: deleteTarget.type,
        context: deleteTarget.rentalName || deleteTarget.clientName,
        uploadedAt: deleteTarget.uploadedAt,
      });
      toast({
        title: 'Document supprimé',
        description: `"${displayName}" a été supprimé.`,
      });
      setDeleteTarget(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer le document.';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => goBack('/documents')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Dossiers Clients</h1>
            <p className="text-muted-foreground">Gestion centralisée des documents</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
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
            <p className="text-2xl font-bold">{allDocuments.filter(d => d.type === 'contract').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reçus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allDocuments.filter(d => d.type === 'receipt').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Signés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allDocuments.filter(d => d.signed).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Tous les Documents</CardTitle>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => navigate('/documents')}>
            <Upload className="h-4 w-4" />
            Importer
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {allDocuments.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{getDocumentIcon(doc.type)}</span>
                      <p className="font-medium truncate max-w-[220px]">{getDisplayName(doc)}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{doc.clientName}</p>
                  </div>
                  <Badge variant="outline">{getDocumentLabel(doc.type)}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <p><span className="text-muted-foreground">Propriété:</span> {doc.rentalName}</p>
                  <p><span className="text-muted-foreground">Date:</span> {formatDate(doc.uploadedAt)}</p>
                  <p className="col-span-2">
                    {doc.signed ? (
                      <Badge className="bg-green-600">Signé</Badge>
                    ) : (
                      <Badge variant="secondary">Non signé</Badge>
                    )}
                  </p>
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setModalDoc(doc)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteTarget(doc)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Propriété</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Upload</TableHead>
                  <TableHead>Signé</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDocuments.map(doc => {
                  const displayName = getDisplayName(doc)

                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getDocumentIcon(doc.type)}</span>
                          <p className="font-medium truncate max-w-xs">{displayName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{doc.clientName}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{doc.rentalName}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getDocumentLabel(doc.type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDate(doc.uploadedAt)}</p>
                      </TableCell>
                      <TableCell>
                        {doc.signed ? (
                          <Badge className="bg-green-600">Signé</Badge>
                        ) : (
                          <Badge variant="secondary">Non signé</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setModalDoc(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteTarget(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {allDocuments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun document dans les dossiers clients
            </div>
          )}
        </CardContent>
      </Card>
      <SendDownloadModal document={modalDoc} onClose={() => setModalDoc(null)} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le document ?"
        description={
          deleteTarget
            ? `Le document "${buildReadableDocumentName({
                name: deleteTarget.name,
                type: deleteTarget.type,
                context: deleteTarget.rentalName || deleteTarget.clientName,
                uploadedAt: deleteTarget.uploadedAt,
              })}" sera supprimé.`
            : ''
        }
        confirmText="Supprimer"
        isDestructive
        isLoading={isDeleting}
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
