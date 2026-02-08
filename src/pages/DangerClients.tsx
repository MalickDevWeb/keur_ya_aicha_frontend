import { useMemo, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';

export default function DangerClients() {
  const { clients, deleteClient } = useData();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<null | { id: string; name: string; phone?: string }>(null);

  const filtered = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return clients;
    const qDigits = q.replace(/\D/g, '');
    return clients.filter((c) => {
      const first = (c.firstName || '').toLowerCase();
      const last = (c.lastName || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const cni = (c.cni || '').toLowerCase();
      if (first.includes(q) || last.includes(q)) return true;
      if (phone.includes(q) || cni.includes(q)) return true;
      if (qDigits) {
        const phoneDigits = phone.replace(/\D/g, '');
        const cniDigits = cni.replace(/\D/g, '');
        if (phoneDigits.includes(qDigits) || cniDigits.includes(qDigits)) return true;
      }
      return false;
    });
  }, [clients, searchQuery]);

  const openConfirm = (clientId: string, name: string, phone?: string) => {
    setSelectedClient({ id: clientId, name, phone });
    setConfirmText('');
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    if (confirmText.trim().toUpperCase() !== 'SUPPRIMER') return;
    setIsDeleting(true);
    try {
      await deleteClient(selectedClient.id);
      addToast({
        type: 'success',
        title: 'Client supprimé',
        message: `${selectedClient.name} a été supprimé définitivement.`,
      });
      setConfirmOpen(false);
      setSelectedClient(null);
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: e?.message || 'Impossible de supprimer le client.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-destructive">Zone Danger — Clients</h1>
          <p className="text-sm text-muted-foreground">
            Suppression définitive d’un client et de toutes ses données associées.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Action irréversible
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rechercher un client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Nom, téléphone ou CNI"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="text-sm text-muted-foreground">
            {filtered.length} client(s) trouvé(s)
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{client.email || '—'}</div>
                  </TableCell>
                  <TableCell>{client.phone || '—'}</TableCell>
                  <TableCell className="capitalize">{client.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        openConfirm(
                          client.id,
                          `${client.firstName} ${client.lastName}`.trim(),
                          client.phone
                        )
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Aucun client trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Suppression définitive</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Toutes les locations, paiements et documents du client seront supprimés.
          </AlertDialogDescription>
          <div className="mt-4 space-y-2">
            <p className="text-sm">
              Client : <span className="font-semibold">{selectedClient?.name}</span>
            </p>
            <Input
              placeholder="Tapez SUPPRIMER pour confirmer"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || confirmText.trim().toUpperCase() !== 'SUPPRIMER'}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
