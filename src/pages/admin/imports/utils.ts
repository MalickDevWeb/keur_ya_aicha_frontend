import { normalizeEmailForCompare, normalizePhoneForCompare } from '@/validators/frontend'

type Owner = { id?: string; firstName?: string; lastName?: string; phone?: string; email?: string }

type OwnerMaps = {
  ownerByPhone: Map<string, Owner>
  ownerByEmail: Map<string, Owner>
}

// Import error types
export type ParsedRow = {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  cni?: string
  propertyType?: string
  propertyName?: string
  startDate?: string | Date
  monthlyRent?: number
  depositTotal?: number
  depositPaid?: number
  status?: string
  _duplicateOwner?: Owner
  [key: string]: unknown
}

export type StoredErrors = {
  id: string
  createdAt: string
  fileName: string
  totalRows: number
  inserted: Array<{
    id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
  }>
  errors: Array<{ rowNumber: number; errors: string[]; parsed: ParsedRow }>
  ignored: boolean
}

export const buildDuplicateLookup = (
  clients: Array<{ phone?: string; email?: string }>
): OwnerMaps => {
  const ownerByPhone = new Map<string, Owner>()
  const ownerByEmail = new Map<string, Owner>()

  clients.forEach((client) => {
    const phone = normalizePhoneForCompare(client.phone || '')
    if (phone && !ownerByPhone.has(phone)) ownerByPhone.set(phone, client)

    const email = normalizeEmailForCompare(client.email || '')
    if (email && !ownerByEmail.has(email)) ownerByEmail.set(email, client)
  })

  return { ownerByPhone, ownerByEmail }
}

export const buildDuplicateMessage = (
  kind: 'phone' | 'email',
  key: string,
  owners: Map<string, Owner>
) => {
  const owner = owners.get(key)
  if (!owner) {
    return kind === 'phone'
      ? 'Numéro déjà utilisé (un client existe déjà)'
      : 'Email déjà utilisé (un client existe déjà)'
  }
  const fullName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Client existant'
  const contact = kind === 'phone' ? owner.phone || '—' : owner.email || '—'
  return kind === 'phone'
    ? `Numéro déjà utilisé par ${fullName} (${contact})`
    : `Email déjà utilisé par ${fullName} (${contact})`
}

export const formatBackendError = (
  err: unknown,
  parsed: { phone?: string; email?: string },
  ownerByPhone: Map<string, Owner>,
  ownerByEmail: Map<string, Owner>
) => {
  const message = String((err as { message?: string })?.message || 'Erreur lors de la création')
  if (message.includes('409')) {
    const phone = normalizePhoneForCompare(parsed?.phone || '')
    if (phone && ownerByPhone.has(phone)) return buildDuplicateMessage('phone', phone, ownerByPhone)
    const email = normalizeEmailForCompare(parsed?.email || '')
    if (email && ownerByEmail.has(email)) return buildDuplicateMessage('email', email, ownerByEmail)
    return 'Doublon détecté (numéro/email déjà utilisé)'
  }
  if (message.includes('401')) return 'Non autorisé (session expirée)'
  return message
}
