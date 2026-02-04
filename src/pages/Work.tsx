import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { formatDate } from 'date-fns';
import { getWorkItems, postWorkItem, updateWorkItem, deleteWorkItem } from '@/services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface WorkItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate?: string;
  autoDetected?: boolean; // Mark auto-detected tasks
}

export function Work() {
  const navigate = useNavigate();
  const { clients } = useData();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load work items from JSON server
  const loadWorkItems = async () => {
    try {
      const data = await getWorkItems();
      setWorkItems(data);
    } catch (e) {
      console.error('Erreur de chargement des travaux', e);
    } finally {
      setLoading(false);
    }
  };

  // Save work item to JSON server
  const saveWorkItem = async (item: WorkItem) => {
    try {
      await updateWorkItem(item.id, item);
      return true;
    } catch (e) {
      console.error('Erreur de sauvegarde du travail', e);
      return false;
    }
  };

  // Delete work item from JSON server
  const deleteWorkItemFromServer = async (id: string) => {
    try {
      await deleteWorkItem(id);
      return true;
    } catch (e) {
      console.error('Erreur de suppression du travail', e);
      return false;
    }
  };

  // Create work item on JSON server
  const createWorkItem = async (item: WorkItem) => {
    try {
      await postWorkItem(item);
      return true;
    } catch (e) {
      console.error('Erreur de création du travail', e);
      return false;
    }
  };

  // Load on mount
  useEffect(() => {
    loadWorkItems();
  }, []);

  // Detect problems in clients and rentals
  const detectProblems = (): WorkItem[] => {
    const detectedTasks: WorkItem[] = [];
    const taskSet = new Set<string>();

    // Check for invalid clients (missing firstName or lastName)
    const invalidClients = clients.filter(c => !c.firstName?.trim() || !c.lastName?.trim());
    if (invalidClients.length > 0) {
      const taskId = `invalid-clients-${invalidClients.length}`;
      if (!taskSet.has(taskId)) {
        detectedTasks.push({
          id: taskId,
          title: `🔴 Corriger ${invalidClients.length} client(s) invalide(s)`,
          description: `${invalidClients.length} client(s) ont un nom ou prénom manquant. Cliquez pour consulter la liste des clients.`,
          priority: 'high',
          status: 'pending',
          createdAt: new Date().toISOString(),
          autoDetected: true,
        });
        taskSet.add(taskId);
      }
    }

    // Check for unpaid or partial payments (overdue)
    const overduePayments = clients
      .flatMap(c =>
        c.rentals?.flatMap(r =>
          (r.payments || [])
            .filter(p => {
              const dueDate = new Date(p.dueDate);
              return (p.status === 'unpaid' || p.status === 'partial') && dueDate < new Date();
            })
            .map(p => ({ client: c, rental: r, payment: p }))
        ) || []
      );

    if (overduePayments.length > 0) {
      const taskId = `overdue-payments-${overduePayments.length}`;
      if (!taskSet.has(taskId)) {
        detectedTasks.push({
          id: taskId,
          title: `⚠️ ${overduePayments.length} paiement(s) en retard`,
          description: `${overduePayments.length} paiement(s) mensuel(s) n'ont pas été payés à la date d'échéance.`,
          priority: 'high',
          status: 'pending',
          createdAt: new Date().toISOString(),
          autoDetected: true,
        });
        taskSet.add(taskId);
      }
    }

    // Check for rentals without contracts
    const rentalsWithoutContracts = clients
      .flatMap(c =>
        (c.rentals || [])
          .filter(r => !r.documents || r.documents.filter(d => d.type === 'contract').length === 0)
          .map(r => ({ client: c, rental: r }))
      );

    if (rentalsWithoutContracts.length > 0) {
      const taskId = `missing-contracts-${rentalsWithoutContracts.length}`;
      if (!taskSet.has(taskId)) {
        detectedTasks.push({
          id: taskId,
          title: `📋 ${rentalsWithoutContracts.length} location(s) sans contrat`,
          description: `${rentalsWithoutContracts.length} location(s) n'ont pas de contrat signé.`,
          priority: 'high',
          status: 'pending',
          createdAt: new Date().toISOString(),
          autoDetected: true,
        });
        taskSet.add(taskId);
      }
    }

    // Check for unsigned contracts
    const unsignedContracts = clients
      .flatMap(c =>
        (c.rentals || [])
          .flatMap(r =>
            (r.documents || [])
              .filter(d => d.type === 'contract' && !d.signed)
              .map(() => ({ client: c, rental: r }))
          )
      );

    if (unsignedContracts.length > 0) {
      const taskId = `unsigned-contracts-${unsignedContracts.length}`;
      if (!taskSet.has(taskId)) {
        detectedTasks.push({
          id: taskId,
          title: `✍️ ${unsignedContracts.length} contrat(s) à signer`,
          description: `${unsignedContracts.length} contrat(s) n'ont pas été signés.`,
          priority: 'medium',
          status: 'pending',
          createdAt: new Date().toISOString(),
          autoDetected: true,
        });
        taskSet.add(taskId);
      }
    }

    return detectedTasks;
  };

  // Load work items from JSON server and merge with detected tasks
  useEffect(() => {
    async function load() {
      try {
        const savedItems = await getWorkItems();

        // Detect problems
        const detected = detectProblems();

        // Merge: keep user-created items and add newly detected items
        const userItems = savedItems.filter(item => !item.autoDetected);
        const existingDetectedIds = new Set(savedItems.filter(item => item.autoDetected).map(item => item.id));
        const newDetectedItems = detected.filter(item => !existingDetectedIds.has(item.id));

        setWorkItems([...userItems, ...savedItems.filter(item => item.autoDetected && !newDetectedItems.some(d => d.id === item.id)), ...newDetectedItems]);
      } catch (e) {
        console.error('Error loading work items:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clients]);

  const handleAddWork = async () => {
    if (!newTitle.trim()) return;

    const newWork: WorkItem = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDescription,
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      autoDetected: false,
    };

    const success = await createWorkItem(newWork);
    if (success) {
      setWorkItems([newWork, ...workItems]);
      setNewTitle('');
      setNewDescription('');
    } else {
      alert('Erreur lors de la création du travail');
    }
  };

  const handleToggleStatus = async (id: string) => {
    const updated = workItems.map(item =>
      item.id === id
        ? {
            ...item,
            status: (item.status === 'completed' ? 'pending' : 'completed') as 'pending' | 'in-progress' | 'completed',
          }
        : item
    );

    const itemToUpdate = updated.find(item => item.id === id);
    if (itemToUpdate && !itemToUpdate.autoDetected) {
      const success = await saveWorkItem(itemToUpdate);
      if (success) {
        setWorkItems(updated);
      }
    }
  };

  const handleDeleteWork = async (id: string) => {
    const item = workItems.find(item => item.id === id);
    if (!item?.autoDetected) {
      const success = await deleteWorkItemFromServer(id);
      if (success) {
        setWorkItems(workItems.filter(item => item.id !== id));
      }
    } else {
      setWorkItems(workItems.filter(item => item.id !== id));
    }
  };

  const handleNavigateToFix = (item: WorkItem) => {
    if (!item.autoDetected) return;

    // Navigate based on task type
    if (item.id.includes('missing-contracts')) {
      navigate('/documents?filter=missing-contracts');
    } else if (item.id.includes('unsigned-contracts')) {
      navigate('/documents?filter=unsigned-contracts');
    } else if (item.id.includes('invalid-clients')) {
      navigate('/clients?filter=invalid');
    } else if (item.id.includes('overdue-payments')) {
      navigate('/payments?filter=overdue');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">✓ Complété</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-600">En cours</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const pendingCount = workItems.filter(item => item.status === 'pending').length;
  const completedCount = workItems.filter(item => item.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">📋 Travaux à faire</h1>
            <p className="text-muted-foreground">Gérez les tâches et travaux de maintenance</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowGuide(!showGuide)}>
          {showGuide ? 'Masquer le guide' : '❓ Guide d\'utilisation'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Complétés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add New Work */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ajouter un travail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input
              placeholder="Titre du travail..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Input
              placeholder="Description (optionnel)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Button
              className="w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-600"
              onClick={handleAddWork}
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Work List */}
      {workItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Liste des travaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">État</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workItems.map(item => (
                    <TableRow key={item.id} className={item.status === 'completed' ? 'opacity-60' : ''}>
                      <TableCell>
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className="hover:scale-110 transition-transform"
                        >
                          {item.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.autoDetected ? (
                          <button
                            onClick={() => handleNavigateToFix(item)}
                            className="text-blue-600 hover:underline cursor-pointer"
                          >
                            {item.title}
                          </button>
                        ) : (
                          item.title
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.description}</TableCell>
                      <TableCell>
                        <Badge className={`${getPriorityColor(item.priority)} text-white`}>
                          {item.priority === 'high'
                            ? 'Haute'
                            : item.priority === 'medium'
                              ? 'Moyenne'
                              : 'Basse'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {item.autoDetected && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNavigateToFix(item)}
                            >
                              🔧 Corriger
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteWork(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {workItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun travail enregistré. Ajoutez-en un ci-dessus!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
