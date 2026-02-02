import { useMemo, useState } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import SendDownloadModal from '@/components/SendDownloadModal';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { formatCurrency } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PaymentReceipts() {
  const navigate = useNavigate();
  const { clients } = useData();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  // Get all paid payments sorted by date (newest first)
  const paidPayments = useMemo(() => {
    const payments: any[] = [];
    clients.forEach(client => {
      client.rentals.forEach(rental => {
        rental.payments.forEach(payment => {
          if (payment.status === 'paid' && payment.payments) {
            payment.payments.forEach(record => {
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
    let rental = null;
    let client = null;
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

  const handleViewReceipt = (payment: any) => {
    setSelectedPayment(payment);
    setReceiptOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (payment: any) => {
    // replaced by modal flow
  };

  const [modalDoc, setModalDoc] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Reçus de Paiement</h1>
            <p className="text-muted-foreground">Télécharger ou imprimer les reçus</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
        <SendDownloadModal document={modalDoc} onClose={() => setModalDoc(null)} />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reçus Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{paidPayments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Montant Total Reçu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(paidPayments.reduce((sum, p) => sum + p.amount, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reçus ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {paidPayments.filter(p => {
                const date = new Date(p.paymentDate);
                const today = new Date();
                return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
              }).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Reçus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro Reçu</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Propriété</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidPayments.map((payment, index) => {
                  const { rental, client } = getRentalInfo(payment.rentalId);
                  const receiptNumber = `RCP-${new Date(payment.paymentDate).getFullYear()}-${String(index + 1).padStart(4, "0")}`;
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <p className="font-mono font-semibold">{receiptNumber}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client?.firstName} {client?.lastName}</p>
                          <p className="text-sm text-muted-foreground">{client?.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rental?.name}</p>
                          <p className="text-sm text-muted-foreground">{rental?.address}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                      </TableCell>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.paymentType === "full" ? "Total" : "Partiel"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewReceipt(payment)}>
                              Voir
                            </Button>
                                <Button variant="ghost" size="sm" onClick={() => {
                                  const { rental, client } = getRentalInfo(payment.rentalId);
                                  const receiptNumber = `RCP-${new Date(payment.paymentDate).getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
                                  const docForPdf: any = {
                                    payerName: `${client?.firstName || ''} ${client?.lastName || ''}`.trim(),
                                    payerPhone: client?.phone,
                                    amount: payment.amount,
                                    uploadedAt: payment.paymentDate,
                                    name: `Reçu-${receiptNumber}`,
                                    note: `Propriété: ${rental?.propertyName || rental?.name || ''}`
                                  };
                                  setModalDoc(docForPdf);
                                }}>
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

          {paidPayments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun reçu disponible
            </div>
          )}
        </CardContent>
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
                    <p className="font-semibold">{rental?.name}</p>
                    <p className="text-sm text-muted-foreground">{rental?.address}</p>
                    <p className="text-sm text-muted-foreground">Type: {rental?.type}</p>
                  </div>

                  {/* Amount Info */}
                  <div className="border-t border-b py-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Montant</span>
                      <span className="text-lg font-semibold text-green-600">
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
    </div>
  );
}
