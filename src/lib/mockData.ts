import { Client, Rental, MonthlyPayment, DashboardStats, calculatePaymentStatus, calculateDepositStatus } from './types';
import { addDays, addMonths, subMonths, startOfMonth, format } from 'date-fns';

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Create monthly payments for a rental
function generateMonthlyPayments(rental: Partial<Rental>, monthsCount: number = 6): MonthlyPayment[] {
  const payments: MonthlyPayment[] = [];
  const startDate = rental.startDate || new Date();
  
  for (let i = 0; i < monthsCount; i++) {
    const periodStart = addMonths(startDate, i);
    const periodEnd = addDays(addMonths(periodStart, 1), -1);
    const dueDate = addDays(periodEnd, 5); // 5 days grace period
    
    // Randomize payment status for demo
    let paidAmount = 0;
    const monthlyRent = rental.monthlyRent || 75000;
    
    if (i < monthsCount - 2) {
      // Older months are fully paid
      paidAmount = monthlyRent;
    } else if (i === monthsCount - 2) {
      // Previous month might be partial or paid
      paidAmount = Math.random() > 0.3 ? monthlyRent : Math.floor(monthlyRent * 0.6);
    }
    // Current month starts unpaid
    
    const payment: MonthlyPayment = {
      id: generateId(),
      rentalId: rental.id || '',
      periodStart,
      periodEnd,
      dueDate,
      amount: monthlyRent,
      paidAmount,
      status: 'unpaid',
      payments: paidAmount > 0 ? [{
        id: generateId(),
        amount: paidAmount,
        date: addDays(periodStart, Math.floor(Math.random() * 15)),
        receiptNumber: `REC-${format(periodStart, 'yyyyMM')}-${generateId().substring(0, 6).toUpperCase()}`,
      }] : [],
    };
    
    payment.status = calculatePaymentStatus(payment);
    payments.push(payment);
  }
  
  return payments;
}

// Mock clients data
export const mockClients: Client[] = [
  {
    id: 'client-1',
    firstName: 'Amadou',
    lastName: 'Diallo',
    phone: '+221 77 123 45 67',
    cni: '1234567890123',
    status: 'active',
    createdAt: subMonths(new Date(), 8),
    rentals: [],
  },
  {
    id: 'client-2',
    firstName: 'Fatou',
    lastName: 'Sow',
    phone: '+221 78 234 56 78',
    cni: '2345678901234',
    status: 'active',
    createdAt: subMonths(new Date(), 6),
    rentals: [],
  },
  {
    id: 'client-3',
    firstName: 'Moussa',
    lastName: 'Ndiaye',
    phone: '+221 76 345 67 89',
    cni: '3456789012345',
    status: 'active',
    createdAt: subMonths(new Date(), 4),
    rentals: [],
  },
  {
    id: 'client-4',
    firstName: 'Aissatou',
    lastName: 'Ba',
    phone: '+221 70 456 78 90',
    cni: '4567890123456',
    status: 'active',
    createdAt: subMonths(new Date(), 3),
    rentals: [],
  },
  {
    id: 'client-5',
    firstName: 'Ibrahima',
    lastName: 'Fall',
    phone: '+221 77 567 89 01',
    cni: '5678901234567',
    status: 'archived',
    createdAt: subMonths(new Date(), 12),
    rentals: [],
  },
  {
    id: 'client-6',
    firstName: 'Mariama',
    lastName: 'Diop',
    phone: '+221 78 678 90 12',
    cni: '6789012345678',
    status: 'active',
    createdAt: subMonths(new Date(), 2),
    rentals: [],
  },
  {
    id: 'client-7',
    firstName: 'Ousmane',
    lastName: 'Sarr',
    phone: '+221 76 789 01 23',
    cni: '7890123456789',
    status: 'blacklisted',
    createdAt: subMonths(new Date(), 10),
    rentals: [],
  },
];

// Generate rentals for each client
const rentalsData: { clientId: string; rentals: Partial<Rental>[] }[] = [
  {
    clientId: 'client-1',
    rentals: [
      {
        propertyType: 'apartment',
        propertyName: 'Appartement A1',
        monthlyRent: 150000,
        startDate: subMonths(new Date(), 8),
      },
      {
        propertyType: 'studio',
        propertyName: 'Studio B2',
        monthlyRent: 75000,
        startDate: subMonths(new Date(), 3),
      },
    ],
  },
  {
    clientId: 'client-2',
    rentals: [
      {
        propertyType: 'villa',
        propertyName: 'Villa Palmier',
        monthlyRent: 300000,
        startDate: subMonths(new Date(), 6),
      },
    ],
  },
  {
    clientId: 'client-3',
    rentals: [
      {
        propertyType: 'room',
        propertyName: 'Chambre C1',
        monthlyRent: 50000,
        startDate: subMonths(new Date(), 4),
      },
    ],
  },
  {
    clientId: 'client-4',
    rentals: [
      {
        propertyType: 'studio',
        propertyName: 'Studio A3',
        monthlyRent: 80000,
        startDate: subMonths(new Date(), 3),
      },
    ],
  },
  {
    clientId: 'client-5',
    rentals: [
      {
        propertyType: 'apartment',
        propertyName: 'Appartement B1',
        monthlyRent: 120000,
        startDate: subMonths(new Date(), 12),
      },
    ],
  },
  {
    clientId: 'client-6',
    rentals: [
      {
        propertyType: 'apartment',
        propertyName: 'Appartement C2',
        monthlyRent: 100000,
        startDate: subMonths(new Date(), 2),
      },
      {
        propertyType: 'room',
        propertyName: 'Chambre D1',
        monthlyRent: 45000,
        startDate: subMonths(new Date(), 1),
      },
    ],
  },
  {
    clientId: 'client-7',
    rentals: [
      {
        propertyType: 'villa',
        propertyName: 'Villa Cocotier',
        monthlyRent: 250000,
        startDate: subMonths(new Date(), 10),
      },
    ],
  },
];

// Populate rentals with payments and deposits
rentalsData.forEach(({ clientId, rentals }) => {
  const client = mockClients.find(c => c.id === clientId);
  if (!client) return;

  client.rentals = rentals.map((rentalData, index) => {
    const rental: Rental = {
      id: `${clientId}-rental-${index}`,
      clientId,
      propertyType: rentalData.propertyType || 'apartment',
      propertyName: rentalData.propertyName || 'Unknown',
      monthlyRent: rentalData.monthlyRent || 100000,
      startDate: rentalData.startDate || new Date(),
      deposit: {
        total: (rentalData.monthlyRent || 100000) * 2,
        paid: Math.random() > 0.3 
          ? (rentalData.monthlyRent || 100000) * 2 
          : Math.floor((rentalData.monthlyRent || 100000) * (1 + Math.random())),
        payments: [],
      },
      payments: [],
      documents: [],
    };

    // Add deposit payment records
    if (rental.deposit.paid > 0) {
      rental.deposit.payments = [{
        id: generateId(),
        amount: rental.deposit.paid,
        date: rental.startDate,
        receiptNumber: `DEP-${format(rental.startDate, 'yyyyMM')}-${generateId().substring(0, 6).toUpperCase()}`,
      }];
    }

    // Generate monthly payments
    rental.payments = generateMonthlyPayments(rental);

    return rental;
  });
});

// Calculate dashboard statistics
export function calculateDashboardStats(clients: Client[]): DashboardStats {
  let totalRentals = 0;
  let paidRentals = 0;
  let unpaidRentals = 0;
  let partialRentals = 0;
  let monthlyIncome = 0;

  const currentMonth = startOfMonth(new Date());

  clients.forEach(client => {
    if (client.status === 'archived' || client.status === 'blacklisted') return;

    client.rentals.forEach(rental => {
      totalRentals++;

      // Find current month payment
      const currentPayment = rental.payments.find(p => 
        startOfMonth(p.periodStart).getTime() === currentMonth.getTime()
      );

      if (currentPayment) {
        const status = calculatePaymentStatus(currentPayment);
        if (status === 'paid') {
          paidRentals++;
          monthlyIncome += currentPayment.paidAmount;
        } else if (status === 'partial') {
          partialRentals++;
          monthlyIncome += currentPayment.paidAmount;
        } else {
          unpaidRentals++;
        }
      }
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

export { generateId };
