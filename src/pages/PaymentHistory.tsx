import { useMemo, useState } from "react";
import { ArrowLeft, Download, Eye } from "lucide-react";
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
import { BadgeStatut } from "@/components/BadgeStatut";

export default function PaymentHistory() {
  const navigate = useNavigate();
  const { clients } = useData();

  // Get all payments sorted by date (newest first)
  const allPayments = useMemo(() => {
    const payments: any[] = [];
    clients.forEach(client => {
      client.rentals.forEach(rental => {
        rental.payments.forEach(payment => {
          payment.payments?.forEach(record => {
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

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
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
            <h1 className="text-3xl font-bold">Historique des Paiements</h1>
            <p className="text-muted-foreground">Tous les paiements enregistrés</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Reçu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(allPayments.reduce((sum, p) => sum + p.amount, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nombre de Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allPayments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Paiements ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {allPayments.filter(p => {
                const date = new Date(p.paymentDate);
                const today = new Date();
                return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
              }).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Propriété</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPayments.map(payment => {
                  const { rental, client } = getRentalInfo(payment.rentalId);
                  return (
                    <TableRow key={payment.id}>
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
                        <BadgeStatut status={payment.status} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.paymentType === "full" ? "Total" : "Partiel"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/rentals/${rental?.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            const { rental, client } = getRentalInfo(payment.rentalId);
                            const docForPdf: any = {
                              payerName: `${client?.firstName || ''} ${client?.lastName || ''}`.trim(),
                              payerPhone: client?.phone,
                              amount: payment.amount,
                              uploadedAt: payment.paymentDate,
                              name: `Reçu-${payment.id}`,
                              note: rental?.propertyName || '',
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

          {allPayments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun paiement enregistré
            </div>
          )}
        </CardContent>
      </Card>
        <SendDownloadModal document={modalDoc} onClose={() => setModalDoc(null)} />
    </div>
  );
}
