import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/stores/dataStore';
import type { Client, PropertyType, Rental } from '@/lib/types';
import { useState } from 'react';

export default function EditRental() {
  const { id: rentalId } = useParams();
  const navigate = useNavigate();
  const clients = useStore((state) => state.clients)

  // Find the rental
  type RentalWithAddress = Rental & { address?: string };
  let rental: RentalWithAddress | null = null;
  let client: Client | null = null;

  for (const c of clients) {
    const r = c.rentals.find(rental => rental.id === rentalId);
    if (r) {
      rental = r;
      client = c;
      break;
    }
  }

  const [formData, setFormData] = useState<{
    propertyName: string;
    propertyType: PropertyType;
    monthlyRent: number;
    address: string;
  }>({
    propertyName: rental?.propertyName || '',
    propertyType: rental?.propertyType || 'apartment',
    monthlyRent: rental?.monthlyRent || 0,
    address: rental?.address || '',
  });

  if (!rental || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Location non trouvée</p>
        <Button variant="outline" onClick={() => navigate('/rentals')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monthlyRent' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement rental update
    navigate(`/rentals/${rentalId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/rentals/${rentalId}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Éditer la location: {rental.propertyName}
          </h1>
          <p className="text-muted-foreground">
            Client: {client.firstName} {client.lastName}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de la location</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Name */}
            <div className="space-y-2">
              <Label htmlFor="propertyName">Nom du bien</Label>
              <Input
                id="propertyName"
                name="propertyName"
                value={formData.propertyName}
                onChange={handleInputChange}
                placeholder="Ex: Appartement A1"
              />
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <Label htmlFor="propertyType">Type de bien</Label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="apartment">Appartement</option>
                <option value="studio">Studio</option>
                <option value="villa">Maison</option>
                <option value="room">Chambre</option>
              </select>
            </div>

            {/* Monthly Rent */}
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Loyer mensuel (FCFA)</Label>
              <Input
                id="monthlyRent"
                name="monthlyRent"
                type="number"
                value={formData.monthlyRent}
                onChange={handleInputChange}
                placeholder="150000"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Ex: Rue 15, Plateau"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="bg-secondary hover:bg-secondary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/rentals/${rentalId}`)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
