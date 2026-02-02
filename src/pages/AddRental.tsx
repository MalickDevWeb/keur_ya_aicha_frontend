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

const rentalSchema = z.object({
  propertyName: z.string().min(1, 'Nom requis'),
  propertyType: z.enum(['studio', 'room', 'apartment', 'villa', 'other'], {
    errorMap: () => ({ message: 'Type requis' }),
  }),
  monthlyRent: z.string().min(1, 'Montant requis').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Montant invalide'
  ),
  depositTotal: z.string().min(1, 'Caution requise').refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0,
    'Montant invalide'
  ),
  depositPaid: z.string().optional(),
  startDate: z.string().min(1, 'Date requise'),
});

type RentalFormData = z.infer<typeof rentalSchema>;

export default function AddRental() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { clients } = useData();
  const [isLoading, setIsLoading] = useState(false);

  // Find client
  const client = clients.find(c => c.id === clientId);

  const form = useForm<RentalFormData>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      propertyName: '',
      propertyType: 'apartment',
      monthlyRent: '',
      depositTotal: '',
      depositPaid: '0',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const handleSubmit = async (data: RentalFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement rental addition
      console.log('Add rental:', data);

      // For now, just navigate back
      setTimeout(() => {
        navigate(`/clients/${clientId}`);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!client) {
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
          onClick={() => navigate(`/clients/${clientId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ajouter une location</h1>
          <p className="text-muted-foreground">
            Pour {client.firstName} {client.lastName}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Informations de la location</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Property Name */}
                <FormField
                  control={form.control}
                  name="propertyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du bien / Localisation</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Appartement 5B, Rue X"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Property Type */}
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de bien</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="room">Chambre</SelectItem>
                          <SelectItem value="apartment">Appartement</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Monthly Rent */}
                <FormField
                  control={form.control}
                  name="monthlyRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loyer mensuel (FCFA)</FormLabel>
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

                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
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

                {/* Deposit */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                  <h3 className="font-semibold">Caution</h3>

                  <FormField
                    control={form.control}
                    name="depositTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant total de caution (FCFA)</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="depositPaid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant déjà payé (optionnel)</FormLabel>
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
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/clients/${clientId}`)}
                    disabled={isLoading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    {isLoading ? 'Création...' : 'Créer la location'}
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
