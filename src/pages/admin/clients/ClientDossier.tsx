import { useMemo, useState } from "react";
import { ArrowLeft, Upload, Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useStore } from '@/stores/dataStore';
import SendDownloadModal from '@/components/SendDownloadModal';
import { Document } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type DocumentRow = Document & {
  clientId: string;
  clientName: string;
  rentalId: string;
  rentalName: string;
};

export default function ClientDossier() {
  const navigate = useNavigate();
  const clients = useStore((state) => state.clients)
  const deleteDocument = useStore((state) => state.deleteDocument)

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Dossiers Clients</h1>
            <p className="text-muted-foreground">Gestion centralisée des documents</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tous les Documents</CardTitle>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Importer
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {allDocuments.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getDocumentIcon(doc.type)}</span>
                        <p className="font-medium truncate max-w-xs">{doc.name}</p>
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
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                          if (!confirm(`Supprimer le document "${doc.name}" ?`)) return;
                          deleteDocument(doc.clientId, doc.rentalId, doc.id);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
}
