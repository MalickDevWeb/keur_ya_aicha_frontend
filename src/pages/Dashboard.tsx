import { useMemo, useState } from 'react';
import { Users, Home, CheckCircle, AlertCircle, Clock, Wallet, ArrowRight, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CardStat } from '@/components/CardStat';
import { BadgeStatut } from '@/components/BadgeStatut';
import { QuickPaymentModal } from '@/components/QuickPaymentModal';
import { useI18n } from '@/lib/i18n';
import { useData } from '@/contexts/DataContext';
import { calculatePaymentStatus, formatCurrency, PaymentStatus, Client, Rental } from '@/lib/types';

interface OverdueClient {
  client: Client;
  rental: Rental;
  paymentStatus: PaymentStatus;
  amountDue: number;
  daysOverdue: number;
}

export default function Dashboard() {
  const { t } = useI18n();
  const { stats, clients, addMonthlyPayment } = useData();
  const navigate = useNavigate();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get priority clients (unpaid and late)
  const priorityClients = useMemo(() => {
    const overdueList: OverdueClient[] = [];

    clients.forEach((client) => {
      if (client.status !== 'active') return;

      client.rentals.forEach((rental) => {
        rental.payments.forEach((payment) => {
          const status = calculatePaymentStatus(payment);

          if (status === 'unpaid' || status === 'late') {
            const dueDate = new Date(payment.dueDate);
            const today = new Date();
            const daysOverdue = Math.floor(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            overdueList.push({
              client,
              rental,
              paymentStatus: status,
              amountDue: payment.amount - payment.paidAmount,
              daysOverdue: Math.max(0, daysOverdue),
            });
          }
        });
      });
    });

    // Sort: unpaid first (priority with red color), then late (by days overdue)
    return overdueList.sort((a, b) => {
      if (a.paymentStatus === 'unpaid' && b.paymentStatus !== 'unpaid') return -1;
      if (a.paymentStatus !== 'unpaid' && b.paymentStatus === 'unpaid') return 1;
      if (a.paymentStatus === 'unpaid' && b.paymentStatus === 'unpaid') {
        return b.amountDue - a.amountDue; // Higher amount first
      }
      if (a.paymentStatus === 'late' && b.paymentStatus === 'late') {
        return b.daysOverdue - a.daysOverdue; // More days overdue first
      }
      return 0;
    });
  }, [clients]);

  const handlePayment = (item: OverdueClient) => {
    console.log('🔵 [Dashboard] handlePayment clicked:', {
      clientId: item.client.id,
      clientName: `${item.client.firstName} ${item.client.lastName}`,
      rentalId: item.rental.id,
      propertyName: item.rental.propertyName,
      paymentStatus: item.paymentStatus,
      amountDue: item.amountDue,
    });

    const payment = item.rental.payments.find(p =>
      calculatePaymentStatus(p) === item.paymentStatus
    );

    console.log('🔵 [Dashboard] Found payment object:', payment);

    setSelectedPayment({
      item,
      payment,
      maxAmount: item.amountDue,
    });
    setPaymentModalOpen(true);
    console.log('🔵 [Dashboard] Payment modal opened');
  };

  const handlePayTotal = async () => {
    console.log('🟢 [Dashboard] handlePayTotal clicked');
    if (!selectedPayment) {
      console.warn('⚠️ [Dashboard] No payment selected!');
      return;
    }

    try {
      setIsLoading(true);
      const { payment, item } = selectedPayment;

      console.log('🟢 [Dashboard] Paying total:', {
        rentalId: payment.rentalId,
        paymentId: payment.id,
        amount: selectedPayment.maxAmount,
        payment: payment,
      });

      // Enregistrer le paiement complet
      await addMonthlyPayment(
        payment.rentalId,
        payment.id,
        selectedPayment.maxAmount
      );

      console.log('✅ [Dashboard] Payment recorded successfully');
      setPaymentModalOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('❌ [Dashboard] Erreur lors du paiement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayPartial = async (amount: number) => {
    console.log('🔵 [Dashboard] handlePayPartial clicked with amount:', amount);
    if (!selectedPayment) {
      console.warn('⚠️ [Dashboard] No payment selected!');
      return;
    }

    try {
      setIsLoading(true);
      const { payment, item } = selectedPayment;

      console.log('🔵 [Dashboard] Paying partial:', {
        rentalId: payment.rentalId,
        paymentId: payment.id,
        amount: amount,
      });

      // Enregistrer le paiement partiel
      await addMonthlyPayment(
        payment.rentalId,
        payment.id,
        amount
      );

      console.log('✅ [Dashboard] Partial payment recorded successfully');
      setPaymentModalOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('❌ [Dashboard] Erreur lors du paiement partiel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: t('dashboard.totalClients'),
      value: stats.totalClients,
      icon: Users,
      variant: 'default' as const,
    },
    {
      title: t('dashboard.totalRentals'),
      value: stats.totalRentals,
      icon: Home,
      variant: 'default' as const,
    },
    {
      title: t('dashboard.paidRentals'),
      value: stats.paidRentals,
      icon: CheckCircle,
      variant: 'success' as const,
    },
    {
      title: t('dashboard.unpaidRentals'),
      value: stats.unpaidRentals,
      icon: AlertCircle,
      variant: 'danger' as const,
    },
    {
      title: t('dashboard.partialRentals'),
      value: stats.partialRentals,
      icon: Clock,
      variant: 'warning' as const,
    },
    {
      title: t('dashboard.monthlyIncome'),
      value: stats.monthlyIncome,
      icon: Wallet,
      isCurrency: true,
      variant: 'default' as const,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-foreground">{t('dashboard.title')}</h1>
        <p className="text-base text-muted-foreground">
          {t('auth.welcome')}, <span className="font-semibold text-foreground">Administrateur</span>
        </p>
      </div>

      {/* Statistics Grid with Enhanced Styling */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 auto-rows-max">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="lg:col-span-1 xl:col-span-1 animate-fade-in"
          >
            <CardStat
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              variant={stat.variant}
              isCurrency={stat.isCurrency}
            />
          </div>
        ))}
      </div>

      {/* Priority Clients Table */}
      {priorityClients.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Paiements en attente
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {priorityClients.length} client(s) en priorité
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/payments')}>
              Voir tous les paiements
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Bien</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead className="text-right">Montant dû</TableHead>
                    <TableHead>Délai</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priorityClients.slice(0, 10).map((item, index) => (
                    <TableRow
                      key={`${item.client.id}-${item.rental.id}-${index}`}
                      className="hover:bg-muted/50"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {item.client.firstName} {item.client.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.client.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.rental.propertyName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(item.rental.payments.find(p =>
                          calculatePaymentStatus(p) === item.paymentStatus
                        )?.periodStart || new Date()).toLocaleDateString('fr-FR', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.amountDue)} FCFA
                      </TableCell>
                      <TableCell>
                        {item.daysOverdue > 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <Clock className="w-3 h-3" />
                            {item.daysOverdue} jour(s)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            À jour
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <BadgeStatut status={item.paymentStatus} size="sm" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePayment(item)}
                            title="Enregistrer un paiement"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Payer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/clients/${item.client.id}`)}
                          >
                            Voir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      {selectedPayment && (
        <QuickPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          onPayTotal={handlePayTotal}
          onPayPartial={handlePayPartial}
          clientName={`${selectedPayment.item.client.firstName} ${selectedPayment.item.client.lastName}`}
          propertyName={selectedPayment.item.rental.propertyName}
          amountDue={selectedPayment.maxAmount}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
