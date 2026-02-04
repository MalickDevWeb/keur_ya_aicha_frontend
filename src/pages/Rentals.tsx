import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Plus, Filter, X, Grid3x3, List } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Get all rentals from clients
  const allRentals = useMemo(() => {
    const rentals: RentalWithClient[] = [];
    clients.forEach((client) => {
      // Valider que le client a un prénom et nom valides
      if (!client.firstName || !client.lastName) {
        console.warn('⚠️ Client sans nom valide ignoré:', client.id);
        return;
      }

      client.rentals.forEach((rental) => {
        // Valider que la location a un nom
        if (!rental.propertyName) {
          console.warn('⚠️ Location sans nom ignorée:', rental.id);
          return;
        }

        const clientName = `${client.firstName} ${client.lastName}`.trim();

        // Ignorer si le nom du client est vide
        if (!clientName || clientName === ' ') {
          console.warn('⚠️ Location avec client invalide ignorée');
          return;
        }

        rentals.push({
          ...rental,
          clientName: clientName,
          clientId: client.id,
        });
      });
    });
    return rentals.filter(r => r.clientName && r.propertyName && r.clientId);
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

  const getPropertyTypeColor = (type: string) => {
    switch (type) {
      case 'apartment': return 'bg-blue-600';
      case 'studio': return 'bg-purple-600';
      case 'room': return 'bg-pink-600';
      case 'villa': return 'bg-emerald-600';
      case 'house': return 'bg-amber-600';
      case 'shop': return 'bg-orange-600';
      case 'office': return 'bg-cyan-600';
      case 'other': return 'bg-slate-600';
      default: return 'bg-blue-600';
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
            <div className="flex gap-2 border-l pl-4">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                title="Vue en cartes"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                title="Vue en liste"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
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
          {filteredRentals.length > 0 ? (
            viewMode === 'cards' ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredRentals.map((rental) => {
                  const depositStatus = calculateDepositStatus(rental.deposit);
                  const depositProgress = (rental.deposit.paid / rental.deposit.total) * 100;
                  return (
                    <Card key={rental.id} className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-0" onClick={() => navigate(`/clients/${rental.clientId}`)}>
                      {/* Header with property type */}
                      <div className={`bg-gradient-to-br p-6 text-white relative overflow-hidden ${
                        rental.propertyType === 'villa' ? 'from-emerald-900 to-emerald-800' :
                        rental.propertyType === 'apartment' ? 'from-blue-900 to-blue-800' :
                        rental.propertyType === 'studio' ? 'from-purple-900 to-purple-800' :
                        'from-slate-900 to-slate-800'
                      }`}>
                        {/* Decorative blob */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform" />

                        <div className="relative z-10">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex-1">
                              <Badge className={`${getPropertyTypeColor(rental.propertyType)} mb-3`}>
                                {getPropertyTypeLabel(rental.propertyType)}
                              </Badge>
                              <h3 className="font-black text-2xl text-white">{rental.propertyName}</h3>
                              <p className="text-slate-200 font-semibold mt-1">{rental.clientName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-black text-white">{formatCurrency(rental.monthlyRent)}</p>
                              <p className="text-xs text-slate-300">/mois</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="p-6 space-y-5">
                        {/* Date info grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-600 uppercase tracking-wider font-bold mb-1">Début</p>
                            <p className="font-semibold text-sm text-slate-900">{format(new Date(rental.startDate), 'dd/MM/yyyy')}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-600 uppercase tracking-wider font-bold mb-1">ID</p>
                            <p className="font-mono text-xs font-semibold text-slate-900 break-all">{rental.id}</p>
                          </div>
                        </div>

                        {/* Deposit progress */}
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-amber-700 uppercase tracking-wider font-bold">Caution</p>
                            <span className="text-sm font-bold text-amber-900">
                              {formatCurrency(rental.deposit.paid)} / {formatCurrency(rental.deposit.total)}
                            </span>
                          </div>
                          <div className="w-full bg-amber-200 rounded-full h-3 overflow-hidden mb-3">
                            <div
                              className={cn(
                                'h-full transition-all rounded-full font-bold flex items-center justify-center text-xs text-white',
                                depositProgress === 100
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : depositProgress > 0
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                                    : 'bg-gradient-to-r from-red-500 to-rose-500'
                              )}
                              style={{ width: `${depositProgress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <BadgeStatut status={depositStatus} size="sm" />
                            <p className="text-sm font-black text-amber-900">{Math.round(depositProgress)}%</p>
                          </div>
                        </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-slate-200">
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${rental.clientId}`);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rentals/${rental.id}/edit`);
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Modifier
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            ) : (
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
                    {filteredRentals.map((rental) => {
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
                                onClick={() => navigate(`/clients/${rental.clientId}`)}
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
                    })}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Aucune location trouvée</p>
              <Button onClick={() => navigate('/rentals/add')}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une location
              </Button>
            </div>
          )}

          {filteredRentals.length > 0 && (
            <div className="mt-6 pt-6 border-t text-sm text-muted-foreground text-center">
              Affichage de <span className="font-semibold">{filteredRentals.length}</span> location{filteredRentals.length > 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
