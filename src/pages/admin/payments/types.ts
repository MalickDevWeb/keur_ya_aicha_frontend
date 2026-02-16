import type { MonthlyPaymentDTO } from '@/dto/backend/responses/PaymentDTO'

export type ViewMode = 'cards' | 'list'

export type PaymentRow = MonthlyPaymentDTO & {
  clientName: string
  clientId: string
  clientPhone?: string
  rentalId: string
  propertyName: string
  propertyType: string
  monthlyRent: number
}

export type PaymentFilters = {
  search: string
  statusFilter: 'all' | 'paid' | 'partial' | 'unpaid' | 'late'
}

export type PaymentStats = {
  total: number
  paid: number
  partial: number
  unpaid: number
  totalAmount: number
  paidAmount: number
  remainingAmount: number
}

export type ReceiptDocument = {
  payerName: string
  payerPhone?: string
  clientPhone?: string
  amount: number
  uploadedAt: string | Date
  name: string
  note?: string
}
