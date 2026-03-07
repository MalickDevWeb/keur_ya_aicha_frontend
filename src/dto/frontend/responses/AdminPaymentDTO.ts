export interface AdminPaymentDTO {
  id: string
  adminId: string
  entrepriseId?: string
  amount: number
  method: 'wave' | 'orange_money' | 'cash'
  status?: 'pending' | 'paid' | 'failed' | 'cancelled'
  provider?: 'stripe' | 'wave' | 'orange' | 'manual'
  providerReference?: string
  checkoutUrl?: string
  payerPhone?: string
  transactionRef?: string
  note?: string
  paidAt?: string | null
  month: string
  approvedAt?: string | null
  approvedBy?: string | null
  createdAt?: string
}

export interface AdminPaymentStatusDTO {
  adminId: string
  blocked: boolean
  overdueMonth: string | null
  dueAt: string | null
  requiredMonth: string
  currentMonth: string
  graceDays: number
  subscriptionMode?: 'monthly' | 'premium' | 'annual'
  expectedAmount?: number
  allowCustomAmount?: boolean
  recipientName?: string
  waveRecipientPhone?: string
  waveEnabled?: boolean
  waveMode?: 'manual' | 'api'
  waveApiConfigured?: boolean
  orangeRecipientPhone?: string
  orangeMoneyEnabled?: boolean
  orangeMoneyMode?: 'manual' | 'api'
  orangeMoneyApiConfigured?: boolean
  orangeOtpEnabled?: boolean
  manualValidationEnabled?: boolean
}
