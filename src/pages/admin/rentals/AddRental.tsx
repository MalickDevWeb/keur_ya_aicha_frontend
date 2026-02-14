import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
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
import { Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/stores/dataStore';
import { ajoutLocationSchema, AjoutLocationFormData } from '@/validators/frontend';
import { applyApiFieldErrors } from '@/utils/apiFieldErrors';

export default function AddRental() {
  const navigate = useNavigate();
  const { clientId: routeClientId, id: routeId } = useParams<{ clientId?: string; id?: string }>();
  const clientId = routeClientId || routeId || '';
  const clients = useStore((state) => state.clients)
  const addRental = useStore((state) => state.addRental)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clientId || null);
  const [clientSearch, setClientSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter clients by search
  const filteredClients = clients.filter(c => {
    const searchLower = (clientSearch || '').toLowerCase();
    return (
      (c.firstName || '').toLowerCase().includes(searchLower) ||
      (c.lastName || '').toLowerCase().includes(searchLower) ||
      (c.phone || '').includes(searchLower) ||
      (c.id || '').includes(searchLower)
    );
  });

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

  const form = useForm<AjoutLocationFormData>({
    resolver: zodResolver(ajoutLocationSchema),
    defaultValues: {
      propertyName: '',
      propertyType: 'apartment',
      monthlyRent: '',
      depositTotal: '',
      depositPaid: '0',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const handleSubmit = async (data: AjoutLocationFormData) => {
    setIsLoading(true);
    try {
      if (!selectedClientId) {
        alert('Veuillez sélectionner un client');
        return;
      }

      type AddRentalPayload = Parameters<typeof addRental>[1];
      const rentalData: AddRentalPayload = {
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

      await addRental(selectedClientId, rentalData);

      // Navigate back to client
      navigate(`/clients/${selectedClientId}`);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : 'Impossible d’ajouter la location.';
      const message = raw.includes(':') ? raw.split(':').slice(-1)[0].trim() : raw;
      applyApiFieldErrors(form.setError, message);
      alert(message || 'Impossible d’ajouter la location. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/rentals')}
            className="border-slate-300 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-black text-slate-900">Ajouter une location</h1>
            {selectedClient && (
              <p className="text-slate-600 mt-1">Pour <span className="font-semibold text-slate-900">{selectedClient.firstName} {selectedClient.lastName}</span></p>
            )}
          </div>
        </div>

        {/* Client Selection */}
        {!selectedClientId && (
          <div className="space-y-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-lg">
                <CardTitle className="text-xl font-black">Sélectionner un client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <label htmlFor="client-search" className="text-sm font-semibold text-slate-900">
                    Chercher un client (nom, prénom, téléphone ou ID)
                  </label>
                  <Input
                    id="client-search"
                    placeholder="Ex: Amadou, Diallo, +221 77, client-1"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="border-slate-300 placeholder:text-slate-400 focus:ring-primary"
                  />
                </div>

                {filteredClients.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">
                      {filteredClients.length} client(s) trouvé(s)
                    </p>
                    <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                      {filteredClients.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedClientId(c.id);
                            setClientSearch('');
                          }}
                          className="w-full text-left p-4 rounded-lg border border-slate-200 bg-white hover:bg-gradient-to-r hover:from-highlight hover:to-accent hover:border-sidebar-border transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-primary-foreground">{c.firstName} {c.lastName}</p>
                              <p className="text-sm text-slate-600 group-hover:text-secondary">{c.phone}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center">
                              <span className="text-secondary font-semibold">→</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : clientSearch.length > 0 ? (
                  <div className="space-y-4 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-2 border-orange-200 text-center">
                    <p className="text-sm text-slate-700">
                      Aucun client trouvé avec "<span className="font-semibold">{clientSearch}</span>"
                    </p>
                    <Button
                      onClick={() => navigate('/clients/add')}
                      className="bg-gradient-to-r from-warning to-destructive hover:from-warning hover:to-destructive text-white font-semibold"
                      size="sm"
                    >
                      Créer un nouveau client
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-600">
                    <p className="text-sm">Tapez pour chercher un client ou cliquez sur la liste ci-dessous</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-xl font-black">Informations de la location</CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Property Name & Type Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="propertyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-900">Nom du bien / Localisation</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Appartement 5B, Rue X"
                            {...field}
                            className="border-slate-300 focus:ring-primary h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-900">Type de bien</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="border-slate-300 focus:ring-primary h-10">
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
                </div>

                {/* Monthly Rent & Start Date Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="monthlyRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-900">Loyer mensuel (FCFA)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1000"
                            placeholder="0"
                            {...field}
                            className="border-slate-300 focus:ring-primary h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-900">Date de début</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="border-slate-300 focus:ring-primary h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Deposit Section */}
                <div className="space-y-4 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
                  <h3 className="font-black text-lg text-amber-900">💰 Caution</h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="depositTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-amber-900">Montant total (FCFA)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1000"
                              placeholder="0"
                              {...field}
                              className="border-amber-300 focus:ring-amber-500 h-10"
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
                          <FormLabel className="text-sm font-semibold text-amber-900">Montant déjà payé (optionnel)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1000"
                              placeholder="0"
                              {...field}
                              className="border-amber-300 focus:ring-amber-500 h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/clients/${clientId}`)}
                    disabled={isLoading}
                    className="border-slate-300 hover:bg-slate-100 font-semibold"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary hover:to-secondary text-white font-bold flex-1"
                  >
                    {isLoading ? '⏳ Création en cours...' : '✨ Créer la location'}
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
