import { useContext, useMemo } from "react";
import { ArrowLeft, Archive, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ArchivedClients() {
  const navigate = useNavigate();
  const { clients, updateClient } = useData();

  // Get archived clients
  const archivedClients = useMemo(() => {
    return clients
      .filter(c => c.status === 'archived')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clients]);

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  const handleReactivate = (clientId: string) => {
    updateClient(clientId, { status: 'active' });
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
            <h1 className="text-3xl font-bold">Clients Archivés</h1>
            <p className="text-muted-foreground">Clients archivés et inactifs</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Archivés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{archivedClients.length}</p>
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
            <CardTitle className="text-sm font-medium">Propriétés Archivées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {archivedClients.reduce((sum, c) => sum + c.rentals.length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Archived Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients Archivés</CardTitle>
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
                  <TableHead>Date d'Archivage</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedClients.map(client => (
                  <TableRow key={client.id}>
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
                      <Badge variant="secondary" className="bg-gray-600">
                        <Archive className="h-3 w-3 mr-1" />
                        Archivé
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleReactivate(client.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Réactiver
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

          {archivedClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun client archivé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
