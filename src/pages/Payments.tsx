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

  // Get all monthly payments with client info
  const allPayments = useMemo(() => {
    const payments: any[] = [];
    clients.forEach((client) => {
      client.rentals.forEach((rental) => {
        rental.payments.forEach((payment) => {
          payments.push({
            ...payment,
            clientName: `${client.firstName} ${client.lastName}`,
            clientId: client.id,
            rentalId: rental.id,
            propertyName: rental.propertyName,
            propertyType: rental.propertyType,
            monthlyRent: rental.monthlyRent,
          });
        });
      });
    });
    return payments.sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
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
          window.open(`https://wa.me/?text=${encodeURIComponent(`Reçu ${docForPdf.name} pour ${docForPdf.payerName}: ${link}`)}`, '_blank');
        } catch (e) {
          window.open(`https://wa.me/?text=${encodeURIComponent(`Reçu ${docForPdf.name} pour ${docForPdf.payerName}`)}`, '_blank');
        }
      }
    } catch (e: any) {
      alert(e?.message || 'Impossible de générer le PDF.');
    }
  };

  const [modalDoc, setModalDoc] = useState<any | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Paiements Mensuels</h1>
        <Button
          onClick={() => navigate('/payments/add')}
          className="bg-secondary hover:bg-secondary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un paiement
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.paid} payées</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Payé</CardTitle>
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
                  <SelectValue placeholder="Statut du paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="partial">Partiel</SelectItem>
                  <SelectItem value="unpaid">Non payé</SelectItem>
                  <SelectItem value="late">En retard</SelectItem>
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
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => {
                    const { daysLate, isInDerogation } = getPaymentDetails(payment);
                    const isPaid = payment.status === 'paid';
                    const isPartial = payment.status === 'partial';
                    const isLate = payment.status === 'late' || daysLate > 0;

                    return (
                      <TableRow
                        key={payment.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">{payment.clientName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.propertyName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(payment.periodStart), 'd MMM', { locale: fr })} -{' '}
                          {format(new Date(payment.periodEnd), 'd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(payment.amount).toLocaleString('fr-SN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={isPaid ? 'text-green-600 font-medium' : isPartial ? 'text-amber-600' : 'text-red-600'}>
                            {(payment.paidAmount).toLocaleString('fr-SN')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BadgeStatut status={payment.status} />
                            {isInDerogation && (
                              <Badge variant="outline" className="text-amber-600">
                                -5j
                              </Badge>
                            )}
                            {isLate && !isInDerogation && (
                              <Badge variant="outline" className="text-red-600">
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Aucun paiement trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredPayments.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Affichage de {filteredPayments.length} paiement{filteredPayments.length > 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>
      <SendDownloadModal document={modalDoc} onClose={() => setModalDoc(null)} />
    </div>
  );
}
