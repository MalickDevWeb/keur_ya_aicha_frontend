import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Download, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PaymentModal } from '@/components/PaymentModal';
import { QuickPaymentModal } from '@/components/QuickPaymentModal';
import { DepositModal } from '@/components/DepositModal';
import { ReceiptModal } from '@/components/ReceiptModal';
import { formatCurrency } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRentalDetail } from './hooks/useRentalDetail';

export default function RentalDetail() {
  const { id: rentalId } = useParams();
  const navigate = useNavigate();
  const {
    rental,
    client,
    activeTab,
    setActiveTab,
    paymentModalOpen,
    setPaymentModalOpen,
    quickPaymentModalOpen,
    setQuickPaymentModalOpen,
    depositModalOpen,
    setDepositModalOpen,
    receiptModalOpen,
    setReceiptModalOpen,
    editingDepositId,
    selectedReceipt,
    selectedPaymentForQuickPay,
    paymentStats,
    depositStatus,
    depositRemaining,
    handleAddPayment,
    handleQuickPayPayment,
    handleQuickPayTotal,
    handleQuickPayPartial,
    handleAddDeposit,
    handleEditDeposit,
    handleShowPaymentReceipt,
    handleShowDepositReceipt,
  } = useRentalDetail(rentalId);

  if (!rental || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Location non trouvée</p>
        <Button onClick={() => navigate('/rentals')} className="mt-4">
          Retour aux locations
        </Button>
      </div>
    );
  }

  const propertyTypeLabel = {
    studio: 'Studio',
    room: 'Chambre',
    apartment: 'Appartement',
    villa: 'Villa',
    other: 'Autre',
  }[rental.propertyType] || rental.propertyType;
  const startDate = new Date(rental.startDate);
  const monthlyRent = rental.monthlyRent;
  const paymentStats_remaining = paymentStats.remaining;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/rentals')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{rental.propertyName}</h1>
          <p className="text-muted-foreground">
            {client.firstName} {client.lastName}
          </p>
        </div>
      </div>

      {/* Rental Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{propertyTypeLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Loyer Mensuel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{monthlyRent.toLocaleString('fr-SN')} FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Début</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{format(startDate, 'dd MMM yyyy', { locale: fr })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Période Comptable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">30 jours</p>
            <p className="text-xs text-muted-foreground mt-1">À partir du {format(startDate, 'd', { locale: fr })} de chaque mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'payments' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('payments')}
          className="rounded-b-none"
        >
          Paiements Mensuels
        </Button>
        <Button
          variant={activeTab === 'deposit' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('deposit')}
          className="rounded-b-none"
        >
          Caution
        </Button>
      </div>

      {/* Paiements Mensuels */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Payment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Mois</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{paymentStats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">{paymentStats.paid} payés</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total À Percevoir</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(paymentStats.totalAmount / 1000).toFixed(0)}K FCFA</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Perçu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{(paymentStats.paidAmount / 1000).toFixed(0)}K FCFA</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Reste À Percevoir</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{(paymentStats_remaining / 1000).toFixed(0)}K FCFA</p>
              </CardContent>
            </Card>
          </div>

          {/* Payments Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historique des Paiements</CardTitle>
              <Button
                size="sm"
                className="bg-secondary hover:bg-secondary/90"
                onClick={() => setPaymentModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Paiement
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Période</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Payé</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rental.payments
                      .sort((a, b) => {
                        // Unpaid payments first
                        const statusA = calculatePaymentStatus(a);
                        const statusB = calculatePaymentStatus(b);
                        if (statusA === 'unpaid' && statusB !== 'unpaid') return -1;
                        if (statusA !== 'unpaid' && statusB === 'unpaid') return 1;
                        if (statusA === 'late' && statusB !== 'late') return -1;
                        if (statusA !== 'late' && statusB === 'late') return 1;
                        // Sort by date (most recent first within same status)
                        return new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime();
                      })
                      .map((payment) => {
                      const status = calculatePaymentStatus(payment);
                      const daysLate = Math.max(0, Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
                      const isInDerogation = daysLate > 0 && daysLate <= 5;

                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {format(new Date(payment.periodStart), 'd MMM', { locale: fr })} -{' '}
                            {format(new Date(payment.periodEnd), 'd MMM yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(payment.dueDate), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payment.amount)} FCFA
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={payment.paidAmount > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                              {formatCurrency(payment.paidAmount)} FCFA
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BadgeStatut status={status} />
                              {isInDerogation && (
                                <Badge variant="outline" className="text-amber-600">
                                  -5j
                                </Badge>
                              )}
                              {daysLate > 5 && (
                                <Badge variant="outline" className="text-red-600">
                                  +{daysLate}j
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {status !== 'paid' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuickPayPayment(payment)}
                                  title="Enregistrer un paiement"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center gap-1"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                    <span className="ml-1">Payer</span>
                                  </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Télécharger reçu"
                                onClick={() => handleShowPaymentReceipt(payment)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Caution */}
      {activeTab === 'deposit' && (
        <div className="space-y-4">
          {/* Deposit Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Caution Totale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{rental.deposit.total.toLocaleString('fr-SN')} FCFA</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Caution Payée</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{rental.deposit.paid.toLocaleString('fr-SN')} FCFA</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">À Percevoir</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${depositRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {depositRemaining.toLocaleString('fr-SN')} FCFA
                </p>
                <div className="mt-2">
                  <BadgeStatut status={depositStatus} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deposit Payments Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historique des Paiements de Caution</CardTitle>
              <Button size="sm" className="bg-secondary hover:bg-secondary/90">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Paiement Caution
              </Button>
            </CardHeader>
            <CardContent>
              {rental.deposit.payments && rental.deposit.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Reçu</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rental.deposit.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.date), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {payment.amount.toLocaleString('fr-SN')} FCFA
                          </TableCell>
                          <TableCell className="text-sm">
                            {payment.receiptNumber}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Éditer"
                                onClick={() => handleEditDeposit(payment.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Télécharger reçu"
                                onClick={() => handleShowDepositReceipt(rental.deposit, payment)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun paiement de caution enregistré
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onSubmit={handleAddPayment}
        maxAmount={monthlyRent}
      />

      {/* Deposit Modal */}
      <DepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
        onSubmit={handleAddDeposit}
        maxAmount={depositRemaining}
        currentPaid={rental.deposit.paid}
        totalDeposit={rental.deposit.total}
        isEdit={!!editingDepositId}
      />

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          open={receiptModalOpen}
          onOpenChange={setReceiptModalOpen}
          type={selectedReceipt.type}
          clientName={selectedReceipt.clientName}
          propertyName={selectedReceipt.propertyName}
          propertyType={selectedReceipt.propertyType}
          amount={selectedReceipt.amount}
          date={new Date(selectedReceipt.date)}
          receiptNumber={selectedReceipt.receiptNumber}
          periodStart={selectedReceipt.periodStart ? new Date(selectedReceipt.periodStart) : undefined}
          periodEnd={selectedReceipt.periodEnd ? new Date(selectedReceipt.periodEnd) : undefined}
          monthlyRent={selectedReceipt.monthlyRent}
        />
      )}

      {/* Quick Payment Modal */}
      {selectedPaymentForQuickPay && (
        <QuickPaymentModal
          open={quickPaymentModalOpen}
          onOpenChange={setQuickPaymentModalOpen}
          onPayTotal={handleQuickPayTotal}
          onPayPartial={handleQuickPayPartial}
          clientName={`${client.firstName} ${client.lastName}`}
          propertyName={rental.propertyName}
          amountDue={selectedPaymentForQuickPay.amount - selectedPaymentForQuickPay.paidAmount}
        />
      )}
    </div>
  );
}
