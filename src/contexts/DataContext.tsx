import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Client, Rental, MonthlyPayment, DashboardStats, PaymentRecord, DepositPayment, PaymentStatus } from '@/lib/types';

import { mockClients, calculateDashboardStats, generateId } from '@/lib/mockData';
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

    setClients(prev => {
      const updated = [...prev, newClient];
      setStats(calculateDashboardStats(updated));
      return updated;
    });

    return newClient;
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
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
