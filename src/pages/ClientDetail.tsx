import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Edit, Archive, Ban, Plus, Home, CreditCard, FileText, Wallet, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BadgeStatut } from '@/components/BadgeStatut';
import { useI18n } from '@/lib/i18n';
import { useData } from '@/contexts/DataContext';
import { QuickPaymentModal } from '@/components/QuickPaymentModal';
import { useToast } from '@/hooks/use-toast';
import {
  formatCurrency,
  calculatePaymentStatus,
  calculateDepositStatus,
  calculateClientPaymentStatus
} from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { getClient, archiveClient, blacklistClient, addMonthlyPayment, addDepositPayment } = useData();
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const client = getClient(id || '');

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Client non trouvé</p>
        <Button variant="outline" onClick={() => navigate('/clients')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const globalStatus = calculateClientPaymentStatus(client);
  const dateLocale = language === 'fr' ? fr : undefined;

  const handleArchive = () => {
    console.log('📦 [ClientDetail] Archiving client:', {
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
    });
    archiveClient(client.id);
    console.log('✅ [ClientDetail] Client archived, navigating to clients list');
    navigate('/clients');
  };

  const handleBlacklist = () => {
    console.log('🚫 [ClientDetail] Blacklisting client:', {
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
    });
    blacklistClient(client.id);
    console.log('✅ [ClientDetail] Client blacklisted, navigating to clients list');
    navigate('/clients');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-muted-foreground">{client.phone}</p>
          </div>
          <BadgeStatut status={globalStatus} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${client.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            {t('clients.edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleArchive}>
            <Archive className="w-4 h-4 mr-2" />
            {t('detail.archive')}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBlacklist}>
            <Ban className="w-4 h-4 mr-2" />
            {t('detail.blacklist')}
          </Button>
        </div>
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('detail.info')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('clients.name')}</p>
              <p className="font-medium">{client.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('clients.firstName')}</p>
              <p className="font-medium">{client.firstName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('clients.phone')}</p>
              <p className="font-medium">{client.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('clients.cni')}</p>
              <p className="font-medium">{client.cni}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="rentals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="rentals" className="gap-2">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">{t('detail.rentals')}</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">{t('detail.payments')}</span>
          </TabsTrigger>
          <TabsTrigger value="deposit" className="gap-2">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">{t('detail.deposit')}</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">{t('detail.documents')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Rentals Tab */}
        <TabsContent value="rentals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{t('detail.rentals')}</CardTitle>
                <CardDescription>{client.rentals.length} location(s)</CardDescription>
              </div>
              <Button
                size="sm"
                className="bg-secondary hover:bg-secondary/90"
                onClick={() => navigate(`/clients/${client.id}/add-rental`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('clients.addRental')}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('filter.type')}</TableHead>
                      <TableHead>{t('addClient.property')}</TableHead>
                      <TableHead>{t('addClient.monthlyRent')}</TableHead>
                      <TableHead>{t('detail.deposit')}</TableHead>
                      <TableHead>{t('clients.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.rentals.map((rental) => {
                      const depositStatus = calculateDepositStatus(rental.deposit);
                      return (
                        <TableRow key={rental.id}>
                          <TableCell>
                            <Badge variant="outline">{t(`property.${rental.propertyType}`)}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{rental.propertyName}</TableCell>
                          <TableCell>{formatCurrency(rental.monthlyRent)} FCFA</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="text-muted-foreground">
                                {formatCurrency(rental.deposit.paid)} / {formatCurrency(rental.deposit.total)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <BadgeStatut status={depositStatus} size="sm" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          {client.rentals.map((rental) => (
            <Card key={rental.id} className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="outline">{t(`property.${rental.propertyType}`)}</Badge>
                  {rental.propertyName}
                </CardTitle>
                <CardDescription>
                  {formatCurrency(rental.monthlyRent)} FCFA / mois
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('detail.period')}</TableHead>
                        <TableHead>{t('detail.dueDate')}</TableHead>
                        <TableHead>{t('detail.amount')}</TableHead>
                        <TableHead>{t('detail.paidAmount')}</TableHead>
                        <TableHead>{t('clients.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rental.payments.map((payment) => {
                        const status = calculatePaymentStatus(payment);
                        return (
                          <TableRow key={payment.id} className={status === 'paid' ? 'bg-success/10' : 'hover:bg-muted/50'}>
                            <TableCell>
                              {format(payment.periodStart, 'd MMM', { locale: dateLocale })} →{' '}
                              {format(payment.periodEnd, 'd MMM yyyy', { locale: dateLocale })}
                            </TableCell>
                            <TableCell>
                              {format(payment.dueDate, 'd MMM yyyy', { locale: dateLocale })}
                            </TableCell>
                            <TableCell>{formatCurrency(payment.amount)} FCFA</TableCell>
                            <TableCell>
                              <span className={payment.paidAmount < payment.amount ? 'text-warning' : 'text-success'}>
                                {formatCurrency(payment.paidAmount)} FCFA
                              </span>
                            </TableCell>
                            <TableCell>
                              {status !== 'paid' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    console.log('💰 [ClientDetail] handlePayment clicked');
                                    setSelectedPayment({
                                      payment,
                                      rental,
                                      maxAmount: payment.amount - payment.paidAmount,
                                    });
                                    setPaymentModalOpen(true);
                                  }}
                                  className="text-primary hover:text-primary"
                                >
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  Payer
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Deposit Tab */}
        <TabsContent value="deposit">
          {client.rentals.map((rental) => {
            const depositStatus = calculateDepositStatus(rental.deposit);
            const remaining = rental.deposit.total - rental.deposit.paid;

            return (
              <Card key={rental.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="outline">{t(`property.${rental.propertyType}`)}</Badge>
                    {rental.propertyName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('addClient.totalDeposit')}</p>
                      <p className="text-xl font-bold">{formatCurrency(rental.deposit.total)} FCFA</p>
                    </div>
                    <div className="p-4 bg-success/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('addClient.paidDeposit')}</p>
                      <p className="text-xl font-bold text-success">{formatCurrency(rental.deposit.paid)} FCFA</p>
                    </div>
                    <div className={`p-4 rounded-lg ${remaining > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
                      <p className="text-sm text-muted-foreground">{t('addClient.remainingDeposit')}</p>
                      <p className={`text-xl font-bold ${remaining > 0 ? 'text-warning' : 'text-success'}`}>
                        {formatCurrency(remaining)} FCFA
                      </p>
                    </div>
                    <div className="p-4 flex flex-col justify-center items-center">
                      {remaining > 0 ? (
                        <Button
                          className="bg-secondary hover:bg-secondary/90 w-full"
                          size="sm"
                          onClick={() => {
                            console.log('💰 [ClientDetail] Deposit payment clicked');
                            setSelectedDeposit({
                              rental,
                              maxAmount: remaining,
                            });
                            setDepositModalOpen(true);
                          }}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Payer
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t('detail.documents')}</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                {t('document.upload')}
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                {t('document.noDocuments')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

        <QuickPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          clientName={client.firstName + ' ' + client.lastName}
          propertyName={selectedPayment ? selectedPayment.rental.propertyName : ''}
          amountDue={selectedPayment ? selectedPayment.maxAmount : 0}
          onPayTotal={async () => {
            if (!selectedPayment) return;
            try {
              setIsLoading(true);
              console.log('💵 [ClientDetail] Paying total:', {
                rentalId: selectedPayment.rental.id,
                paymentId: selectedPayment.payment.id,
                amount: selectedPayment.maxAmount,
              });
              await addMonthlyPayment(selectedPayment.rental.id, selectedPayment.payment.id, selectedPayment.maxAmount);
              console.log('✅ [ClientDetail] Payment recorded successfully');
              toast({
                title: t('common.success'),
                description: `Paiement de ${formatCurrency(selectedPayment.maxAmount)} FCFA enregistré`,
              });
              setPaymentModalOpen(false);
              setSelectedPayment(null);
            } catch (error) {
              console.error('❌ [ClientDetail] Error during payment:', error);
              toast({
                title: 'Erreur',
                description: 'Erreur lors de l\'enregistrement du paiement',
                variant: 'destructive',
              });
            } finally {
              setIsLoading(false);
            }
          }}
          onPayPartial={async (amount: number) => {
            if (!selectedPayment) return;
            try {
              setIsLoading(true);
              console.log('💵 [ClientDetail] Paying partial:', {
                rentalId: selectedPayment.rental.id,
                paymentId: selectedPayment.payment.id,
                amount,
              });
              await addMonthlyPayment(selectedPayment.rental.id, selectedPayment.payment.id, amount);
              console.log('✅ [ClientDetail] Partial payment recorded successfully');
              toast({
                title: t('common.success'),
                description: `Paiement de ${formatCurrency(amount)} FCFA enregistré`,
              });
              setPaymentModalOpen(false);
              setSelectedPayment(null);
            } catch (error) {
              console.error('❌ [ClientDetail] Error during partial payment:', error);
              toast({
                title: 'Erreur',
                description: 'Erreur lors de l\'enregistrement du paiement',
                variant: 'destructive',
              });
            } finally {
              setIsLoading(false);
            }
          }}
          isLoading={isLoading}
        />

        {/* Deposit Payment Modal */}
        <QuickPaymentModal
          open={depositModalOpen}
          onOpenChange={setDepositModalOpen}
          clientName={client.firstName + ' ' + client.lastName}
          propertyName={selectedDeposit ? selectedDeposit.rental.propertyName : ''}
          amountDue={selectedDeposit ? selectedDeposit.maxAmount : 0}
          onPayTotal={async () => {
            if (!selectedDeposit) return;
            try {
              setIsLoading(true);
              console.log('💵 [ClientDetail] Deposit: Paying total:', {
                rentalId: selectedDeposit.rental.id,
                amount: selectedDeposit.maxAmount,
              });
              await addDepositPayment(selectedDeposit.rental.id, selectedDeposit.maxAmount);
              console.log('✅ [ClientDetail] Deposit payment recorded successfully');
              toast({
                title: t('common.success'),
                description: `Paiement de caution de ${formatCurrency(selectedDeposit.maxAmount)} FCFA enregistré`,
              });
              setDepositModalOpen(false);
              setSelectedDeposit(null);
            } catch (error) {
              console.error('❌ [ClientDetail] Error during deposit payment:', error);
              toast({
                title: 'Erreur',
                description: 'Erreur lors de l\'enregistrement du paiement de caution',
                variant: 'destructive',
              });
            } finally {
              setIsLoading(false);
            }
          }}
          onPayPartial={async (amount: number) => {
            if (!selectedDeposit) return;
            try {
              setIsLoading(true);
              console.log('💵 [ClientDetail] Deposit: Paying partial:', {
                rentalId: selectedDeposit.rental.id,
                amount,
              });
              await addDepositPayment(selectedDeposit.rental.id, amount);
              console.log('✅ [ClientDetail] Deposit partial payment recorded successfully');
              toast({
                title: t('common.success'),
                description: `Paiement de caution de ${formatCurrency(amount)} FCFA enregistré`,
              });
              setDepositModalOpen(false);
              setSelectedDeposit(null);
            } catch (error) {
              console.error('❌ [ClientDetail] Error during deposit partial payment:', error);
              toast({
                title: 'Erreur',
                description: 'Erreur lors de l\'enregistrement du paiement de caution',
                variant: 'destructive',
              });
            } finally {
              setIsLoading(false);
            }
          }}
          isLoading={isLoading}
        />
    </div>
  );
}
