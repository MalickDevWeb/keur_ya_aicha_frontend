import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Plus, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/SearchInput';
import { BadgeStatut } from '@/components/BadgeStatut';
import { useI18n } from '@/lib/i18n';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { formatCurrency, calculateDepositStatus, Rental } from '@/lib/types';
import { format } from 'date-fns';

interface RentalWithClient extends Rental {
  clientName: string;
  clientId: string;
}

export default function Rentals() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { clients } = useData();

  const [search, setSearch] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get all rentals from clients
  const allRentals = useMemo(() => {
    const rentals: RentalWithClient[] = [];
    clients.forEach((client) => {
      client.rentals.forEach((rental) => {
        rentals.push({
          ...rental,
          clientName: `${client.firstName} ${client.lastName}`,
          clientId: client.id,
        });
      });
    });
    return rentals;
  }, [clients]);

  // Filter rentals
  const filteredRentals = useMemo(() => {
    return allRentals.filter((rental) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        rental.clientName.toLowerCase().includes(searchLower) ||
        rental.propertyName.toLowerCase().includes(searchLower) ||
        rental.propertyType.toLowerCase().includes(searchLower);

      // Property type filter
      const matchesType = propertyTypeFilter === 'all' || rental.propertyType === propertyTypeFilter;

      // Status filter (based on deposit payment status)
      const depositStatus = calculateDepositStatus(rental.deposit);
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = depositStatus !== 'paid' || rental.deposit.paid < rental.deposit.total;
      } else if (statusFilter === 'completed') {
        matchesStatus = depositStatus === 'paid' && rental.deposit.paid >= rental.deposit.total;
      } else if (statusFilter === 'archived') {
        matchesStatus = false; // Archived rentals are not shown
      }

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [allRentals, search, propertyTypeFilter, statusFilter]);

  const clearFilters = () => {
    setPropertyTypeFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = propertyTypeFilter !== 'all' || statusFilter !== 'all';

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case 'apartment': return 'Appartement';
      case 'studio': return 'Studio';
      case 'room': return 'Chambre';
      case 'villa': return 'Villa';
      case 'house': return 'Maison';
      case 'shop': return 'Commerce';
      case 'office': return 'Bureau';
      case 'other': return 'Autre';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Locations</h1>
        <Button
          onClick={() => navigate('/clients')}
          className="bg-secondary hover:bg-secondary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une location
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher par client, bien..."
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-muted')}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {(propertyTypeFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type de bien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="apartment">Appartement</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="room">Chambre</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="house">Maison</SelectItem>
                  <SelectItem value="shop">Commerce</SelectItem>
                  <SelectItem value="office">Bureau</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Caution non soldée</SelectItem>
                  <SelectItem value="completed">Caution soldée</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="col-full sm:col-span-2"
                >
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Bien</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Loyer</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Caution</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRentals.length > 0 ? (
                  filteredRentals.map((rental) => {
                    const depositStatus = calculateDepositStatus(rental.deposit);
                    return (
                      <TableRow
                        key={rental.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">{rental.clientName}</TableCell>
                        <TableCell className="text-sm">
                          {rental.propertyName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {getPropertyTypeLabel(rental.propertyType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(rental.monthlyRent)} FCFA
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(rental.startDate), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className={depositStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}>
                              {formatCurrency(rental.deposit.paid)} / {formatCurrency(rental.deposit.total)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/rentals/${rental.id}`)}
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/rentals/${rental.id}/edit`)}
                              title="Éditer"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Aucune location trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredRentals.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Affichage de {filteredRentals.length} location
              {filteredRentals.length > 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
