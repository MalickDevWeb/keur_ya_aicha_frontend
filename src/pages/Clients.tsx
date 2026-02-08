import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Plus, Filter, X, Grid3x3, List, Archive, Upload } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { calculateClientPaymentStatus, PaymentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function Clients() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { clients, updateClient } = useData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        client.firstName.toLowerCase().includes(searchLower) ||
        client.lastName.toLowerCase().includes(searchLower) ||
        client.phone.includes(search) ||
        client.cni.includes(search);

      // Status filter
      const clientStatus = calculateClientPaymentStatus(client);
      const matchesStatus = statusFilter === 'all' || clientStatus === statusFilter;

      // Type filter
      const hasType =
        typeFilter === 'all' ||
        client.rentals.some((r) => r.propertyType === typeFilter);

      return matchesSearch && matchesStatus && hasType && client.status === 'active';
    });
  }, [clients, search, statusFilter, typeFilter]);

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all';

  const handleArchiveClient = (clientId: string) => {
    updateClient(clientId, { status: 'archived' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{t('clients.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/import/clients')}>
            <Upload className="w-4 h-4 mr-2" />
            Importer Excel
          </Button>
          <Button
            onClick={() => navigate('/clients/add')}
            className="bg-secondary hover:bg-secondary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('nav.addClient')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-muted')}
            >
              <Filter className="w-4 h-4 mr-2" />
              {t('filter.status')}
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  2
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
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t mt-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t('filter.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.all')}</SelectItem>
                  <SelectItem value="paid">{t('status.paid')}</SelectItem>
                  <SelectItem value="partial">{t('status.partial')}</SelectItem>
                  <SelectItem value="unpaid">{t('status.unpaid')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t('filter.type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.all')}</SelectItem>
                  <SelectItem value="studio">{t('property.studio')}</SelectItem>
                  <SelectItem value="room">{t('property.room')}</SelectItem>
                  <SelectItem value="apartment">{t('property.apartment')}</SelectItem>
                  <SelectItem value="villa">{t('property.villa')}</SelectItem>
                  <SelectItem value="other">{t('property.other')}</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  {t('common.cancel')}
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('clients.noResults')}
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
              {filteredClients.map((client) => {
                const status = calculateClientPaymentStatus(client);
                const propertyTypes = client.rentals
                  .map((r) => r.propertyType)
                  .filter((v, i, a) => a.indexOf(v) === i);
                const propertyDisplay = propertyTypes
                  .map((type) => t(`property.${type}`))
                  .join(', ');

                return (
                  <Card key={client.id} className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-0" onClick={() => navigate(`/clients/${client.id}`)}>
                    {/* Header with gradient and avatar */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white relative overflow-hidden">
                      {/* Decorative blob */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform" />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1">
                            <h3 className="font-black text-2xl text-white">{client.firstName}</h3>
                            <p className="text-slate-300 font-semibold">{client.lastName}</p>
                          </div>
                          <BadgeStatut status={status} size="sm" />
                        </div>
                        <p className="text-sm text-slate-300">{client.phone}</p>
                      </div>
                    </div>

                    {/* Content with better spacing */}
                    <CardContent className="p-6 space-y-5">
                      {/* Info cards in grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-600 uppercase tracking-wider font-bold mb-1">CNI</p>
                          <p className="font-mono text-sm font-semibold text-slate-900">{client.cni}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-xs text-purple-600 uppercase tracking-wider font-bold mb-1">Locations</p>
                          <p className="text-2xl font-black text-purple-600">{client.rentals.length}</p>
                        </div>
                      </div>

                      {/* Property types */}
                      <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                        <p className="text-xs text-emerald-600 uppercase tracking-wider font-bold mb-2">Types de bien</p>
                        <div className="flex flex-wrap gap-2">
                          {propertyTypes.length > 0 ? (
                            propertyTypes.map((type) => (
                              <Badge key={type} className="bg-emerald-600 hover:bg-emerald-700">
                                {t(`property.${type}`)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-600">Aucun bien</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-slate-200">
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${client.id}`);
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
                            navigate(`/clients/${client.id}/edit`);
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Modifier
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => e.stopPropagation()}
                              title="Archiver le client"
                            >
                              <Archive className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Archiver le client ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir archiver {client.firstName} {client.lastName} ? Cette action peut être annulée en réactivant le client depuis la section des clients archivés.
                            </AlertDialogDescription>
                            <div className="flex justify-end gap-2">
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleArchiveClient(client.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Archiver
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
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
                    <TableHead>{t('clients.name')}</TableHead>
                    <TableHead>{t('clients.firstName')}</TableHead>
                    <TableHead>{t('clients.phone')}</TableHead>
                    <TableHead>{t('addClient.propertyType')}</TableHead>
                    <TableHead className="text-center">{t('clients.rentals')}</TableHead>
                    <TableHead>{t('clients.status')}</TableHead>
                    <TableHead className="text-right">{t('clients.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const status = calculateClientPaymentStatus(client);
                    const propertyTypes = client.rentals
                      .map((r) => r.propertyType)
                      .filter((v, i, a) => a.indexOf(v) === i);
                    const propertyDisplay = propertyTypes
                      .map((type) => t(`property.${type}`))
                      .join(', ');

                    return (
                      <TableRow key={client.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{client.lastName}</TableCell>
                        <TableCell>{client.firstName}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{propertyDisplay}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{client.rentals.length}</Badge>
                        </TableCell>
                        <TableCell>
                          <BadgeStatut status={status} size="sm" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/clients/${client.id}`)}
                              title={t('clients.details')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/clients/${client.id}/edit`)}
                              title={t('clients.edit')}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Archiver le client"
                                >
                                  <Archive className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogTitle>Archiver le client ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir archiver {client.firstName} {client.lastName} ? Cette action peut être annulée en réactivant le client depuis la section des clients archivés.
                                </AlertDialogDescription>
                                <div className="flex justify-end gap-2">
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleArchiveClient(client.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Archiver
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
