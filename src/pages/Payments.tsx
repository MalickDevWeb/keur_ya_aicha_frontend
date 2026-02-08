import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Plus, Filter, X, Download, Grid3x3, List } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Payments() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { clients } = useData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('monthly');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Get all monthly payments with client info
  const allPayments = useMemo(() => {
    const payments: any[] = [];
    clients.forEach((client) => {
      // Valider que le client a un prénom et nom valides
      if (!client.firstName || !client.lastName) {
        console.warn('⚠️ Client sans nom valide ignoré:', client.id);
        return;
      }

      client.rentals.forEach((rental) => {
        // Valider que la location a un nom
        if (!rental.propertyName) {
          console.warn('⚠️ Location sans nom ignorée:', rental.id);
          return;
        }

        rental.payments.forEach((payment) => {
          // Valider que le paiement a les données essentielles
          if (!payment.id || !payment.amount) {
            console.warn('⚠️ Paiement invalide ignoré:', payment);
            return;
          }

          const clientName = `${client.firstName} ${client.lastName}`.trim();

          // Ignorer si le nom du client est vide
          if (!clientName || clientName === ' ') {
            console.warn('⚠️ Paiement avec client invalide ignoré');
            return;
          }

          payments.push({
            ...payment,
            clientName: clientName,
            clientId: client.id,
            rentalId: rental.id,
            propertyName: rental.propertyName,
            propertyType: rental.propertyType,
            monthlyRent: rental.monthlyRent,
          });
        });
      });
    });

    // Trier et s'assurer qu'il n'y a pas de données invalides
    return payments
      .filter(p => p.clientName && p.propertyName && p.clientId)
      .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
  }, [clients]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return allPayments.filter((payment) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        payment.clientName.toLowerCase().includes(searchLower) ||
        payment.propertyName.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allPayments, search, statusFilter]);

  const clearFilters = () => {
    setStatusFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all';

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredPayments.length;
    const paid = filteredPayments.filter(p => p.status === 'paid').length;
    const partial = filteredPayments.filter(p => p.status === 'partial').length;
    const unpaid = filteredPayments.filter(p => p.status === 'unpaid' || p.status === 'late').length;

    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = filteredPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const remainingAmount = totalAmount - paidAmount;

    return { total, paid, partial, unpaid, totalAmount, paidAmount, remainingAmount };
  }, [filteredPayments]);

  const getPaymentDetails = (payment: any) => {
    const daysLate = Math.max(0, Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
    const isInDerogation = daysLate <= 5 && daysLate > 0;

    return { daysLate, isInDerogation };
  };

  const handleDownloadReceipt = async (payment: any) => {
    try {
      const { generatePdfForDocument, downloadBlob, shareBlobViaWebShare } = await import('@/lib/pdfUtils');
      // prefer last payment record if exists
      const record = payment.payments && payment.payments.length > 0 ? payment.payments[payment.payments.length - 1] : null;
      const client = clients.find(c => c.id === payment.clientId);
      const docForPdf: any = {
        payerName: client ? `${client.firstName} ${client.lastName}` : payment.clientName,
        payerPhone: client?.phone,
        amount: record ? record.amount : payment.paidAmount || payment.amount,
        uploadedAt: record ? record.date : new Date(),
        name: `Reçu-${payment.id}`,
        note: payment.propertyName || '',
      };
      const blob = await generatePdfForDocument(docForPdf);
      downloadBlob(blob, `${docForPdf.name || 'recu'}.pdf`);
      const shared = await shareBlobViaWebShare(blob, `${docForPdf.name || 'recu'}.pdf`, `Reçu: ${docForPdf.name}`);
      if (!shared) {
        try {
          const { uploadBlobToFileIo } = await import('@/lib/pdfUtils');
          const link = await uploadBlobToFileIo(blob, `${docForPdf.name || 'recu'}.pdf`);
          const win = window.open(
            `https://wa.me/?text=${encodeURIComponent(`Reçu ${docForPdf.name} pour ${docForPdf.payerName}: ${link}`)}`,
            '_blank',
            'noopener,noreferrer'
          );
          if (win) {
            try { win.opener = null; } catch {}
          }
        } catch (e) {
          const win = window.open(
            `https://wa.me/?text=${encodeURIComponent(`Reçu ${docForPdf.name} pour ${docForPdf.payerName}`)}`,
            '_blank',
            'noopener,noreferrer'
          );
          if (win) {
            try { win.opener = null; } catch {}
          }
        }
      }
    } catch (e: any) {
      alert(e?.message || 'Impossible de générer le PDF.');
    }
  };

  const [modalDoc, setModalDoc] = useState<any | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground">Paiements Mensuels</h1>
            <p className="text-muted-foreground mt-1">Gérez et suivez tous les paiements de locations</p>
          </div>
          <Button
            onClick={() => navigate('/payments/add')}
            className="bg-secondary hover:bg-secondary/90 text-white font-bold shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un paiement
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-highlight to-accent shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-secondary uppercase tracking-wider">Total Paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-black text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">{stats.paid} complètement payés</p>
                </div>
                <div className="text-5xl opacity-20">📊</div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-highlight to-card shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Montant Total</CardTitle>
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

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-highlight to-success shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-success uppercase tracking-wider">Montant Payé</CardTitle>
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

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-highlight to-warning shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-warning uppercase tracking-wider">À Percevoir</CardTitle>
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
                  placeholder="Rechercher par client, bien, propriété..."
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
                    <SelectValue placeholder="Statut du paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="paid">✅ Payé</SelectItem>
                    <SelectItem value="partial">⏳ Partiel</SelectItem>
                    <SelectItem value="unpaid">❌ Non payé</SelectItem>
                    <SelectItem value="late">⚠️ En retard</SelectItem>
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
              {filteredPayments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPayments.map((payment) => {
                    const { daysLate, isInDerogation } = getPaymentDetails(payment);
                    const isPaid = payment.status === 'paid';
                    const isPartial = payment.status === 'partial';
                    const isLate = payment.status === 'late' || daysLate > 0;

                    let clientName = 'Client inconnu';
                    if (payment.clientName && payment.clientName.trim() && payment.clientName !== 'undefined undefined') {
                      clientName = payment.clientName;
                    } else if (payment.clientId) {
                      const client = clients.find(c => c.id === payment.clientId);
                      if (client && client.firstName && client.lastName) {
                        clientName = `${client.firstName} ${client.lastName}`;
                      }
                    }

                    return (
                      <Card
                        key={payment.id}
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
                            <h3 className="font-black text-lg text-white">{clientName}</h3>
                            <p className="text-white/90 text-sm">{payment.propertyName || 'Bien inconnu'}</p>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3">
                          {/* Period */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Période</span>
                            <span className="text-xs bg-muted px-2 py-1 rounded font-medium text-foreground">
                              {format(new Date(payment.periodStart), 'd MMM', { locale: fr })} → {' '}
                              {format(new Date(payment.periodEnd), 'd MMM yyyy', { locale: fr })}
                            </span>
                          </div>

                          {/* Amounts Grid */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="text-xs text-muted-foreground font-semibold">Montant</p>
                              <p className="text-sm font-black text-foreground">{(payment.amount / 1000).toFixed(0)}K</p>
                            </div>
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="text-xs text-muted-foreground font-semibold">Payé</p>
                              <p className="text-sm font-black text-foreground">{(payment.paidAmount / 1000).toFixed(0)}K</p>
                            </div>
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="text-xs text-muted-foreground font-semibold">Reste</p>
                              <p className="text-sm font-black text-foreground">{((payment.amount - payment.paidAmount) / 1000).toFixed(0)}K</p>
                            </div>
                          </div>

                          {/* Status & Late info */}
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex gap-2">
                              <BadgeStatut status={payment.status} size="sm" />
                              {isInDerogation && (
                                <Badge variant="outline" className="text-warning font-semibold">
                                  -5j
                                </Badge>
                              )}
                              {isLate && !isInDerogation && (
                                <Badge variant="outline" className="text-destructive font-semibold">
                                  +{daysLate}j
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-3 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/payments/${payment.rentalId}`)}
                              className="flex-1 hover:bg-muted"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Voir
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/payments/edit/${payment.id}`)}
                              className="flex-1 hover:bg-muted"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Éditer
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const record = payment.payments && payment.payments.length > 0 ? payment.payments[payment.payments.length - 1] : null;
                                const client = clients.find(c => c.id === payment.clientId);
                                const docForPdf: any = {
                                  payerName: client ? `${client.firstName} ${client.lastName}` : payment.clientName,
                                  payerPhone: client?.phone,
                                  amount: record ? record.amount : payment.paidAmount || payment.amount,
                                  uploadedAt: record ? record.date : new Date(),
                                  name: `Reçu-${payment.id}`,
                                  note: payment.propertyName || '',
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
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-foreground font-medium">Aucun paiement trouvé</p>
                  <p className="text-muted-foreground text-sm mt-1">Ajoutez un nouveau paiement pour commencer</p>
                </div>
              )}
              {filteredPayments.length > 0 && (
                <div className="mt-6 pt-4 border-t text-center text-sm font-medium text-muted-foreground">
                  📊 Affichage de {filteredPayments.length} paiement{filteredPayments.length > 1 ? 's' : ''}
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
                      <TableHead className="font-bold">Période</TableHead>
                      <TableHead className="text-right font-bold">Montant</TableHead>
                      <TableHead className="text-right font-bold">Payé</TableHead>
                      <TableHead className="font-bold">Statut</TableHead>
                      <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment) => {
                        const { daysLate, isInDerogation } = getPaymentDetails(payment);
                        const isPaid = payment.status === 'paid';
                        const isPartial = payment.status === 'partial';
                        const isLate = payment.status === 'late' || daysLate > 0;

                        let clientName = 'Client inconnu';
                        if (payment.clientName && payment.clientName.trim() && payment.clientName !== 'undefined undefined') {
                          clientName = payment.clientName;
                        } else if (payment.clientId) {
                          const client = clients.find(c => c.id === payment.clientId);
                          if (client && client.firstName && client.lastName) {
                            clientName = `${client.firstName} ${client.lastName}`;
                          }
                        }

                        return (
                          <TableRow
                            key={payment.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="font-semibold text-foreground">{clientName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground font-medium">{payment.propertyName || 'Bien inconnu'}</TableCell>
                            <TableCell className="text-sm">
                              <span className="text-xs bg-muted px-2 py-1 rounded font-medium">
                                {format(new Date(payment.periodStart), 'd MMM', { locale: fr })} → {' '}
                                {format(new Date(payment.periodEnd), 'd MMM yyyy', { locale: fr })}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold text-foreground">{(payment.amount / 1000).toFixed(0)}K</TableCell>
                            <TableCell className="text-right">
                              <span className={`font-bold text-sm ${isPaid ? 'text-success' : isPartial ? 'text-warning' : 'text-destructive'}`}>
                                {(payment.paidAmount / 1000).toFixed(0)}K
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 flex-wrap">
                                <BadgeStatut status={payment.status} size="sm" />
                                {isInDerogation && (
                                  <Badge variant="outline" className="text-warning font-semibold">
                                    -5j
                                  </Badge>
                                )}
                                {isLate && !isInDerogation && (
                                  <Badge variant="outline" className="text-destructive font-semibold">
                                    +{daysLate}j
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/payments/${payment.rentalId}`)}
                                  title="Voir les détails"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/payments/edit/${payment.id}`)}
                                  title="Éditer le paiement"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const record = payment.payments && payment.payments.length > 0 ? payment.payments[payment.payments.length - 1] : null;
                                    const client = clients.find(c => c.id === payment.clientId);
                                    const docForPdf: any = {
                                      payerName: client ? `${client.firstName} ${client.lastName}` : payment.clientName,
                                      payerPhone: client?.phone,
                                      amount: record ? record.amount : payment.paidAmount || payment.amount,
                                      uploadedAt: record ? record.date : new Date(),
                                      name: `Reçu-${payment.id}`,
                                      note: payment.propertyName || '',
                                    };
                                    setModalDoc(docForPdf);
                                  }}
                                  title="Télécharger reçu"
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
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-4xl">📋</div>
                            <p className="font-medium">Aucun paiement trouvé</p>
                            <p className="text-xs">Ajoutez un nouveau paiement pour commencer</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {filteredPayments.length > 0 && (
                <div className="px-6 py-3 border-t bg-muted/50 text-xs font-medium text-muted-foreground">
                  📊 Affichage de {filteredPayments.length} paiement{filteredPayments.length > 1 ? 's' : ''}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
      <SendDownloadModal document={modalDoc} onClose={() => setModalDoc(null)} />
    </div>
  );
}
