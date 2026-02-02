import { useMemo } from "react";
import { ArrowLeft, AlertTriangle, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function BlacklistedClients() {
  const navigate = useNavigate();
  const { clients, updateClient } = useData();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  // Get blacklisted clients
  const blacklistedClients = useMemo(() => {
    return clients
      .filter(c => c.status === 'blacklisted')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clients]);

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  const handleRemoveFromBlacklist = (clientId: string) => {
    updateClient(clientId, { status: 'active' });
    setShowRemoveDialog(false);
    setSelectedClient(null);
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
            <h1 className="text-3xl font-bold">Liste Noire</h1>
            <p className="text-muted-foreground">Clients refusés/problématiques</p>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-destructive">Liste Noire Active</p>
          <p className="text-sm text-destructive/80">
            Les clients listés ici sont bloqués et ne peuvent pas louer. Utilisez avec prudence.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Clients Blacklistés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{blacklistedClients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{clients.filter(c => c.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Propriétés Affectées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {blacklistedClients.reduce((sum, c) => sum + c.rentals.length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Blacklisted Clients Table */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Clients Blacklistés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom Complet</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>CNI</TableHead>
                  <TableHead>Propriétés</TableHead>
                  <TableHead>Date d'Ajout</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blacklistedClients.map(client => (
                  <TableRow key={client.id} className="border-destructive/20">
                    <TableCell>
                      <p className="font-medium">{client.firstName} {client.lastName}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{client.phone}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{client.cni}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.rentals.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatDate(client.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-red-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Blacklisté
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedClient(client.id);
                            setShowRemoveDialog(true);
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Retirer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          Détails
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {blacklistedClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <span className="text-2xl">✓</span> Aucun client blacklisté
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove from Blacklist Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer de la Liste Noire</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer ce client de la liste noire ? Il pourra à nouveau louer des propriétés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-900">
              Cette action réactivera le client et le marquera comme actif.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedClient && handleRemoveFromBlacklist(selectedClient)}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmer le Retrait
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
