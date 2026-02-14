import type { Client } from '@/lib/types'
import type { ClientDTO } from '@/dto/backend/responses'
import { normalizeClientStatus, normalizePropertyType } from './normalizers'

export function transformClientDTO(dto: ClientDTO): Client {
  const firstName = dto.firstName && typeof dto.firstName === 'string' ? dto.firstName.trim() : ''
  const lastName = dto.lastName && typeof dto.lastName === 'string' ? dto.lastName.trim() : ''

  return {
    id: dto.id,
    adminId: dto.adminId,
    firstName,
    lastName,
    phone: dto.phone || '',
    email: dto.email || '',
    cni: dto.cni || '',
    status: normalizeClientStatus(dto.status),
    createdAt: new Date(dto.createdAt),
    rentals: (dto.rentals || []).map((r) => ({
      id: r.id,
      clientId: r.clientId,
      propertyType: normalizePropertyType(r.propertyType),
      propertyName: r.propertyName || 'Bien inconnu',
      monthlyRent: r.monthlyRent || 0,
      startDate: new Date(r.startDate),
      deposit: r.deposit || { total: 0, paid: 0, payments: [] },
      payments: (r.payments || []).filter((p: { id?: string; amount?: unknown }) => {
        if (!p.id || p.amount === undefined || p.amount === null) {
          return false
        }
        return true
      }),
      documents: (r.documents || []).map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        uploadedAt: new Date(doc.uploadedAt),
        signed: !!doc.signed,
      })),
    })),
  } as Client
}
