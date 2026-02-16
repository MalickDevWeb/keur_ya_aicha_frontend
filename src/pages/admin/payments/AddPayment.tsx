import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, AlertCircle, CheckCircle2, Clock, Phone, Users, X } from 'lucide-react';
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
import { useGoBack } from '@/hooks/useGoBack';
import { useToast } from '@/hooks/use-toast';

const normalizeSearchText = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function AddPayment() {
  const navigate = useNavigate();
  const goBack = useGoBack('/payments');
  const { toast } = useToast();
  const {
    clientId: paramClientId,
    rentalId: paramRentalId,
    paymentId: paramPaymentId,
  } = useParams();
  const clients = useStore((state) => state.clients)
  const addMonthlyPayment = useStore((state) => state.addMonthlyPayment)
  const [isLoading, setIsLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(paramClientId || '');
  const [selectedRentalId, setSelectedRentalId] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('');

  // Filtrer les clients par recherche (nom, prénom, téléphone)
  const filteredClients = useMemo(() => {
    const searchTokens = normalizeSearchText(clientSearch).split(/\s+/).filter(Boolean);
    return clients.filter(c => {
      if (searchTokens.length === 0) return true;
      const searchable = normalizeSearchText(`${c.firstName} ${c.lastName} ${c.phone}`);
      return searchTokens.every((token) => searchable.includes(token));
    });
  }, [clients, clientSearch]);

  // Client sélectionné
  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

  const selectClient = (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);
    if (!client) return;
    setSelectedClientId(client.id);
    setSelectedRentalId('');
    setSelectedPaymentId('');
    setClientSearch(`${client.firstName} ${client.lastName}`.trim());
    setIsClientDropdownOpen(false);
    form.setValue('clientId', client.id, { shouldValidate: true });
    form.setValue('rentalId', '', { shouldValidate: true });
    form.setValue('paymentId', '', { shouldValidate: true });
  };

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
    if (!rental) return [];
    const pending = rental.payments.filter(p => p.status !== 'paid');
    if (!paramPaymentId) return pending;
    const editedPayment = rental.payments.find((p) => p.id === paramPaymentId);
    if (!editedPayment) return pending;
    if (pending.some((p) => p.id === editedPayment.id)) return pending;
    return [editedPayment, ...pending];
  }, [selectedRentalId, selectedClient, paramPaymentId]);

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

  // Prefill when coming from edit route /payments/:rentalId/edit/:paymentId
  // or /payments/edit/:paymentId.
  useEffect(() => {
    if (!paramPaymentId) return;
    if (selectedPaymentId === paramPaymentId) return;

    let foundClientId = '';
    let foundRentalId = '';

    for (const client of clients) {
      for (const rental of client.rentals) {
        const paymentMatch = rental.payments.some((payment) => payment.id === paramPaymentId);
        if (!paymentMatch) continue;
        foundClientId = client.id;
        foundRentalId = rental.id;
        break;
      }
      if (foundClientId) break;
    }

    if (!foundClientId) return;
    if (paramRentalId && paramRentalId !== foundRentalId) return;

    const selectedClient = clients.find((item) => item.id === foundClientId);
    if (!selectedClient) return;

    setSelectedClientId(foundClientId);
    setSelectedRentalId(foundRentalId);
    setSelectedPaymentId(paramPaymentId);
    setClientSearch(`${selectedClient.firstName} ${selectedClient.lastName}`.trim());
    form.setValue('clientId', foundClientId);
    form.setValue('rentalId', foundRentalId);
    form.setValue('paymentId', paramPaymentId);
  }, [clients, form, paramPaymentId, paramRentalId, selectedPaymentId]);

  useEffect(() => {
    if (!selectedPayment) return;
    const remaining = Math.max(0, selectedPayment.amount - selectedPayment.paidAmount);
    form.setValue('amount', String(remaining));
  }, [form, selectedPayment]);

  const handleSubmit = async (data: AjoutPaiementFormData) => {
    setIsLoading(true);
    try {
      const rentalId = data.rentalId || selectedRentalId;
      const paymentId = data.paymentId || selectedPaymentId;
      const amount = Number(data.amount || 0);

      if (!rentalId || !paymentId) {
        throw new Error('Sélectionnez une location et un paiement.');
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Le montant doit être supérieur à 0.');
      }

      await addMonthlyPayment(rentalId, paymentId, amount, {
        date: data.date,
        receiptNumber: data.receiptNumber,
        notes: data.notes,
      });
      toast({
        title: 'Paiement enregistré',
        description: `${amount.toLocaleString('fr-SN')} FCFA ajouté avec succès.`,
      });
      navigate('/payments');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible d’enregistrer le paiement.';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
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
          onClick={() => goBack('/payments')}
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
                <p className="text-sm text-muted-foreground">
                  Saisissez le nom, prénom ou numéro. La liste est filtrée instantanément.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, prénom ou téléphone..."
                    value={clientSearch}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setIsClientDropdownOpen(true);
                    }}
                    onBlur={() => {
                      window.setTimeout(() => setIsClientDropdownOpen(false), 120);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && filteredClients[0]) {
                        event.preventDefault();
                        selectClient(filteredClients[0].id);
                      }
                    }}
                    className="pl-10 pr-28"
                  />
                  {clientSearch ? (
                    <button
                      type="button"
                      onClick={() => {
                        setClientSearch('');
                        setIsClientDropdownOpen(true);
                      }}
                      className="absolute right-20 top-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-200"
                      aria-label="Vider la recherche"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div className="absolute right-3 top-2.5 flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    <Users className="h-3 w-3" />
                    {filteredClients.length}
                  </div>
                </div>

                {isClientDropdownOpen && (
                  <div className="rounded-xl border border-blue-200 bg-white shadow-lg max-h-72 overflow-y-auto">
                    {filteredClients.length > 0 ? (
                      filteredClients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectClient(client.id)}
                          className={`w-full text-left p-3 border-b border-slate-100 hover:bg-blue-50 transition-colors ${
                            selectedClientId === client.id ? 'bg-blue-100/80' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                {(client.firstName?.[0] || '').toUpperCase()}
                                {(client.lastName?.[0] || '').toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-slate-900">
                                  {client.firstName} {client.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {client.phone}
                                </div>
                              </div>
                            </div>
                            <Badge variant={selectedClientId === client.id ? 'default' : 'outline'}>
                              {client.rentals.length} location(s)
                            </Badge>
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
                        type="button"
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
                          type="button"
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
