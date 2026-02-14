/**
 * DTO pour créer un paiement
 */
export interface PaymentCreateDTO {
  amount: number
  date: string
  receiptNumber?: string
  description?: string
}

/**
 * DTO pour mettre à jour un paiement (réexport de PaymentUpdateDTO)
 */
export { PaymentUpdateDTO } from './PaymentUpdateDTO'
