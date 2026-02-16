import { useMemo, useState } from "react";
import { ArrowLeft, Download, Printer, Grid3x3, List, Eye } from "lucide-react";
import SendDownloadModal from '@/components/SendDownloadModal';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useStore } from '@/stores/dataStore';
import type { Client, PaymentStatus, Rental } from "@/lib/types";
import { formatCurrency } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle, } from "@/components/ui/dialog";
import { useGoBack } from '@/hooks/useGoBack';

export default function PaymentReceipts() {
  const goBack = useGoBack('/payments');
  const clients = useStore((state) => state.clients)
  type PaymentRow = {
    id: string;
    rentalId: string;
    amount: number;
    paymentDate: Date;
    status: PaymentStatus;
    paymentType: 'full' | 'partial';
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

  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [modalDoc, setModalDoc] = useState<ReceiptDoc | null>(null);

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  // Get all paid payments sorted by date (newest first)
  const paidPayments = useMemo(() => {
    const payments: PaymentRow[] = [];
    clients.forEach((client) => {
      client.rentals.forEach((rental) => {
        rental.payments.forEach((payment) => {
          if (payment.status === 'paid' && payment.payments) {
            payment.payments.forEach((record) => {
              payments.push({
                id: record.id,
                rentalId: rental.id,
                amount: record.amount,
                paymentDate: record.date,
                status: payment.status,
                paymentType: 'full',
              });
            });
          }
        });
      });
    });
    return payments.sort((a, b) => {
      return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
    });
  }, [clients]);

  const getRentalInfo = (rentalId: string) => {
    let rental: Rental | null = null;
    let client: Client | null = null;
    for (const c of clients) {
      const foundRental = c.rentals.find(r => r.id === rentalId);
      if (foundRental) {
        rental = foundRental;
        client = c;
        break;
      }
    }
    return { rental, client };
  };

  const handleViewReceipt = (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setReceiptOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (_payment: PaymentRow) => {
    // replaced by modal flow
  };

  const totalAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthCount = paidPayments.filter(p => {
    const date = new Date(p.paymentDate);
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => goBack('/payments')} className="rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-foreground">Reçus de Paiement</h1>
            <p className="text-muted-foreground mt-1">Télécharger ou imprimer les reçus</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reçus Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-black text-foreground">{paidPayments.length}</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Reçus</p>
              </div>
              <div className="text-5xl opacity-20">🧾</div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montant Total Reçu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-black text-success">{(totalAmount / 1000).toFixed(0)}<span className="text-lg">K</span></p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">FCFA</p>
              </div>
              <div className="text-5xl opacity-20">💚</div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reçus ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-black text-foreground">{thisMonthCount}</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Février 2026</p>
              </div>
              <div className="text-5xl opacity-20">📅</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipts Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-foreground">Liste des Reçus</h2>
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
        </CardHeader>

        {/* Cards View */}
        {viewMode === 'cards' && (
          <CardContent className="p-6">
            {paidPayments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paidPayments.map((payment, index) => {
                  const { rental, client } = getRentalInfo(payment.rentalId);
                  const receiptNumber = `RCP-${new Date(payment.paymentDate).getFullYear()}-${String(index + 1).padStart(4, "0")}`;

                  return (
                    <Card
                      key={payment.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-muted-foreground/20"
                    >
                      {/* Header */}
                      <div className="p-4 bg-gradient-to-br from-primary to-secondary text-primary-foreground relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                        <div className="relative z-10">
                          <p className="text-xs font-bold text-white/80 uppercase">Reçu</p>
                          <h3 className="font-black text-lg text-white font-mono">{receiptNumber}</h3>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        {/* Client */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Client</p>
                          <p className="text-sm font-bold text-foreground mt-1">{client?.firstName} {client?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{client?.phone}</p>
                        </div>

                        {/* Property & Amount Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground font-semibold">Propriété</p>
                            <p className="text-sm font-bold text-foreground mt-1">{rental?.propertyName}</p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-xs text-muted-foreground font-semibold">Montant</p>
                            <p className="text-sm font-black text-green-600 dark:text-green-400 mt-1">{(payment.amount / 1000).toFixed(0)}K</p>
                          </div>
                        </div>

                        {/* Date & Type */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-medium text-muted-foreground">{formatDate(payment.paymentDate)}</span>
                          <Badge variant="outline" className="capitalize font-semibold">
                            {payment.paymentType === "full" ? "Total" : "Partiel"}
                          </Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReceipt(payment)}
                            className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const docForPdf: ReceiptDoc = {
                                payerName: `${client?.firstName || ''} ${client?.lastName || ''}`.trim(),
                                payerPhone: client?.phone,
                                amount: payment.amount,
                                uploadedAt: payment.paymentDate,
                                name: `Reçu-${receiptNumber}`,
                                type: 'receipt',
                                note: `Propriété: ${rental?.propertyName || ''}`,
                              };
                              setModalDoc(docForPdf);
                            }}
                            className="text-green-600 border-green-300 hover:bg-green-600 hover:text-white hover:border-green-600 transition-colors"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            <span className="text-xs font-semibold">PDF</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🧾</div>
                <p className="text-foreground font-medium">Aucun reçu disponible</p>
                <p className="text-muted-foreground text-sm mt-1">Les reçus de paiement apparaîtront ici</p>
              </div>
            )}
            {paidPayments.length > 0 && (
              <div className="mt-6 pt-4 border-t text-center text-sm font-medium text-muted-foreground">
                📊 Affichage de {paidPayments.length} reçu{paidPayments.length > 1 ? 's' : ''}
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
                    <TableHead className="font-bold">Numéro Reçu</TableHead>
                    <TableHead className="font-bold">Client</TableHead>
                    <TableHead className="font-bold">Propriété</TableHead>
                    <TableHead className="text-right font-bold">Montant</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Type</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidPayments.map((payment, index) => {
                    const { rental, client } = getRentalInfo(payment.rentalId);
                    const receiptNumber = `RCP-${new Date(payment.paymentDate).getFullYear()}-${String(index + 1).padStart(4, "0")}`;
                    return (
                      <TableRow key={payment.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono font-bold text-secondary">{receiptNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-foreground">{client?.firstName} {client?.lastName}</p>
                            <p className="text-sm text-muted-foreground">{client?.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {rental?.propertyName}
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-black text-success">{(payment.amount / 1000).toFixed(0)}K</p>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {formatDate(payment.paymentDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize font-semibold">
                            {payment.paymentType === "full" ? "Total" : "Partiel"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReceipt(payment)}
                              title="Voir le reçu"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const docForPdf: ReceiptDoc = {
                                  payerName: `${client?.firstName || ''} ${client?.lastName || ''}`.trim(),
                                  payerPhone: client?.phone,
                                  amount: payment.amount,
                                  uploadedAt: payment.paymentDate,
                                  name: `Reçu-${receiptNumber}`,
                                  type: 'receipt',
                                  note: `Propriété: ${rental?.propertyName || ''}`,
                                };
                                setModalDoc(docForPdf);
                              }}
                              title="Télécharger le reçu"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {paidPayments.length > 0 && (
              <div className="px-6 py-3 border-t bg-muted/50 text-xs font-medium text-muted-foreground">
                📊 Affichage de {paidPayments.length} reçu{paidPayments.length > 1 ? 's' : ''}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Receipt Preview Dialog */}
      {selectedPayment && (
        <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reçu de Paiement</DialogTitle>
            </DialogHeader>

            {(() => {
              const { rental, client } = getRentalInfo(selectedPayment.rentalId);
              const receiptDate = formatDate(selectedPayment.paymentDate);
              const receiptNumber = `RCP-${new Date(selectedPayment.paymentDate).getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

              return (
                <div className="space-y-6 p-6 border rounded-lg bg-white">
                  {/* Header */}
                  <div className="text-center border-b pb-4">
                    <h2 className="text-2xl font-bold">REÇU DE PAIEMENT</h2>
                    <p className="text-muted-foreground">KeurYaAicha Management</p>
                  </div>

                  {/* Receipt Info */}
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Numéro Reçu</p>
                      <p className="text-lg font-mono font-semibold">{receiptNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                      <p className="text-lg font-semibold">{receiptDate}</p>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="border-t border-b py-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Reçu de</p>
                    <p className="font-semibold">{client?.firstName} {client?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{client?.phone}</p>
                    <p className="text-sm text-muted-foreground">{client?.email}</p>
                  </div>

                  {/* Property Info */}
                  <div className="border-t border-b py-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Propriété</p>
                    <p className="font-semibold">{rental?.propertyName}</p>
                    <p className="text-sm text-muted-foreground">Type: {rental?.propertyType}</p>
                  </div>

                  {/* Amount Info */}
                  <div className="border-t border-b py-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Montant</span>
                      <span className="text-lg font-semibold text-success">
                        {formatCurrency(selectedPayment.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Type: {selectedPayment.paymentType === "full" ? "Paiement Total" : "Paiement Partiel"}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center text-sm text-muted-foreground border-t pt-4">
                    <p>Merci pour votre paiement</p>
                    <p className="text-xs mt-2">Ce reçu est valide et officiel</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center pt-4">
                    <Button onClick={handlePrint} className="gap-2">
                      <Printer className="h-4 w-4" />
                      Imprimer
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => handleDownload(selectedPayment)}>
                      <Download className="h-4 w-4" />
                      Télécharger PDF
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
      <SendDownloadModal document={modalDoc} onClose={() => setModalDoc(null)} />
    </div>
  );
}
