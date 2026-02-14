import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Plus, Filter, X, Download, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SendDownloadModal from '@/components/SendDownloadModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow, } from '@/components/ui/table';
import { Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/SearchInput';
import { BadgeStatut } from '@/components/BadgeStatut';
import { useStore } from '@/stores/dataStore';
import type { Client, Deposit, PropertyType } from '@/lib/types';
import { calculateDepositStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function Deposits() {
  const navigate = useNavigate();
  const clients = useStore((state) => state.clients)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  type DepositRow = Deposit & {
    rentalId: string;
    clientName: string;
    clientId: string;
    propertyName: string;
    propertyType: PropertyType;
    startDate: Date;
  };

  type ReceiptDoc = {
    name: string;
    type: 'receipt';
    payerName: string;
    payerPhone?: string;
    amount: number;
    uploadedAt: Date;
    note?: string;
  };

  const [modalDoc, setModalDoc] = useState<ReceiptDoc | null>(null);

  // Get all deposits with client info
  const allDeposits = useMemo(() => {
    const deposits: DepositRow[] = [];
    clients.forEach((client) => {
      if (!client.firstName || !client.lastName) return;

      client.rentals.forEach((rental) => {
        if (!rental.propertyName) return;

        const clientName = `${client.firstName} ${client.lastName}`.trim();

        if (!clientName || clientName === ' ') return;

        deposits.push({
          ...rental.deposit,
          rentalId: rental.id,
          clientName: clientName,
          clientId: client.id,
          propertyName: rental.propertyName,
          propertyType: rental.propertyType,
          startDate: rental.startDate,
        });
      });
    });
    return deposits.filter(d => d.clientName && d.propertyName && d.clientId);
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
        <div>
          <h1 className="text-3xl font-black text-foreground">Paiements de Caution</h1>
          <p className="text-muted-foreground mt-1">Enregistrer et gérer tous les paiements de caution</p>
        </div>
        <Button
          onClick={() => navigate('/payments/deposit/add')}
          className="bg-secondary hover:bg-secondary/90 text-white font-bold shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Enregistrer un paiement
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Cautions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-black text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">{stats.paid} complètes</p>
              </div>
              <div className="text-5xl opacity-20">🔐</div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montant Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-black text-foreground">{(stats.totalAmount / 1000).toFixed(0)}<span className="text-lg">K</span></p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">FCFA</p>
              </div>
              <div className="text-5xl opacity-20">💰</div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reçu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-black text-success">{(stats.paidAmount / 1000).toFixed(0)}<span className="text-lg">K</span></p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">FCFA</p>
              </div>
              <div className="text-5xl opacity-20">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">À Percevoir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className={`text-4xl font-black ${stats.remainingAmount > 0 ? 'text-warning' : 'text-success'}`}>
                  {(stats.remainingAmount / 1000).toFixed(0)}<span className="text-lg">K</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">FCFA</p>
              </div>
              <div className="text-5xl opacity-20">{stats.remainingAmount > 0 ? '⏳' : '🎉'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and View Toggle */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b bg-card">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher par client, bien..."
                className="flex-1"
              />
              <div className="flex gap-2 border rounded-lg p-1 bg-muted">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="px-2"
                  title="Vue cartes"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-2"
                  title="Vue liste"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn('w-full sm:w-auto', showFilters && 'bg-muted')}
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
                  <SelectItem value="paid">✅ Payée</SelectItem>
                  <SelectItem value="partial">⏳ Partielle</SelectItem>
                  <SelectItem value="unpaid">❌ Non payée</SelectItem>
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

        {/* Cards View */}
        {viewMode === 'cards' && (
          <CardContent className="p-6">
            {filteredDeposits.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDeposits.map((deposit) => {
                  const remaining = deposit.total - deposit.paid;
                  const status = calculateDepositStatus(deposit);
                  const isPaid = status === 'paid';
                  const isPartial = status === 'partial';

                  return (
                    <Card
                      key={`${deposit.rentalId}-deposit`}
                      className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer border-muted-foreground/20"
                    >
                      {/* Header with status color */}
                      <div className={`p-4 text-white relative overflow-hidden ${
                        isPaid ? 'bg-gradient-to-br from-success to-success' :
                        isPartial ? 'bg-gradient-to-br from-warning to-warning' :
                        'bg-gradient-to-br from-destructive to-destructive'
                      }`}>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform" />
                        <div className="relative z-10">
                          <h3 className="font-black text-lg text-white">{deposit.clientName}</h3>
                          <p className="text-white/90 text-sm">{deposit.propertyName}</p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        {/* Date */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground uppercase">Début</span>
                          <span className="text-xs bg-muted px-2 py-1 rounded font-medium text-foreground">
                            {format(new Date(deposit.startDate), 'dd/MM/yyyy')}
                          </span>
                        </div>

                        {/* Amounts Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground font-semibold">Total</p>
                            <p className="text-sm font-black text-foreground">{(deposit.total / 1000).toFixed(0)}K</p>
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground font-semibold">Payé</p>
                            <p className="text-sm font-black text-foreground">{(deposit.paid / 1000).toFixed(0)}K</p>
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground font-semibold">Reste</p>
                            <p className="text-sm font-black text-foreground">{(remaining / 1000).toFixed(0)}K</p>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between pt-2">
                          <BadgeStatut status={status} size="sm" />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/payments/deposit/${deposit.rentalId}`)}
                            className="flex-1 hover:bg-muted"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/payments/deposit/${deposit.rentalId}/edit`)}
                            className="flex-1 hover:bg-muted"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Éditer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const client = clients.find((c: Client) => c.id === deposit.clientId);
                              const docForPdf: ReceiptDoc = {
                                payerName: client ? `${client.firstName} ${client.lastName}` : deposit.clientName,
                                payerPhone: client?.phone,
                                amount: deposit.paid || 0,
                                uploadedAt: new Date(),
                                name: `Caution-${deposit.rentalId}`,
                                type: 'receipt',
                                note: `Caution totale: ${deposit.total}`,
                              };
                              setModalDoc(docForPdf);
                            }}
                            className="hover:bg-muted"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔐</div>
                <p className="text-foreground font-medium">Aucune caution trouvée</p>
                <p className="text-muted-foreground text-sm mt-1">Enregistrez une nouvelle caution pour commencer</p>
              </div>
            )}
            {filteredDeposits.length > 0 && (
              <div className="mt-6 pt-4 border-t text-center text-sm font-medium text-muted-foreground">
                Affichage de {filteredDeposits.length} caution{filteredDeposits.length > 1 ? 's' : ''}
              </div>
            )}
          </CardContent>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Client</TableHead>
                    <TableHead className="font-bold">Bien</TableHead>
                    <TableHead className="font-bold">Date Début</TableHead>
                    <TableHead className="text-right font-bold">Caution Totale</TableHead>
                    <TableHead className="text-right font-bold">Caution Payée</TableHead>
                    <TableHead className="text-right font-bold">À Percevoir</TableHead>
                    <TableHead className="font-bold">Statut</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
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
                          <TableCell className="font-semibold text-foreground">{deposit.clientName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground font-medium">
                            {deposit.propertyName}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {format(new Date(deposit.startDate), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {(deposit.total / 1000).toFixed(0)}K
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={deposit.paid > 0 ? 'text-green-600 font-bold' : 'text-muted-foreground'}>
                              {(deposit.paid / 1000).toFixed(0)}K
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={remaining > 0 ? 'text-orange-600 font-bold' : 'text-green-600 font-bold'}>
                              {(remaining / 1000).toFixed(0)}K
                            </span>
                          </TableCell>
                          <TableCell>
                            <BadgeStatut status={status} size="sm" />
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
                                onClick={() => navigate(`/payments/deposit/${deposit.rentalId}/edit`)}
                                title="Éditer la caution"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const client = clients.find((c: Client) => c.id === deposit.clientId);
                                  const docForPdf: ReceiptDoc = {
                                    payerName: client ? `${client.firstName} ${client.lastName}` : deposit.clientName,
                                    payerPhone: client?.phone,
                                    amount: deposit.paid || 0,
                                    uploadedAt: new Date(),
                                    name: `Caution-${deposit.rentalId}`,
                                    type: 'receipt',
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
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-4xl">🔐</div>
                          <p className="font-medium">Aucune caution trouvée</p>
                          <p className="text-xs">Enregistrez une nouvelle caution pour commencer</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredDeposits.length > 0 && (
              <div className="px-6 py-3 border-t bg-muted/50 text-xs font-medium text-muted-foreground">
                Affichage de {filteredDeposits.length} caution{filteredDeposits.length > 1 ? 's' : ''}
              </div>
            )}
          </CardContent>
        )}
      </Card>
      <SendDownloadModal document={modalDoc} onClose={() => setModalDoc(null)} />
    </div>
  );
}
