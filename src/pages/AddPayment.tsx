import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { Textarea } from '@/components/ui/textarea';

const paymentSchema = z.object({
  rentalId: z.string().min(1, 'Location requise'),
  amount: z.string().min(1, 'Montant requis').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Montant invalide'
  ),
  date: z.string().min(1, 'Date requise'),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function AddPayment() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { clients } = useData();
  const [isLoading, setIsLoading] = useState(false);

  // Get all rentals from all clients
  const allRentals = clients.flatMap(c =>
    c.rentals.map(r => ({ ...r, clientName: c.firstName + ' ' + c.lastName, clientId: c.id }))
  );

  // Find specific rental if clientId provided
  const client = clientId ? clients.find(c => c.id === clientId) : null;
  const clientRentals = client?.rentals || [];
  const selectedRentalId = useParams().rentalId;

  // Use all rentals if no client selected, otherwise use client rentals
  const rentalsToShow = clientId ? clientRentals : allRentals;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      rentalId: selectedRentalId || '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      notes: '',
    },
  });

  const handleSubmit = async (data: PaymentFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement payment addition
      console.log('Add payment:', data);

      // For now, just navigate back
      setTimeout(() => {
        navigate(`/rentals/${data.rentalId}`);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  // If clientId provided but client not found
  if (clientId && !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Client non trouvé</p>
        <Button onClick={() => navigate('/clients')} className="mt-4">
          Retour aux clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(selectedRentalId ? `/rentals/${selectedRentalId}` : '/payments')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Enregistrer un paiement</h1>
          {client && (
            <p className="text-muted-foreground">
              {client.firstName} {client.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Détails du paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Rental Selection */}
                <FormField
                  control={form.control}
                  name="rentalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rentalsToShow.map((rental: any) => (
                            <SelectItem key={rental.id} value={rental.id}>
                              {rental.propertyName} - {rental.monthlyRent.toLocaleString('fr-SN')} FCFA/mois
                              {!clientId && rental.clientName && ` (${rental.clientName})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Display Rental Info */}
                {form.watch('rentalId') && rentalsToShow.find((r: any) => r.id === form.watch('rentalId')) && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Bien</p>
                        <p className="font-semibold">
                          {rentalsToShow.find((r: any) => r.id === form.watch('rentalId'))?.propertyName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Loyer mensuel</p>
                        <p className="font-semibold">
                          {rentalsToShow.find((r: any) => r.id === form.watch('rentalId'))?.monthlyRent.toLocaleString('fr-SN')} FCFA
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                        <Input
                          type="date"
                          {...field}
                        />
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
                        <Input
                          placeholder="REC-202602-XXXXXX"
                          {...field}
                        />
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
                        <Textarea
                          placeholder="Ajouter des notes..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(selectedRentalId ? `/rentals/${selectedRentalId}` : '/payments')}
                    disabled={isLoading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    {isLoading ? 'Enregistrement...' : 'Enregistrer le paiement'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
