// Types for the rental management application

export type PropertyType = 'studio' | 'room' | 'apartment' | 'villa' | 'other';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'late';

export type ClientStatus = 'active' | 'archived' | 'blacklisted';

export interface Client {
  id: string;
  adminId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  cni: string;
  status: ClientStatus;
  createdAt: Date;
  rentals: Rental[];
}

export interface Rental {
  id: string;
  clientId: string;
  propertyType: PropertyType;
  propertyName: string;
  monthlyRent: number;
  startDate: Date;
  deposit: Deposit;
  payments: MonthlyPayment[];
  documents: Document[];
}

export interface Deposit {
  total: number;
  paid: number;
  payments: DepositPayment[];
}

export interface DepositPayment {
  id: string;
  amount: number;
  date: Date;
  receiptNumber: string;
}

export interface MonthlyPayment {
  id: string;
  rentalId: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date; // periodEnd + 5 days grace period
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
  payments: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: Date;
  receiptNumber: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'contract' | 'receipt' | 'other';
  url: string;
  uploadedAt: Date;
  signed: boolean;
}

// Dashboard statistics
export interface DashboardStats {
  totalClients: number;
  totalRentals: number;
  paidRentals: number;
  unpaidRentals: number;
  partialRentals: number;
  monthlyIncome: number;
}

// Utility function to calculate payment status
export function calculatePaymentStatus(payment: MonthlyPayment): PaymentStatus {
  const now = new Date();
  
  if (payment.paidAmount >= payment.amount) {
    return 'paid';
  }
  
  if (payment.paidAmount > 0) {
    return 'partial';
  }
  
  if (now > payment.dueDate) {
    return 'late';
  }
  
  return 'unpaid';
}

// Calculate overall client status based on rentals
export function calculateClientPaymentStatus(client: Client): PaymentStatus {
  if (client.rentals.length === 0) {
    return 'paid';
  }

  let hasUnpaid = false;
  let hasPartial = false;

  for (const rental of client.rentals) {
    for (const payment of rental.payments) {
      const status = calculatePaymentStatus(payment);
      if (status === 'unpaid' || status === 'late') {
        hasUnpaid = true;
      } else if (status === 'partial') {
        hasPartial = true;
      }
    }
  }

  if (hasUnpaid) return 'unpaid';
  if (hasPartial) return 'partial';
  return 'paid';
}

// Calculate deposit status
export function calculateDepositStatus(deposit: Deposit): PaymentStatus {
  if (deposit.paid >= deposit.total) {
    return 'paid';
  }
  if (deposit.paid > 0) {
    return 'partial';
  }
  return 'unpaid';
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount);
}

// Generate receipt number
export function generateReceiptNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REC-${year}${month}-${random}`;
}
