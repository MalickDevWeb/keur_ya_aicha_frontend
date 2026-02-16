export interface AdminPaymentCreateDTO {
  id?: string
  adminId?: string
  entrepriseId?: string
  amount: number
  method: 'wave' | 'orange_money' | 'cash'
  provider?: 'stripe' | 'wave' | 'orange' | 'manual'
  payerPhone?: string
  transactionRef?: string
  note?: string
  paidAt?: string
  month?: string
  createdAt?: string
}
