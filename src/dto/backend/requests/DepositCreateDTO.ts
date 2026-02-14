/**
 * DTO pour créer un dépôt
 */
export interface DepositCreateDTO {
  amount: number
  date: string
  description?: string
}

/**
 * DTO pour mettre à jour un dépôt (réexport de DepositUpdateDTO)
 */
export { DepositUpdateDTO } from './DepositUpdateDTO'
