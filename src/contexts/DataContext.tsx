import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Client, Rental, MonthlyPayment, DashboardStats, PaymentRecord, DepositPayment, PaymentStatus, Document } from '@/lib/types';

import { fetchClients, createClient as apiCreateClient, updateClient as apiUpdateClient, postPaymentRecord, postDepositPayment, postDocument as apiPostDocument, deleteDocument as apiDeleteDocument, uploadToCloudinary } from '@/services/api';
import { ClientDTO } from '@/dto/ClientDTO';
import { addMonths, addDays } from 'date-fns';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Read a File as a data URL (base64) for storing in json-server
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
// Calculate dashboard stats from clients
function calculateDashboardStats(clients: Client[]): DashboardStats {
  let totalRentals = 0;
  let paidRentals = 0;
  let unpaidRentals = 0;
  let partialRentals = 0;
  let monthlyIncome = 0;

  clients.forEach(client => {
    if (client.status === 'archived' || client.status === 'blacklisted') return;
    client.rentals.forEach(rental => {
      totalRentals++;
      // Count based on current status
      rental.payments.forEach(p => {
        if (p.status === 'paid') {
          paidRentals++;
          monthlyIncome += p.paidAmount;
        } else if (p.status === 'partial') {
          partialRentals++;
          monthlyIncome += p.paidAmount;
        } else {
          unpaidRentals++;
        }
      });
    });
  });

  return {
    totalClients: clients.filter(c => c.status === 'active').length,
    totalRentals,
    paidRentals,
    unpaidRentals,
    partialRentals,
    monthlyIncome,
  };
}
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
    console.log('🔄 [DataContext] reloadClients called');
    try {
      const dtos: ClientDTO[] = await fetchClients();
      console.log(`🔄 [DataContext] Loaded ${dtos.length} clients from API`);
      const parsed = dtos.map(d => transformClientDTO(d))
        .filter(client => {
          // Filtrer les clients avec des noms invalides
          if (!client.firstName || !client.lastName) {
            console.warn(`⚠️ [DataContext] Filtered out client with invalid name: ${client.id}`);
            return false;
          }
          return true;
        });

      const invalidCount = dtos.length - parsed.length;
      if (invalidCount > 0) {
        console.warn(`⚠️ [DataContext] Filtered out ${invalidCount} clients with invalid data`);
      }

      setClients(parsed);
      setStats(calculateDashboardStats(parsed));
      console.log('✅ [DataContext] State updated with fetched clients');
    } catch (e) {
      console.error('❌ [DataContext] Failed to load clients from API', e);
    }
  }, []);

  useEffect(() => {
    console.log('🟦 [DataContext] Mounting DataProvider, initial load...');
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await reloadClients();
    })();
    return () => { mounted = false; };
  }, [reloadClients]);

  function transformClientDTO(dto: ClientDTO): Client {
    // Valider les données du client
    const firstName = dto.firstName && typeof dto.firstName === 'string' ? dto.firstName.trim() : '';
    const lastName = dto.lastName && typeof dto.lastName === 'string' ? dto.lastName.trim() : '';

    if (!firstName || !lastName) {
      console.warn(`⚠️ [DataContext] Client ${dto.id} has invalid name:`, { firstName, lastName });
    }

    return {
      id: dto.id,
      firstName: firstName,
      lastName: lastName,
      phone: dto.phone || '',
      cni: dto.cni || '',
      status: (dto.status as any) || 'active',
      createdAt: new Date(dto.createdAt),
      rentals: (dto.rentals || []).map(r => ({
        id: r.id,
        clientId: r.clientId,
        propertyType: (r.propertyType as any) || 'other',
        propertyName: r.propertyName || 'Bien inconnu',
        monthlyRent: r.monthlyRent || 0,
        startDate: new Date(r.startDate),
        deposit: r.deposit || { total: 0, paid: 0, payments: [] },
        payments: (r.payments || []).filter((p: any) => {
          // Valider que chaque paiement a les données essentielles
          if (!p.id || p.amount === undefined || p.amount === null) {
            console.warn(`⚠️ [DataContext] Payment ${p.id} has invalid data:`, p);
            return false;
          }
          return true;
        }),
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
    console.log('🟦 [DataContext] addClient called:', clientData);

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
      console.log('🟦 [DataContext] Creating client with payload:', newClient);
      const payload = serializeClientForApi({ ...newClient, createdAt: newClient.createdAt });
      console.log('🟦 [DataContext] Serialized payload:', payload);
      await apiCreateClient(payload as any);
      console.log('✅ [DataContext] Client created via API');
      await reloadClients();
      console.log('✅ [DataContext] Clients reloaded');
    } catch (e) {
      console.error('❌ [DataContext] Failed to create client via API', e);
      throw e;
    }

    return newClient;
  }, [reloadClients]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>): Promise<void> => {
    console.log('🟦 [DataContext] updateClient called:', { id, data });
    try {
      const payload = serializeClientForApi(data);
      console.log('🟦 [DataContext] Updating client:', { id, payload });
      await apiUpdateClient(id, payload as any);
      console.log('✅ [DataContext] Client updated via API');
      await reloadClients();
      console.log('✅ [DataContext] Clients reloaded after update');
    } catch (e) {
      console.error('❌ [DataContext] Failed to update client via API', e);
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
    console.log('🟦 [DataContext] addRental called:', { clientId, rentalData });
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
      console.log('🟩 [DataContext] Creating rental:', { rentalId, clientId, propertyName: rentalData.propertyName });
      const existing = clients.find(c => c.id === clientId);
      const newRentals = existing ? [...existing.rentals, rental] : [rental];
      await updateClient(clientId, { rentals: newRentals });
      console.log('✅ [DataContext] Rental added successfully');
    } catch (e) {
      console.error('❌ [DataContext] Failed to add rental via API', e);
      throw e;
    }
  }, [clients, updateClient]);

  const addMonthlyPayment = useCallback(async (rentalId: string, paymentId: string, amount: number): Promise<void> => {
    console.log('🟩 [DataContext] addMonthlyPayment called:', { rentalId, paymentId, amount });
    try {
      console.log('🟩 [DataContext] Posting payment record to API...');
      await postPaymentRecord(rentalId, paymentId, amount);
      console.log('✅ [DataContext] Payment recorded via API');
      console.log('🟩 [DataContext] Reloading clients...');
      await reloadClients();
      console.log('✅ [DataContext] Clients reloaded after payment');
    } catch (e) {
      console.error('❌ [DataContext] Failed to post payment record via API', e);
      throw e;
    }
  }, [reloadClients]);

  const addDepositPayment = useCallback(async (rentalId: string, amount: number): Promise<void> => {
    console.log('🟦 [DataContext] addDepositPayment called:', { rentalId, amount });
    try {
      console.log('🟩 [DataContext] Posting deposit payment to API...');
      await postDepositPayment(rentalId, amount);
      console.log('✅ [DataContext] Deposit payment recorded via API');
      await reloadClients();
      console.log('✅ [DataContext] Clients reloaded after deposit');
    } catch (e) {
      console.error('❌ [DataContext] Failed to post deposit via API', e);
      throw e;
    }
  }, [reloadClients]);

  const addDocument = useCallback(async (clientId: string, rentalId: string, doc: { name: string; type: 'contract' | 'receipt' | 'other'; signed?: boolean; file?: File | null }): Promise<void> => {
    console.log('🟦 [DataContext] addDocument called:', { clientId, rentalId, docName: doc.name, docType: doc.type });
    try {
      // Upload file to Cloudinary if provided
      let fileUrl = '';
      if (doc.file) {
        console.log('🟩 [DataContext] Uploading file to Cloudinary...');
        fileUrl = await uploadToCloudinary(doc.file);
        console.log('✅ [DataContext] File uploaded to Cloudinary:', fileUrl);
      }

      const newDoc = {
        id: generateId(),
        name: doc.name,
        type: doc.type,
        url: fileUrl,
        signed: !!doc.signed,
        uploadedAt: new Date().toISOString(),
      } as any;

      // Attach document to the specified client's rental and persist full client
      const client = clients.find(c => c.id === clientId);
      if (!client) throw new Error('Client not found')

      const updatedRentals = client.rentals.map(r => {
        if (r.id !== rentalId) return r;
        return {
          ...r,
          documents: [...(r.documents || []), newDoc],
        };
      });

      console.log('🟩 [DataContext] Persisting document into client object...');
      await updateClient(clientId, { rentals: updatedRentals });
      console.log('✅ [DataContext] Document saved on client rental');
      await reloadClients();
      console.log('✅ [DataContext] Clients reloaded after document upload');
    } catch (e) {
      console.error('❌ [DataContext] Failed to add document', e);
      throw e;
    }
  }, [clients, reloadClients, updateClient]);

  const deleteDocument = useCallback(async (clientId: string, rentalId: string, docId: string): Promise<void> => {
    console.log('🟦 [DataContext] deleteDocument called:', { clientId, rentalId, docId });
    try {
      console.log('🟩 [DataContext] Deleting document from API...');
      await apiDeleteDocument(docId);
      console.log('✅ [DataContext] Document deleted via API');
      await reloadClients();
      console.log('✅ [DataContext] Clients reloaded after document deletion');
    } catch (e) {
      console.error('❌ [DataContext] Failed to delete document via API', e);
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
