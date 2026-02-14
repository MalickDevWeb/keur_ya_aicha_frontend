import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ArrowLeft, Search, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/stores/dataStore';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ajoutPaiementSchema, AjoutPaiementFormData } from '@/validators/frontend';

export default function AddPayment() {
  const navigate = useNavigate();
  const { clientId: paramClientId } = useParams();
  const clients = useStore((state) => state.clients)
  const [isLoading, setIsLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(paramClientId || '');
  const [selectedRentalId, setSelectedRentalId] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('');

  // Filtrer les clients par recherche (nom, prénom, téléphone)
  const filteredClients = useMemo(() => {
    const search = clientSearch.toLowerCase();
    return clients.filter(c => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const phone = c.phone.toLowerCase();
      return !search || fullName.includes(search) || phone.includes(search);
    });
  }, [clients, clientSearch]);

  // Client sélectionné
  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

  // Locations du client avec paiements en attente
  const clientRentalsWithPending = useMemo(() => {
    if (!selectedClient) return [];
    return selectedClient.rentals.map(rental => {
      const pendingPayments = rental.payments.filter(p => p.status !== 'paid');
      return { rental, pendingPayments };
    });
  }, [selectedClient]);

  // Paiements en attente pour la location sélectionnée
  const pendingPayments = useMemo(() => {
    if (!selectedRentalId) return [];
    const rental = selectedClient?.rentals.find(r => r.id === selectedRentalId);
    return rental?.payments.filter(p => p.status !== 'paid') || [];
  }, [selectedRentalId, selectedClient]);

  const form = useForm<AjoutPaiementFormData>({
    resolver: zodResolver(ajoutPaiementSchema),
    defaultValues: {
      clientId: selectedClientId,
      rentalId: selectedRentalId,
      paymentId: selectedPaymentId,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      notes: '',
    },
  });

  const selectedPayment = useMemo(() => {
    if (!selectedPaymentId) return null;
    return pendingPayments.find(p => p.id === selectedPaymentId);
  }, [selectedPaymentId, pendingPayments]);

  const handleSubmit = async (_data: AjoutPaiementFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement payment addition in API
      setTimeout(() => {
        navigate('/payments');
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/payments')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">💰 Enregistrer un paiement</h1>
          <p className="text-muted-foreground">Sélectionnez un client et enregistrez le paiement reçu</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-5xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Step 1: Client Selection */}
            <Card className="border-2 border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">1</span>
                  Sélectionner un client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, prénom ou téléphone..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Client List */}
                {clientSearch && (
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {filteredClients.length > 0 ? (
                      filteredClients.map(client => (
                        <button
                          key={client.id}
                          onClick={() => {
                            setSelectedClientId(client.id);
                            setSelectedRentalId('');
                            setSelectedPaymentId('');
                            form.setValue('clientId', client.id);
                            form.setValue('rentalId', '');
                            form.setValue('paymentId', '');
                          }}
                          className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors ${
                            selectedClientId === client.id ? 'bg-blue-100' : ''
                          }`}
                        >
                          <div className="font-semibold">
                            {client.firstName} {client.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {client.phone} • {client.rentals.length} location(s)
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">Aucun client trouvé</div>
                    )}
                  </div>
                )}

                {/* Selected Client Display */}
                {selectedClient && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">
                        {selectedClient.firstName} {selectedClient.lastName}
                      </span>
                    </div>
                    <div className="text-sm text-green-800">
                      📱 {selectedClient.phone} • 🏠 {selectedClient.rentals.length} location(s)
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Rental Selection */}
            {selectedClient && (
              <Card className="border-2 border-purple-200 bg-purple-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-sm">2</span>
                    Sélectionner une location avec paiements en attente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {clientRentalsWithPending.map(({ rental, pendingPayments }) => (
                      <button
                        key={rental.id}
                        onClick={() => {
                          setSelectedRentalId(rental.id);
                          setSelectedPaymentId('');
                          form.setValue('rentalId', rental.id);
                          form.setValue('paymentId', '');
                        }}
                        className={`text-left p-4 border-2 rounded-lg transition-all ${
                          selectedRentalId === rental.id
                            ? 'border-purple-500 bg-purple-100'
                            : 'border-muted hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold">{rental.propertyName}</div>
                            <div className="text-sm text-muted-foreground">
                              {rental.monthlyRent.toLocaleString('fr-SN')} FCFA/mois
                            </div>
                          </div>
                          {pendingPayments.length > 0 && (
                            <Badge variant="destructive">
                              {pendingPayments.length} paiement(s) en attente
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment Selection */}
            {selectedClient && selectedRentalId && pendingPayments.length > 0 && (
              <Card className="border-2 border-amber-200 bg-amber-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white font-bold text-sm">3</span>
                    Sélectionner le paiement à enregistrer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingPayments.map(payment => {
                      const isPartial = payment.status === 'partial';
                      const isUnpaid = payment.status === 'unpaid';
                      const isLate = payment.status === 'late';

                      return (
                        <button
                          key={payment.id}
                          onClick={() => {
                            setSelectedPaymentId(payment.id);
                            form.setValue('paymentId', payment.id);
                            form.setValue('amount', String(payment.amount - payment.paidAmount));
                          }}
                          className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                            selectedPaymentId === payment.id
                              ? 'border-amber-500 bg-amber-100'
                              : 'border-muted hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {isUnpaid && <Clock className="w-5 h-5 text-red-500" />}
                              {isPartial && <AlertCircle className="w-5 h-5 text-amber-500" />}
                              {isLate && <AlertCircle className="w-5 h-5 text-red-700" />}
                              <div>
                                <div className="font-semibold">
                                  {format(new Date(payment.periodStart), 'd MMM', { locale: fr })} → {' '}
                                  {format(new Date(payment.periodEnd), 'd MMM yyyy', { locale: fr })}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Total: {payment.amount.toLocaleString('fr-SN')} FCFA • Payé: {payment.paidAmount.toLocaleString('fr-SN')} FCFA
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-cyan-600">
                                {(payment.amount - payment.paidAmount).toLocaleString('fr-SN')} FCFA
                              </div>
                              <div className="text-xs text-muted-foreground">à payer</div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {isLate && <Badge className="bg-red-600">EN RETARD</Badge>}
                            {isPartial && <Badge className="bg-amber-600">PARTIEL</Badge>}
                            {isUnpaid && <Badge className="bg-red-500">À PAYER</Badge>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Payment Details */}
            {selectedClient && selectedRentalId && selectedPayment && (
              <Card className="border-2 border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold text-sm">4</span>
                    Détails du paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant payé (FCFA)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1000"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Montant à payer: {(selectedPayment.amount - selectedPayment.paidAmount).toLocaleString('fr-SN')} FCFA
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date */}
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date du paiement</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Receipt Number */}
                  <FormField
                    control={form.control}
                    name="receiptNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de reçu (optionnel)</FormLabel>
                        <FormControl>
                          <Input placeholder="REC-202602-XXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Ajouter des notes..." rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/payments')}
                      disabled={isLoading}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      {isLoading ? '⏳ Enregistrement...' : '✅ Enregistrer le paiement'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
