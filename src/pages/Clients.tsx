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
import { calculateClientPaymentStatus, PaymentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function Clients() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { clients } = useData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{t('clients.title')}</h1>
        <Button
          onClick={() => navigate('/clients/add')}
          className="bg-secondary hover:bg-secondary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('nav.addClient')}
        </Button>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('clients.name')}</TableHead>
                  <TableHead>{t('clients.firstName')}</TableHead>
                  <TableHead>{t('clients.phone')}</TableHead>
                  <TableHead className="text-center">{t('clients.rentals')}</TableHead>
                  <TableHead>{t('clients.status')}</TableHead>
                  <TableHead className="text-right">{t('clients.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t('clients.noResults')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => {
                    const status = calculateClientPaymentStatus(client);
                    return (
                      <TableRow key={client.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{client.lastName}</TableCell>
                        <TableCell>{client.firstName}</TableCell>
                        <TableCell>{client.phone}</TableCell>
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
                              onClick={() => {
                                console.log('👁️ [Clients] View client details:', {
                                  clientId: client.id,
                                  clientName: `${client.firstName} ${client.lastName}`,
                                });
                                navigate(`/clients/${client.id}`);
                              }}
                              title={t('clients.details')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                console.log('✏️ [Clients] Edit client:', {
                                  clientId: client.id,
                                  clientName: `${client.firstName} ${client.lastName}`,
                                });
                                navigate(`/clients/${client.id}/edit`);
                              }}
                              title={t('clients.edit')}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                console.log('🏠 [Clients] Add rental for client:', {
                                  clientId: client.id,
                                  clientName: `${client.firstName} ${client.lastName}`,
                                });
                                navigate(`/clients/${client.id}/add-rental`);
                              }}
                              title={t('clients.addRental')}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
