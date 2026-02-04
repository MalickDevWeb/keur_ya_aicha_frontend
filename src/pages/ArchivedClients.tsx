import { useContext, useMemo, useState } from "react";
import { ArrowLeft, Archive, RotateCcw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/contexts/ToastContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ArchivedClients() {
  const navigate = useNavigate();
  const { clients, updateClient } = useData();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    clientId: string;
    clientName: string;
    action: 'archive' | 'reactivate';
    isLoading: boolean;
  }>({
    open: false,
    clientId: '',
    clientName: '',
    action: 'reactivate',
    isLoading: false,
  });

  // Get archived clients
  const archivedClients = useMemo(() => {
    return clients
      .filter(c => c.status === 'archived')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clients]);

  // Get active clients for search
  const activeClients = useMemo(() => {
    return clients.filter(c => c.status === 'active');
  }, [clients]);

  // Filter active clients by search query (improved: case-insensitive + numeric matching)
  const searchResults = useMemo(() => {
    const q = (searchQuery || '').toString().toLowerCase().trim();
    if (!q) return [];

    const qDigits = q.replace(/\D/g, '');

    return activeClients.filter((client) => {
      const first = client.firstName ? client.firstName.toLowerCase() : '';
      const last = client.lastName ? client.lastName.toLowerCase() : '';
      const phone = client.phone ? client.phone.toString().toLowerCase() : '';
      const cni = client.cni ? client.cni.toString().toLowerCase() : '';

      // name match
      if (first.includes(q) || last.includes(q)) return true;

      // direct include on phone/cni (handles queries like "+221" or with spaces)
      if (phone.includes(q) || cni.includes(q)) return true;

      // numeric match: strip non-digits and compare
      if (qDigits) {
        const phoneDigits = phone.replace(/\D/g, '');
        const cniDigits = cni.replace(/\D/g, '');
        if (phoneDigits.includes(qDigits) || cniDigits.includes(qDigits)) return true;
      }

      return false;
    });
  }, [searchQuery, activeClients]);

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  const openConfirm = (clientId: string, action: 'archive' | 'reactivate') => {
    const client = clients.find(c => c.id === clientId);
    setConfirmDialog({
      open: true,
      clientId,
      clientName: `${client?.firstName} ${client?.lastName}`,
      action,
      isLoading: false,
    });
  };

  const handleConfirmAction = async () => {
    setConfirmDialog(prev => ({ ...prev, isLoading: true }));
    try {
      const newStatus = confirmDialog.action === 'reactivate' ? 'active' : 'archived';
      await updateClient(confirmDialog.clientId, { status: newStatus });

      const actionText = confirmDialog.action === 'reactivate' ? 'réactivé' : 'archivé';
      addToast({
        type: 'success',
        title: confirmDialog.action === 'reactivate' ? 'Client réactivé' : 'Client archivé',
        message: `${confirmDialog.clientName} a été ${actionText}`,
      });
      setConfirmDialog(prev => ({ ...prev, open: false }));
      setSearchQuery('');
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: `Impossible de ${confirmDialog.action === 'reactivate' ? 'réactiver' : 'archiver'} le client`,
      });
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleReactivate = (clientId: string) => {
    openConfirm(clientId, 'reactivate');
  };

  const handleArchiveClient = (clientId: string) => {
    openConfirm(clientId, 'archive');
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
            <p className="text-muted-foreground">Gérez les clients archivés et inactifs</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Archivés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{archivedClients.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Clients Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{clients.filter(c => c.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-600">Propriétés Archivées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-900">{archivedClients.reduce((sum, c) => sum + c.rentals.length, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Archive Clients Section */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-blue-600" />
            Archiver un Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Rechercher par nom, prénom, téléphone ou CNI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="border-blue-200 hover:bg-blue-50"
                >
                  Effacer
                </Button>
              )}
            </div>

            {searchQuery && (
              <div className="space-y-2">
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border border-dashed">
                    <p className="text-sm">Aucun client trouvé</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-blue-50 to-transparent">
                          <TableHead>Nom Complet</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>CNI</TableHead>
                          <TableHead className="text-center">Propriétés</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map(client => (
                          <TableRow key={client.id} className="hover:bg-blue-50/30">
                            <TableCell>
                              <p className="font-medium text-slate-900">{client.firstName} {client.lastName}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-slate-600">{client.phone}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-slate-600 font-mono">{client.cni}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-blue-50">{client.rentals.length}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                                  >
                                    <Archive className="h-4 w-4" />
                                    Archiver
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogTitle>Archiver le client ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir archiver <span className="font-semibold text-slate-900">{client.firstName} {client.lastName}</span> ? Cette action peut être annulée en réactivant le client.
                                  </AlertDialogDescription>
                                  <div className="flex justify-end gap-2">
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleArchiveClient(client.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Archiver
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {!searchQuery && (
              <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border border-dashed border-blue-200">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tapez le nom, prénom, téléphone ou CNI du client à archiver</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Archived Clients Table */}
      <Card className="border-slate-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-slate-600" />
            Clients Archivés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {archivedClients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <Archive className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Aucun client archivé</p>
                <p className="text-sm mt-2">Les clients archivés apparaîtront ici</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-transparent">
                    <TableHead>Nom Complet</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>CNI</TableHead>
                    <TableHead className="text-center">Propriétés</TableHead>
                    <TableHead>Date d'Archivage</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedClients.map(client => (
                    <TableRow key={client.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <p className="font-medium text-slate-900">{client.firstName} {client.lastName}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600">{client.phone}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600 font-mono">{client.cni}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-slate-50">{client.rentals.length}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600">{formatDate(client.createdAt)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-700 text-white">
                          <Archive className="h-3 w-3 mr-1" />
                          Archivé
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleReactivate(client.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Réactiver
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/clients/${client.id}`)}
                            className="hover:bg-blue-50 hover:text-blue-700"
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
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDialog.open}
        title={
          confirmDialog.action === 'reactivate'
            ? 'Réactiver le client?'
            : 'Archiver le client?'
        }
        description={
          confirmDialog.action === 'reactivate'
            ? `${confirmDialog.clientName} sera réactivé et réapparaîtra dans la liste des clients actifs.`
            : `${confirmDialog.clientName} sera archivé et ne sera plus visible dans la liste active.`
        }
        confirmText={confirmDialog.action === 'reactivate' ? 'Réactiver' : 'Archiver'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        isLoading={confirmDialog.isLoading}
        isDestructive={confirmDialog.action === 'archive'}
      />
    </div>
  );
}
