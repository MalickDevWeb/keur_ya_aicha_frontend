import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Filter, X, RotateCcw } from 'lucide-react';
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
import { useI18n } from '@/lib/i18n';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function Archive() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { clients } = useData();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get archived and blacklisted clients
  const archivedClients = useMemo(() => {
    return clients.filter(c => c.status === 'archived' || c.status === 'blacklisted');
  }, [clients]);

  // Filter clients
  const filteredClients = useMemo(() => {
    return archivedClients.filter((client) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        client.firstName.toLowerCase().includes(searchLower) ||
        client.lastName.toLowerCase().includes(searchLower) ||
        client.phone.includes(search) ||
        client.cni.includes(search);

      // Type filter
      const matchesType = typeFilter === 'all' || client.status === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [archivedClients, search, typeFilter]);

  const clearFilters = () => {
    setTypeFilter('all');
  };

  const hasActiveFilters = typeFilter !== 'all';

  const stats = {
    archived: archivedClients.filter(c => c.status === 'archived').length,
    blacklisted: archivedClients.filter(c => c.status === 'blacklisted').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Archivage & Blacklist</h1>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clients Archivés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.archived}</div>
            <p className="text-xs text-muted-foreground mt-1">Inactifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blacklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.blacklisted}</div>
            <p className="text-xs text-muted-foreground mt-1">Bloqués</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher par nom, téléphone, CNI..."
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
                  1
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="archived">Archivés</SelectItem>
                  <SelectItem value="blacklisted">Blacklist</SelectItem>
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
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>CNI</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Archivé</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium">{client.lastName}</TableCell>
                      <TableCell>{client.firstName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.phone}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.cni}
                      </TableCell>
                      <TableCell>
                        {client.status === 'archived' ? (
                          <Badge variant="outline" className="bg-gray-100">
                            Archivé
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-600">
                            Blacklist
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {client.rentals.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(client.createdAt), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/clients/${client.id}`)}
                            title="Voir le dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Restaurer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucun client archivé ou blacklisté
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredClients.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Affichage de {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
