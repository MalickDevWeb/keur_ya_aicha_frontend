import type { AdminPaymentDTO, AdminPaymentStatusDTO } from '@/dto/frontend/responses'
import type { AdminPaymentCreateDTO } from '@/dto/frontend/requests'
import { createCrudEndpoint } from './endpoint.factory'
import { apiFetch } from '../http'

const adminPaymentsApi = createCrudEndpoint<AdminPaymentDTO, AdminPaymentCreateDTO, Partial<AdminPaymentCreateDTO>>(
  '/admin_payments',
  'Paiements admin'
)

export async function listAdminPayments(): Promise<AdminPaymentDTO[]> {
  return adminPaymentsApi.list()
}

export async function createAdminPayment(data: AdminPaymentCreateDTO): Promise<AdminPaymentDTO> {
  return adminPaymentsApi.create(data)
}

export async function getAdminPaymentStatus(adminId?: string): Promise<AdminPaymentStatusDTO> {
  const query = adminId ? `?adminId=${encodeURIComponent(adminId)}` : ''
  return apiFetch<AdminPaymentStatusDTO>(`/admin_payments/status${query}`)
}
