import type { PaymentDTO } from '@/dto/backend/responses/PaymentDTO'
import type { PaymentCreateDTO, PaymentUpdateDTO } from '@/dto/backend/requests'
import { createCrudEndpoint } from './endpoint.factory'

/**
 * Endpoint CRUD pour les paiements
 */
const paymentApi = createCrudEndpoint<PaymentDTO, PaymentCreateDTO, PaymentUpdateDTO>(
  '/payments',
  'Paiements'
)

/**
 * Récupère la liste complète des paiements
 * @returns Array de paiements
 */
export async function listPayments(): Promise<PaymentDTO[]> {
  return paymentApi.list()
}

// Backward-compatible name
export async function fetchPayments(): Promise<PaymentDTO[]> {
  return listPayments()
}

/**
 * Récupère un paiement par son ID
 * @param id - ID du paiement
 * @returns Détails du paiement
 */
export async function getPayment(id: string): Promise<PaymentDTO> {
  return paymentApi.getById(id)
}

/**
 * Crée un nouveau paiement
 * @param data - Données du paiement à créer
 * @returns Paiement créé
 */
export async function createPayment(data: PaymentCreateDTO): Promise<PaymentDTO> {
  return paymentApi.create(data)
}

// Backward-compatible name
export async function createPaymentRecord(data: PaymentCreateDTO): Promise<PaymentDTO> {
  return createPayment(data)
}

/**
 * Met à jour un paiement existant
 * @param id - ID du paiement
 * @param data - Données à mettre à jour
 * @returns Paiement mis à jour
 */
export async function updatePayment(id: string, data: PaymentUpdateDTO): Promise<PaymentDTO> {
  return paymentApi.update(id, data)
}

/**
 * Supprime un paiement
 * @param id - ID du paiement à supprimer
 */
export async function deletePayment(id: string): Promise<void> {
  return paymentApi.delete(id)
}
