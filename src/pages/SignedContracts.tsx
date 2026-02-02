import { useMemo, useState } from "react";
import { ArrowLeft, Download, Eye, Trash2 } from "lucide-react";
import SendDownloadModal from '@/components/SendDownloadModal';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function SignedContracts() {
  const navigate = useNavigate();
  const { clients, deleteDocument } = useData();

  // Get all signed contracts
  const signedContracts = useMemo(() => {
    const contracts: any[] = [];
    clients.forEach(client => {
      client.rentals.forEach(rental => {
        rental.documents?.forEach(doc => {
          if (doc.type === 'contract' && doc.signed) {
            contracts.push({
              id: doc.id,
              clientId: client.id,
              clientName: `${client.firstName} ${client.lastName}`,
              clientPhone: client.phone,
              rentalId: rental.id,
              rentalName: rental.propertyName,
              rentalRent: rental.monthlyRent,
              ...doc,
            });
          }
        });
      });
    });
    return contracts.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [clients]);

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const [modalDoc, setModalDoc] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Contrats Signés</h1>
            <p className="text-muted-foreground">Tous les contrats de location signés</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Contrats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{signedContracts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Propriétés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Set(signedContracts.map(c => c.rentalId)).size}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Set(signedContracts.map(c => c.clientId)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Contrats Signés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Propriété</TableHead>
                  <TableHead>Loyer Mensuel</TableHead>
                  <TableHead>Date Signature</TableHead>
                  <TableHead>Fichier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signedContracts.map(contract => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contract.clientName}</p>
                        <p className="text-sm text-muted-foreground">{contract.clientPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contract.rentalName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{formatCurrency(contract.rentalRent)} FCFA</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatDate(contract.uploadedAt)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-600">✓ Signé</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setModalDoc(contract)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                          if (!confirm(`Supprimer le contrat "${contract.name || contract.id}" ?`)) return;
                          deleteDocument(contract.clientId, contract.rentalId, contract.id);
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

          {signedContracts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun contrat signé pour le moment
            </div>
          )}
        </CardContent>
      </Card>
      <SendDownloadModal document={modalDoc} onClose={() => setModalDoc(null)} />
    </div>
  );
}
