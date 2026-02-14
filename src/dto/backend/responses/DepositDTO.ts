/**
 * DTO pour les dépôts
 */
export interface DepositDTO {
  id: string
  amount: number
  date: string
  status: 'pending' | 'completed' | 'failed'
  description?: string
  createdAt?: string
  updatedAt?: string
}
