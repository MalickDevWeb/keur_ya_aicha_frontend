import { useMemo, useState } from "react";
import { ArrowLeft, AlertTriangle, RotateCcw, Search } from "lucide-react";
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

export default function BlacklistedClients() {
  const navigate = useNavigate();
  const { clients, updateClient } = useData();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    clientId: string;
    clientName: string;
    action: 'blacklist' | 'remove';
    isLoading: boolean;
  }>({
    open: false,
    clientId: '',
    clientName: '',
    action: 'blacklist',
    isLoading: false,
  });

  // Get blacklisted clients
  const blacklistedClients = useMemo(() => {
    return clients
      .filter(c => c.status === 'blacklisted')
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

  const openConfirm = (clientId: string, action: 'blacklist' | 'remove') => {
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
      const newStatus = confirmDialog.action === 'remove' ? 'active' : 'blacklisted';
      await updateClient(confirmDialog.clientId, { status: newStatus });

      const actionText = confirmDialog.action === 'remove' ? 'retiré' : 'ajouté à la liste noire';
      addToast({
        type: 'success',
        title: confirmDialog.action === 'remove' ? 'Client retiré' : 'Client ajouté',
        message: `${confirmDialog.clientName} a été ${actionText}`,
      });
      setConfirmDialog(prev => ({ ...prev, open: false }));
      setSearchQuery('');
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: `Impossible de ${confirmDialog.action === 'remove' ? 'retirer' : 'ajouter'} le client`,
      });
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleRemoveFromBlacklist = (clientId: string) => {
    openConfirm(clientId, 'remove');
  };

  const handleBlacklistClient = (clientId: string) => {
    openConfirm(clientId, 'blacklist');
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Clients Blacklistés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-900">{blacklistedClients.length}</p>
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
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600">Propriétés Affectées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-900">{blacklistedClients.reduce((sum, c) => sum + c.rentals.length, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Blacklist Clients Section */}
      <Card className="border-destructive/30 bg-gradient-to-br from-red-50/50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Ajouter à la Liste Noire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-400" />
                <Input
                  placeholder="Rechercher par nom, prénom, téléphone ou CNI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-red-200 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="border-red-200 hover:bg-red-50"
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
                        <TableRow className="bg-gradient-to-r from-red-50 to-transparent">
                          <TableHead>Nom Complet</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>CNI</TableHead>
                          <TableHead className="text-center">Propriétés</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map(client => (
                          <TableRow key={client.id} className="hover:bg-red-50/30">
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
                              <Badge variant="outline" className="bg-red-50">{client.rentals.length}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                                  >
                                    <AlertTriangle className="h-4 w-4" />
                                    Blacklister
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogTitle>Ajouter à la Liste Noire ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir ajouter <span className="font-semibold text-slate-900">{client.firstName} {client.lastName}</span> à la liste noire ? Ce client ne pourra plus louer de propriétés.
                                  </AlertDialogDescription>
                                  <div className="flex justify-end gap-2">
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleBlacklistClient(client.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Ajouter à la Liste Noire
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
              <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border border-dashed border-red-200">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tapez le nom, prénom, téléphone ou CNI du client à blacklister</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Blacklisted Clients Table */}
      <Card className="border-red-200">
        <CardHeader className="bg-gradient-to-r from-red-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Clients Blacklistés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blacklistedClients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Aucun client blacklisté</p>
                <p className="text-sm mt-2">Les clients blacklistés apparaîtront ici</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-red-50 to-transparent">
                    <TableHead>Nom Complet</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>CNI</TableHead>
                    <TableHead className="text-center">Propriétés</TableHead>
                    <TableHead>Date d'Ajout</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blacklistedClients.map(client => (
                    <TableRow key={client.id} className="hover:bg-red-50/30">
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
                        <Badge variant="outline" className="bg-red-50">{client.rentals.length}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600">{formatDate(client.createdAt)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="bg-red-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Blacklisté
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 hover:bg-green-50 hover:text-green-700"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Retirer
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogTitle>Retirer de la Liste Noire ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir retirer <span className="font-semibold text-slate-900">{client.firstName} {client.lastName}</span> de la liste noire ? Ce client pourra à nouveau louer des propriétés.
                              </AlertDialogDescription>
                              <div className="flex justify-end gap-2">
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveFromBlacklist(client.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Retirer de la Liste Noire
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
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
          confirmDialog.action === 'blacklist'
            ? 'Ajouter à la liste noire?'
            : 'Retirer de la liste noire?'
        }
        description={
          confirmDialog.action === 'blacklist'
            ? `${confirmDialog.clientName} sera ajouté à la liste noire. Cette action est grave et peut affecter les paiements futurs.`
            : `${confirmDialog.clientName} sera retiré de la liste noire et redeviendra un client actif.`
        }
        confirmText={confirmDialog.action === 'blacklist' ? 'Ajouter à la liste noire' : 'Retirer'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        isLoading={confirmDialog.isLoading}
        isDestructive={confirmDialog.action === 'blacklist'}
      />
    </div>
  );
}
