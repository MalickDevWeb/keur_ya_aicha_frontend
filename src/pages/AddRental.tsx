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
  const params = useParams();
  const clientId = (params as any).clientId || (params as any).id;
  const { clients, addRental } = useData();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clientId || null);
  const [clientSearch, setClientSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Find client
  const client = clients.find(c => c.id === clientId);

  // Filter clients by search
  const filteredClients = clients.filter(c => {
    const searchLower = clientSearch.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(searchLower) ||
      c.lastName.toLowerCase().includes(searchLower) ||
      c.phone.includes(searchLower) ||
      c.id.includes(searchLower)
    );
  });

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

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
      if (!selectedClientId) {
        alert('Veuillez sélectionner un client');
        return;
      }

      const rentalData: any = {
        propertyType: data.propertyType,
        propertyName: data.propertyName,
        monthlyRent: Number(data.monthlyRent),
        startDate: new Date(data.startDate),
        deposit: {
          total: Number(data.depositTotal),
          paid: Number(data.depositPaid || 0),
          payments: [],
        },
      };

      addRental(selectedClientId, rentalData);

      // Navigate back to client
      navigate(`/clients/${selectedClientId}`);
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
          onClick={() => navigate('/rentals')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Ajouter une location</h1>
          {selectedClient && (
            <p className="text-muted-foreground">Pour {selectedClient.firstName} {selectedClient.lastName}</p>
          )}
        </div>
      </div>

      {/* Client Selection Card */}
      {!selectedClientId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sélectionner un client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="client-search" className="text-sm font-medium">
                Chercher un client (nom, prénom, téléphone ou ID)
              </label>
              <Input
                id="client-search"
                placeholder="Ex: Amadou, Diallo, +221 77, client-1"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>

            {filteredClients.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {filteredClients.length} client(s) trouvé(s)
                </p>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedClientId(c.id);
                        setClientSearch('');
                      }}
                      className="w-full text-left p-3 rounded-lg border border-input hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <p className="font-medium">{c.firstName} {c.lastName}</p>
                      <p className="text-sm text-muted-foreground">{c.phone}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : clientSearch.length > 0 ? (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun client trouvé avec "{clientSearch}"
                </p>
                <Button
                  onClick={() => navigate('/clients/add')}
                  className="bg-secondary hover:bg-secondary/90"
                  size="sm"
                >
                  Créer un nouveau client
                </Button>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                Tapez pour chercher un client ou cliquez sur la liste ci-dessous
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
