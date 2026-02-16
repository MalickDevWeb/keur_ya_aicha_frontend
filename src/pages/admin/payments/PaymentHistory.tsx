import { useMemo, useState } from "react";
import { ArrowLeft, Download, Eye, Grid3x3, List } from "lucide-react";
import SendDownloadModal from '@/components/SendDownloadModal';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useStore } from '@/stores/dataStore';
import type { Client, PaymentStatus, Rental } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BadgeStatut } from "@/components/BadgeStatut";
import { useGoBack } from '@/hooks/useGoBack';

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

export default function PaymentHistory() {
  const navigate = useNavigate();
  const goBack = useGoBack('/payments');
  const clients = useStore((state) => state.clients)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Get all payments sorted by date (newest first)
  const allPayments = useMemo(() => {
    const payments: PaymentRow[] = [];
    clients.forEach((client) => {
      client.rentals.forEach((rental) => {
        rental.payments.forEach((payment) => {
          payment.payments?.forEach((record) => {
            payments.push({
              id: record.id,
              rentalId: rental.id,
              amount: record.amount,
              paymentDate: record.date,
              status: payment.status,
              paymentType: 'full',
            });
          });
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

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  const [modalDoc, setModalDoc] = useState<ReceiptDoc | null>(null);

  const totalAmount = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthCount = allPayments.filter(p => {
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
            <h1 className="text-3xl font-black text-foreground">Historique des Paiements</h1>
            <p className="text-muted-foreground mt-1">Tous les paiements enregistrés</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Reçu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-black text-success">{(totalAmount / 1000).toFixed(0)}<span className="text-lg">K</span></p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">FCFA</p>
              </div>
              <div className="text-5xl opacity-20">💰</div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre de Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-black text-foreground">{allPayments.length}</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Total</p>
              </div>
              <div className="text-5xl opacity-20">📊</div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paiements ce mois</CardTitle>
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

      {/* Details Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-foreground">Détail des Paiements</h2>
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
            {allPayments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPayments.map(payment => {
                  const { rental, client } = getRentalInfo(payment.rentalId);
                  return (
                    <Card
                      key={payment.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer border-muted-foreground/20"
                    >
                      {/* Header */}
                      <div className="p-4 bg-gradient-to-br from-success to-success text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform" />
                        <div className="relative z-10">
                          <h3 className="font-black text-lg text-white">{client?.firstName} {client?.lastName}</h3>
                          <p className="text-white/90 text-sm">{client?.phone}</p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        {/* Property */}
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Propriété</p>
                            <p className="text-sm font-bold text-foreground mt-1">{rental?.propertyName}</p>
                          </div>
                        </div>

                        {/* Amount & Date Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground font-semibold">Montant</p>
                            <p className="text-sm font-black text-success mt-1">{(payment.amount / 1000).toFixed(0)}K</p>
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground font-semibold">Date</p>
                            <p className="text-xs font-bold text-foreground mt-1">{formatDate(payment.paymentDate)}</p>
                          </div>
                        </div>

                        {/* Status & Type */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex gap-2">
                            <BadgeStatut status={payment.status} size="sm" />
                            <Badge variant="outline" className="capitalize font-semibold">
                              {payment.paymentType === "full" ? "Total" : "Partiel"}
                            </Badge>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/rentals/${rental?.id}`)}
                            className="flex-1 hover:bg-muted"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir
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
                                name: `Reçu-${payment.id}`,
                                type: 'receipt',
                                note: rental?.propertyName || '',
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
                <p className="text-foreground font-medium">Aucun paiement enregistré</p>
                <p className="text-muted-foreground text-sm mt-1">Les paiements apparaîtront ici</p>
              </div>
            )}
            {allPayments.length > 0 && (
              <div className="mt-6 pt-4 border-t text-center text-sm font-medium text-muted-foreground">
                📊 Affichage de {allPayments.length} paiement{allPayments.length > 1 ? 's' : ''}
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
                    <TableHead className="font-bold">Propriété</TableHead>
                    <TableHead className="text-right font-bold">Montant</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Statut</TableHead>
                    <TableHead className="font-bold">Type</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPayments.map(payment => {
                    const { rental, client } = getRentalInfo(payment.rentalId);
                    return (
                      <TableRow key={payment.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
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
                          <BadgeStatut status={payment.status} size="sm" />
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
                              onClick={() => navigate(`/rentals/${rental?.id}`)}
                              title="Voir les détails"
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
                                  name: `Reçu-${payment.id}`,
                                  type: 'receipt',
                                  note: rental?.propertyName || '',
                                };
                                setModalDoc(docForPdf);
                              }}
                              title="Télécharger reçu"
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

            {allPayments.length > 0 && (
              <div className="px-6 py-3 border-t bg-muted/50 text-xs font-medium text-muted-foreground">
                📊 Affichage de {allPayments.length} paiement{allPayments.length > 1 ? 's' : ''}
              </div>
            )}
          </CardContent>
        )}
      </Card>
      <SendDownloadModal document={modalDoc} onClose={() => setModalDoc(null)} />
    </div>
  );
}
