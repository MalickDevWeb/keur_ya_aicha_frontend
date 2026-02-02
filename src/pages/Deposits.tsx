import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Filter, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SendDownloadModal from '@/components/SendDownloadModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/SearchInput';
import { BadgeStatut } from '@/components/BadgeStatut';
import { useI18n } from '@/lib/i18n';
import { useData } from '@/contexts/DataContext';
import { calculateDepositStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function Deposits() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { clients } = useData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [modalDoc, setModalDoc] = useState<any | null>(null);

  // Get all deposits with client info
  const allDeposits = useMemo(() => {
    const deposits: any[] = [];
    clients.forEach((client) => {
      client.rentals.forEach((rental) => {
        deposits.push({
          ...rental.deposit,
          rentalId: rental.id,
          clientName: `${client.firstName} ${client.lastName}`,
          clientId: client.id,
          propertyName: rental.propertyName,
          propertyType: rental.propertyType,
          startDate: rental.startDate,
        });
      });
    });
    return deposits;
  }, [clients]);

  // Filter deposits
  const filteredDeposits = useMemo(() => {
    return allDeposits.filter((deposit) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        deposit.clientName.toLowerCase().includes(searchLower) ||
        deposit.propertyName.toLowerCase().includes(searchLower);

      // Status filter
      const status = calculateDepositStatus(deposit);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allDeposits, search, statusFilter]);

  const clearFilters = () => {
    setStatusFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all';

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredDeposits.length;
    const paid = filteredDeposits.filter(d => calculateDepositStatus(d) === 'paid').length;
    const partial = filteredDeposits.filter(d => calculateDepositStatus(d) === 'partial').length;
    const unpaid = filteredDeposits.filter(d => calculateDepositStatus(d) === 'unpaid').length;

    const totalAmount = filteredDeposits.reduce((sum, d) => sum + d.total, 0);
    const paidAmount = filteredDeposits.reduce((sum, d) => sum + d.paid, 0);
    const remainingAmount = totalAmount - paidAmount;

    return { total, paid, partial, unpaid, totalAmount, paidAmount, remainingAmount };
  }, [filteredDeposits]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Paiements de Caution</h1>
        <Button
          onClick={() => navigate('/payments/deposit/add')}
          className="bg-secondary hover:bg-secondary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Enregistrer un paiement
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cautions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.paid} complètes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Montant Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalAmount / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground mt-1">FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reçu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(stats.paidAmount / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground mt-1">FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">À Percevoir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{(stats.remainingAmount / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground mt-1">FCFA</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher par client, bien..."
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-muted')}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  1
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut de caution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="partial">Partielle</SelectItem>
                  <SelectItem value="unpaid">Non payée</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="col-full sm:col-span-2"
                >
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Bien</TableHead>
                  <TableHead>Date Début</TableHead>
                  <TableHead className="text-right">Caution Totale</TableHead>
                  <TableHead className="text-right">Caution Payée</TableHead>
                  <TableHead className="text-right">À Percevoir</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeposits.length > 0 ? (
                  filteredDeposits.map((deposit) => {
                    const remaining = deposit.total - deposit.paid;
                    const status = calculateDepositStatus(deposit);

                    return (
                      <TableRow
                        key={`${deposit.rentalId}-deposit`}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">{deposit.clientName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {deposit.propertyName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(deposit.startDate), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {deposit.total.toLocaleString('fr-SN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={deposit.paid > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                            {deposit.paid.toLocaleString('fr-SN')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={remaining > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                            {remaining.toLocaleString('fr-SN')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <BadgeStatut status={status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/payments/deposit/${deposit.rentalId}`)}
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const client = clients.find(c => c.id === deposit.clientId);
                                const docForPdf: any = {
                                  payerName: client ? `${client.firstName} ${client.lastName}` : deposit.clientName,
                                  payerPhone: client?.phone,
                                  amount: deposit.paid || 0,
                                  uploadedAt: new Date(),
                                  name: `Caution-${deposit.rentalId}`,
                                  note: `Caution totale: ${deposit.total}`,
                                };
                                setModalDoc(docForPdf);
                              }}
                              title="Télécharger reçus"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucune caution trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredDeposits.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Affichage de {filteredDeposits.length} caution{filteredDeposits.length > 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>
      <SendDownloadModal document={modalDoc} onClose={() => setModalDoc(null)} />
    </div>
  );
}
