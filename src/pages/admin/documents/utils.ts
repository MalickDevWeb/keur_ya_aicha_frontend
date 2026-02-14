import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { DocumentFilter, DocumentGroup, DocumentRow, DocumentType } from './types'

const DOCUMENT_TYPE_LABELS: Record<DocumentType, { label: string; icon: string }> = {
  contract: { label: 'Contrats', icon: '📋' },
  receipt: { label: 'Reçus', icon: '🧾' },
  other: { label: 'Autres documents', icon: '📎' },
}

export const formatDocumentDate = (date: string | Date) =>
  format(new Date(date), 'dd MMM yyyy', { locale: fr })

export const getDocumentTypeMeta = (type: DocumentType) => DOCUMENT_TYPE_LABELS[type]

const isEmpty = (value: string | undefined | null) => !value || value.trim().length === 0

type DocumentSource = {
  id: string
  name: string
  type: DocumentType
  signed: boolean
  url?: string
  uploadedAt: string
}

type RentalSource = {
  id: string
  propertyName?: string
  documents?: DocumentSource[]
}

type ClientSource = {
  id: string
  firstName?: string
  lastName?: string
  rentals?: RentalSource[]
}

export const buildDocumentsList = (clients: ClientSource[]): DocumentRow[] => {
  const docs: DocumentRow[] = []

  for (const client of clients) {
    if (isEmpty(client.firstName) || isEmpty(client.lastName)) continue
    const clientName = `${client.firstName} ${client.lastName}`.trim()

    for (const rental of client.rentals ?? []) {
      if (isEmpty(rental.propertyName)) continue
      for (const doc of rental.documents ?? []) {
        docs.push({
          id: doc.id,
          clientId: client.id,
          clientName,
          rentalId: rental.id,
          rentalName: rental.propertyName,
          name: doc.name,
          type: doc.type,
          signed: doc.signed,
          url: doc.url,
          uploadedAt: doc.uploadedAt,
        })
      }
    }
  }

  return docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
}

export const buildMissingContracts = (clients: ClientSource[]): DocumentRow[] => {
  const missing: DocumentRow[] = []

  for (const client of clients) {
    if (isEmpty(client.firstName) || isEmpty(client.lastName)) continue
    const clientName = `${client.firstName} ${client.lastName}`.trim()

    for (const rental of client.rentals ?? []) {
      if (isEmpty(rental.propertyName)) continue
      const hasContract = (rental.documents ?? []).some((doc) => doc.type === 'contract')
      if (hasContract) continue

      missing.push({
        id: `missing-${rental.id}`,
        clientId: client.id,
        rentalId: rental.id,
        name: `[MANQUANT] Contrat - ${rental.propertyName}`,
        type: 'contract',
        signed: false,
        url: '',
        clientName,
        rentalName: rental.propertyName,
        uploadedAt: new Date().toISOString(),
        isMissing: true,
      })
    }
  }

  return missing
}

export const filterDocuments = (
  docs: DocumentRow[],
  clients: Array<{ id: string; firstName?: string; lastName?: string; phone?: string }>,
  searchQuery: string,
  filterType: DocumentFilter
) => {
  if (filterType === 'unsigned-contracts') {
    return docs.filter((doc) => doc.type === 'contract' && !doc.signed)
  }

  if (!searchQuery.trim()) return docs

  const needle = searchQuery.toLowerCase()

  return docs.filter((doc) => {
    const client = clients.find((c) => c.id === doc.clientId)
    if (!client) return false
    const fullName = `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim().toLowerCase()
    const phone = (client.phone || '').toLowerCase()

    return (
      fullName.includes(needle) ||
      phone.includes(needle) ||
      doc.clientName.toLowerCase().includes(needle) ||
      doc.rentalName.toLowerCase().includes(needle) ||
      doc.name.toLowerCase().includes(needle)
    )
  })
}

export const groupDocumentsByType = (docs: DocumentRow[]): DocumentGroup[] => {
  const groups: Record<DocumentType, DocumentRow[]> = {
    contract: [],
    receipt: [],
    other: [],
  }

  for (const doc of docs) {
    groups[doc.type].push(doc)
  }

  return (Object.keys(groups) as DocumentType[]).map((type) => ({
    type,
    ...DOCUMENT_TYPE_LABELS[type],
    items: groups[type],
  }))
}
