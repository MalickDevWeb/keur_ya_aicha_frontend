import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Client, Rental, MonthlyPayment, DashboardStats, PaymentRecord, DepositPayment, PaymentStatus, Document } from '@/lib/types';

import { mockClients, calculateDashboardStats, generateId } from '@/lib/mockData';
import { fetchClients, createClient as apiCreateClient, updateClient as apiUpdateClient, postPaymentRecord, postDepositPayment, postDocument as apiPostDocument, deleteDocument as apiDeleteDocument } from '@/services/api';
import { ClientDTO } from '@/dto/ClientDTO';
import { addMonths, addDays } from 'date-fns';

interface DataContextType {
  clients: Client[];
  stats: DashboardStats;

  // Client operations
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'rentals'> & { rental: Omit<Rental, 'id' | 'clientId' | 'payments' | 'documents'> }) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  archiveClient: (id: string) => void;
  blacklistClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;

  // Rental operations
  addRental: (clientId: string, rental: Omit<Rental, 'id' | 'clientId' | 'payments' | 'documents'>) => void;

  // Payment operations
  addMonthlyPayment: (rentalId: string, paymentId: string, amount: number) => void;
  addDepositPayment: (rentalId: string, amount: number) => void;
  // Document operations
  addDocument: (clientId: string, rentalId: string, doc: { name: string; type: 'contract' | 'receipt' | 'other'; signed?: boolean; file?: File | null }) => void;
  deleteDocument: (clientId: string, rentalId: string, docId: string) => void;

  // Refresh stats
  refreshStats: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [stats, setStats] = useState<DashboardStats>(() => calculateDashboardStats(mockClients));

  // If Vite env VITE_USE_API=true, fetch clients from API on mount
  const useApi = (import.meta as any).env?.VITE_USE_API === 'true';

  const reloadClients = React.useCallback(async () => {
    try {
      const dtos: ClientDTO[] = await fetchClients();
      const parsed = dtos.map(d => transformClientDTO(d));
      setClients(parsed);
      setStats(calculateDashboardStats(parsed));
    } catch (e) {
      console.error('Failed to load clients from API', e);
    }
  }, []);

  React.useEffect(() => {
    if (!useApi) return;
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await reloadClients();
    })();
    return () => { mounted = false; };
  }, [reloadClients, useApi]);

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

  const addClient = useCallback((
    clientData: Omit<Client, 'id' | 'createdAt' | 'rentals'> & {
      rental: Omit<Rental, 'id' | 'clientId' | 'payments' | 'documents'>
    }
  ): Client => {
    const clientId = generateId();
    const rentalId = generateId();

    // Generate initial monthly payments
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
      monthlyRent: clientData.rental.monthlyRent,
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

    if (useApi) {
      (async () => {
        try {
          await apiCreateClient({
            id: newClient.id,
            firstName: newClient.firstName,
            lastName: newClient.lastName,
            phone: newClient.phone,
            cni: newClient.cni,
            status: newClient.status,
            createdAt: newClient.createdAt.toISOString(),
            rentals: newClient.rentals.map(r => ({
              id: r.id,
              clientId: r.clientId,
              propertyType: r.propertyType,
              propertyName: r.propertyName,
              monthlyRent: r.monthlyRent,
              startDate: r.startDate.toISOString(),
              deposit: r.deposit,
              payments: r.payments,
              documents: r.documents,
            })),
          });
          await reloadClients();
        } catch (e) {
          console.error('Failed to create client via API', e);
        }
      })();
      return newClient;
    }

    setClients(prev => {
      const updated = [...prev, newClient];
      setStats(calculateDashboardStats(updated));
      return updated;
    });

    return newClient;
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    if (useApi) {
      (async () => {
        try {
          await apiUpdateClient(id, {
            ...data,
            createdAt: (data.createdAt as any)?.toISOString?.() || undefined,
          } as any);
          await reloadClients();
        } catch (e) {
          console.error('Failed to update client via API', e);
        }
      })();
      return;
    }

    setClients(prev => {
      const updated = prev.map(client =>
        client.id === id ? { ...client, ...data } : client
      );
      setStats(calculateDashboardStats(updated));
      return updated;
    });
  }, []);

  const archiveClient = useCallback((id: string) => {
    updateClient(id, { status: 'archived' });
  }, [updateClient]);

  const blacklistClient = useCallback((id: string) => {
    updateClient(id, { status: 'blacklisted' });
  }, [updateClient]);

  const getClient = useCallback((id: string): Client | undefined => {
    return clients.find(c => c.id === id);
  }, [clients]);

  const addRental = useCallback((
    clientId: string,
    rentalData: Omit<Rental, 'id' | 'clientId' | 'payments' | 'documents'>
  ) => {
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

    setClients(prev => {
      const updated = prev.map(client =>
        client.id === clientId
          ? { ...client, rentals: [...client.rentals, rental] }
          : client
      );
      setStats(calculateDashboardStats(updated));
      return updated;
    });
  }, []);

  const addMonthlyPayment = useCallback((rentalId: string, paymentId: string, amount: number) => {
    if (useApi) {
      (async () => {
        try {
          await postPaymentRecord(rentalId, paymentId, amount);
          await reloadClients();
        } catch (e) {
          console.error('Failed to post payment record via API', e);
        }
      })();
      return;
    }

    setClients(prev => {
      const updated: Client[] = prev.map(client => ({
        ...client,
        rentals: client.rentals.map(rental => {
          if (rental.id !== rentalId) return rental;

          return {
            ...rental,
            payments: rental.payments.map(payment => {
              if (payment.id !== paymentId) return payment;

              const newPaidAmount = Math.min(payment.paidAmount + amount, payment.amount);
              const newStatus: PaymentStatus = newPaidAmount >= payment.amount ? 'paid' : 'partial';
              const paymentRecord: PaymentRecord = {
                id: generateId(),
                amount,
                date: new Date(),
                receiptNumber: `REC-${new Date().toISOString().slice(0, 7).replace('-', '')}-${generateId().slice(0, 6).toUpperCase()}`,
              };

              return {
                ...payment,
                paidAmount: newPaidAmount,
                status: newStatus,
                payments: [...payment.payments, paymentRecord],
              };
            }),
          };
        }),
      }));

      setStats(calculateDashboardStats(updated));
      return updated;
    });
  }, []);

  const addDepositPayment = useCallback((rentalId: string, amount: number) => {
    if (useApi) {
      // adding rental via API requires updating client; we'll send a PUT with new rental appended
      (async () => {
        try {
          const client = clients.find(c => c.id === clientId);
          if (!client) return;
          const updatedRentals = [...client.rentals, rental].map(r => ({
            ...r,
            startDate: (r.startDate as any)?.toISOString?.() || new Date().toISOString(),
          }));
          await apiUpdateClient(clientId, { rentals: updatedRentals as any } as any);
          await reloadClients();
        } catch (e) {
      (async () => {
        try {
          await postDepositPayment(rentalId, amount);
          await reloadClients();
        } catch (e) {
          console.error('Failed to post deposit via API', e);
        }
      })();
      return;
    }

    setClients(prev => {
      const updated = prev.map(client => ({
        ...client,
        rentals: client.rentals.map(rental => {
          if (rental.id !== rentalId) return rental;

          const newPaid = Math.min(rental.deposit.paid + amount, rental.deposit.total);
          const depositPayment: DepositPayment = {
            id: generateId(),
            amount,
            date: new Date(),
            receiptNumber: `DEP-${new Date().toISOString().slice(0, 7).replace('-', '')}-${generateId().slice(0, 6).toUpperCase()}`,
          };

          return {
            ...rental,
            deposit: {
              ...rental.deposit,
              paid: newPaid,
              payments: [...rental.deposit.payments, depositPayment],
            },
          };
        }),
      }));

      setStats(calculateDashboardStats(updated));
      return updated;
        }),
      }));

      setStats(calculateDashboardStats(updated));
      return updated;
    });
  }, []);

  const addDocument = useCallback((clientId: string, rentalId: string, doc: { name: string; type: 'contract' | 'receipt' | 'other'; signed?: boolean; file?: File | null }) => {
    if (useApi) {
      (async () => {
        try {
          // For simplicity, post document metadata. file handling can be added later.
          const payload: any = {
            name: doc.name,
            type: doc.type,
            url: doc.file ? '' : (doc as any).url || '',
            signed: !!doc.signed,
          };
          await apiPostDocument(payload);
          await reloadClients();
        } catch (e) {
          console.error('Failed to post document via API', e);
        }
      })();
      return;
    }

    setClients(prev => {
      const updated = prev.map(client => {
        if (client.id !== clientId) return client;

        return {
          ...client,
          rentals: client.rentals.map(rental => {
            if (rental.id !== rentalId) return rental;

            const id = generateId();
            const url = doc.file ? URL.createObjectURL(doc.file) : (doc as any).url || '';
            const newDoc: Document = {
              id,
              name: doc.name,
              type: doc.type,
              url,
              uploadedAt: new Date(),
              signed: !!doc.signed,
            };

            return {
              ...rental,
              documents: [...(rental.documents || []), newDoc],
            };
          }),
        };
      });

      setStats(calculateDashboardStats(updated));
      return updated;
    });
  }, []);

  const deleteDocument = useCallback((clientId: string, rentalId: string, docId: string) => {
    if (useApi) {
      (async () => {
        try {
          await apiDeleteDocument(docId);
          await reloadClients();
        } catch (e) {
          console.error('Failed to delete document via API', e);
        }
      })();
      return;
    }

    setClients(prev => {
      const updated = prev.map(client => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          rentals: client.rentals.map(rental => {
            if (rental.id !== rentalId) return rental;
            return {
              ...rental,
              documents: (rental.documents || []).filter(d => d.id !== docId),
            };
          }),
        };
      });
      setStats(calculateDashboardStats(updated));
      return updated;
    });
  }, []);

  return (
    <DataContext.Provider
      value={{
        clients,
        stats,
        addClient,
        updateClient,
        archiveClient,
        blacklistClient,
        getClient,
        addRental,
        addMonthlyPayment,
        addDepositPayment,
        addDocument,
        deleteDocument,
        refreshStats,
      }}
    >
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
