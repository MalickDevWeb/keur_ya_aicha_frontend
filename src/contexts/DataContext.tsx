import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Client, Rental, MonthlyPayment, DashboardStats, PaymentRecord, DepositPayment, PaymentStatus, Document } from '@/lib/types';

import { calculateDashboardStats, generateId } from '@/lib/mockData';
import { fetchClients, createClient as apiCreateClient, updateClient as apiUpdateClient, postPaymentRecord, postDepositPayment, postDocument as apiPostDocument, deleteDocument as apiDeleteDocument } from '@/services/api';
import { ClientDTO } from '@/dto/ClientDTO';
import { addMonths, addDays } from 'date-fns';

// Helper: serialize Client / Rental objects to DTO shape (convert Date -> ISO strings)
function serializeClientForApi(input: Partial<Client>): Partial<ClientDTO> {
  const out: any = { ...input };
  if (input.createdAt instanceof Date) out.createdAt = input.createdAt.toISOString();

  if (Array.isArray(input.rentals)) {
    out.rentals = input.rentals.map(r => {
      const rental: any = { ...r };
      if (r.startDate instanceof Date) rental.startDate = r.startDate.toISOString();

      if (r.deposit) {
        rental.deposit = {
          total: r.deposit.total,
          paid: r.deposit.paid,
          payments: (r.deposit.payments || []).map(p => ({
            ...p,
            date: (p.date instanceof Date) ? p.date.toISOString() : p.date,
          })),
        };
      }

      if (Array.isArray(r.payments)) {
        rental.payments = r.payments.map(p => ({
          ...p,
          periodStart: (p.periodStart instanceof Date) ? p.periodStart.toISOString() : (p as any).periodStart,
          periodEnd: (p.periodEnd instanceof Date) ? p.periodEnd.toISOString() : (p as any).periodEnd,
          dueDate: (p.dueDate instanceof Date) ? p.dueDate.toISOString() : (p as any).dueDate,
          payments: (p.payments || []).map(rec => ({
            ...rec,
            date: (rec.date instanceof Date) ? rec.date.toISOString() : rec.date,
          })),
        }));
      }

      if (Array.isArray(r.documents)) {
        rental.documents = r.documents.map(d => ({
          ...d,
          uploadedAt: (d.uploadedAt instanceof Date) ? d.uploadedAt.toISOString() : (d as any).uploadedAt,
        }));
      }

      return rental;
    });
  }

  return out;
}

interface DataContextType {
  clients: Client[];
  stats: DashboardStats;

  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'rentals'> & { rental: Omit<Rental, 'id' | 'clientId' | 'payments' | 'documents'> }) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  archiveClient: (id: string) => Promise<void>;
  blacklistClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;
  addRental: (clientId: string, rental: Omit<Rental, 'id' | 'clientId' | 'payments' | 'documents'>) => Promise<void>;
  addMonthlyPayment: (rentalId: string, paymentId: string, amount: number) => Promise<void>;
  addDepositPayment: (rentalId: string, amount: number) => Promise<void>;
  addDocument: (clientId: string, rentalId: string, doc: { name: string; type: 'contract' | 'receipt' | 'other'; signed?: boolean; file?: File | null }) => Promise<void>;
  deleteDocument: (clientId: string, rentalId: string, docId: string) => Promise<void>;
  refreshStats: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<DashboardStats>(() => calculateDashboardStats([]));

  const reloadClients = useCallback(async () => {
    try {
      const dtos: ClientDTO[] = await fetchClients();
      const parsed = dtos.map(d => transformClientDTO(d));
      setClients(parsed);
      setStats(calculateDashboardStats(parsed));
    } catch (e) {
      console.error('Failed to load clients from API', e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await reloadClients();
    })();
    return () => { mounted = false; };
  }, [reloadClients]);

  function transformClientDTO(dto: ClientDTO): Client {
    return {
      id: dto.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      cni: dto.cni || '',
      status: (dto.status as any) || 'active',
      createdAt: new Date(dto.createdAt),
      rentals: (dto.rentals || []).map(r => ({
        id: r.id,
        clientId: r.clientId,
        propertyType: (r.propertyType as any) || 'other',
        propertyName: r.propertyName,
        monthlyRent: r.monthlyRent,
        startDate: new Date(r.startDate),
        deposit: r.deposit || { total: 0, paid: 0, payments: [] },
        payments: r.payments || [],
        documents: (r.documents || []).map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          url: doc.url,
          uploadedAt: new Date(doc.uploadedAt),
          signed: !!doc.signed,
        })),
      })),
    } as Client;
  }

  const refreshStats = useCallback(() => {
    setStats(calculateDashboardStats(clients));
  }, [clients]);

  const addClient = useCallback(async (
    clientData: Omit<Client, 'id' | 'createdAt' | 'rentals'> & { rental: Omit<Rental, 'id' | 'clientId' | 'payments' | 'documents'> }
  ): Promise<Client> => {
    const clientId = generateId();
    const rentalId = generateId();
    const startDate = clientData.rental.startDate;
    const monthlyRent = clientData.rental.monthlyRent;

    const initialPayment: MonthlyPayment = {
      id: generateId(),
      rentalId,
      periodStart: startDate,
      periodEnd: addDays(addMonths(startDate, 1), -1),
      dueDate: addDays(addMonths(startDate, 1), 4),
      amount: monthlyRent,
      paidAmount: 0,
      status: 'unpaid',
      payments: [],
    };

    const rental: Rental = {
      id: rentalId,
      clientId,
      propertyType: clientData.rental.propertyType,
      propertyName: clientData.rental.propertyName,
      monthlyRent: monthlyRent,
      startDate: clientData.rental.startDate,
      deposit: clientData.rental.deposit,
      payments: [initialPayment],
      documents: [],
    };

    const newClient: Client = {
      id: clientId,
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      phone: clientData.phone,
      cni: clientData.cni,
      status: clientData.status,
      createdAt: new Date(),
      rentals: [rental],
    };

    try {
      const payload = serializeClientForApi({ ...newClient, createdAt: newClient.createdAt });
      await apiCreateClient(payload as any);
      await reloadClients();
    } catch (e) {
      console.error('Failed to create client via API', e);
      throw e;
    }

    return newClient;
  }, [reloadClients]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>): Promise<void> => {
    try {
      const payload = serializeClientForApi(data);
      await apiUpdateClient(id, payload as any);
      await reloadClients();
    } catch (e) {
      console.error('Failed to update client via API', e);
      throw e;
    }
  }, [reloadClients]);

  const archiveClient = useCallback(async (id: string): Promise<void> => {
    await updateClient(id, { status: 'archived' });
  }, [updateClient]);

  const blacklistClient = useCallback(async (id: string): Promise<void> => {
    await updateClient(id, { status: 'blacklisted' });
  }, [updateClient]);

  const getClient = useCallback((id: string): Client | undefined => {
    return clients.find(c => c.id === id);
  }, [clients]);

  const addRental = useCallback(async (clientId: string, rentalData: Omit<Rental, 'id' | 'clientId' | 'payments' | 'documents'>): Promise<void> => {
    const rentalId = generateId();
    const initialPayment: MonthlyPayment = {
      id: generateId(),
      rentalId,
      periodStart: rentalData.startDate,
      periodEnd: addDays(addMonths(rentalData.startDate, 1), -1),
      dueDate: addDays(addMonths(rentalData.startDate, 1), 4),
      amount: rentalData.monthlyRent,
      paidAmount: 0,
      status: 'unpaid',
      payments: [],
    };

    const rental: Rental = {
      id: rentalId,
      clientId,
      ...rentalData,
      payments: [initialPayment],
      documents: [],
    };

    try {
      const existing = clients.find(c => c.id === clientId);
      const newRentals = existing ? [...existing.rentals, rental] : [rental];
      await updateClient(clientId, { rentals: newRentals });
    } catch (e) {
      console.error('Failed to add rental via API', e);
      throw e;
    }
  }, [clients, updateClient]);

  const addMonthlyPayment = useCallback(async (rentalId: string, paymentId: string, amount: number): Promise<void> => {
    try {
      await postPaymentRecord(rentalId, paymentId, amount);
      await reloadClients();
    } catch (e) {
      console.error('Failed to post payment record via API', e);
      throw e;
    }
  }, [reloadClients]);

  const addDepositPayment = useCallback(async (rentalId: string, amount: number): Promise<void> => {
    try {
      await postDepositPayment(rentalId, amount);
      await reloadClients();
    } catch (e) {
      console.error('Failed to post deposit via API', e);
      throw e;
    }
  }, [reloadClients]);

  const addDocument = useCallback(async (clientId: string, rentalId: string, doc: { name: string; type: 'contract' | 'receipt' | 'other'; signed?: boolean; file?: File | null }): Promise<void> => {
    try {
      const payload: any = {
        name: doc.name,
        type: doc.type,
        url: doc.file ? '' : (doc as any).url || '',
        signed: !!doc.signed,
        uploadedAt: new Date().toISOString(),
      };
      await apiPostDocument(payload);
      await reloadClients();
    } catch (e) {
      console.error('Failed to post document via API', e);
      throw e;
    }
  }, [reloadClients]);

  const deleteDocument = useCallback(async (clientId: string, rentalId: string, docId: string): Promise<void> => {
    try {
      await apiDeleteDocument(docId);
      await reloadClients();
    } catch (e) {
      console.error('Failed to delete document via API', e);
      throw e;
    }
  }, [reloadClients]);

  return (
    <DataContext.Provider value={{ clients, stats, addClient, updateClient, archiveClient, blacklistClient, getClient, addRental, addMonthlyPayment, addDepositPayment, addDocument, deleteDocument, refreshStats }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
