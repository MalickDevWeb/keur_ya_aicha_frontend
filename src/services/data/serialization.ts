import type { ClientDTO } from '@/dto/backend/responses'
import type { Client } from '@/lib/types'
import { toIsoString } from './normalizers'

export function serializeClientForApi(input: Partial<Client>): Partial<ClientDTO> {
  const out: Record<string, unknown> = { ...input }
  if (input.createdAt instanceof Date) out.createdAt = input.createdAt.toISOString()

  if (Array.isArray(input.rentals)) {
    out.rentals = input.rentals.map((r) => {
      const rental: Record<string, unknown> = { ...r }
      if (r.startDate instanceof Date) rental.startDate = r.startDate.toISOString()

      if (r.deposit) {
        rental.deposit = {
          total: r.deposit.total,
          paid: r.deposit.paid,
          payments: (r.deposit.payments || []).map((p) => ({
            ...p,
            date: toIsoString(p.date),
          })),
        }
      }

      if (Array.isArray(r.payments)) {
        rental.payments = r.payments.map((p) => ({
          ...p,
          periodStart: toIsoString((p as { periodStart?: unknown }).periodStart),
          periodEnd: toIsoString((p as { periodEnd?: unknown }).periodEnd),
          dueDate: toIsoString((p as { dueDate?: unknown }).dueDate),
          payments: (p.payments || []).map((rec) => ({
            ...rec,
            date: toIsoString(rec.date),
          })),
        }))
      }

      if (Array.isArray(r.documents)) {
        rental.documents = r.documents.map((d) => ({
          ...d,
          uploadedAt: toIsoString((d as { uploadedAt?: unknown }).uploadedAt),
        }))
      }

      return rental
    })
  }

  return out as Partial<ClientDTO>
}
