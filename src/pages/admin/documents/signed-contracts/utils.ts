import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type Client = {
  id: string
  firstName?: string
  lastName?: string
  phone?: string
  rentals?: Array<{
    id: string
    propertyName?: string
    monthlyRent?: number
    documents?: Array<{
      id: string
      name: string
      type: string
      signed: boolean
      url?: string
      uploadedAt: string
    }>
  }>
}

export type SignedContractRow = {
  id: string
  clientId: string
  clientName: string
  clientPhone?: string
  rentalId: string
  rentalName: string
  rentalRent?: number
  name: string
  url?: string
  uploadedAt: string
}

export const buildSignedContracts = (clients: Client[]): SignedContractRow[] => {
  const contracts: SignedContractRow[] = []

  for (const client of clients) {
    const clientName = `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim()

    for (const rental of client.rentals ?? []) {
      for (const doc of rental.documents ?? []) {
        if (doc.type !== 'contract' || !doc.signed) continue
        contracts.push({
          id: doc.id,
          clientId: client.id,
          clientName,
          clientPhone: client.phone,
          rentalId: rental.id,
          rentalName: rental.propertyName || '—',
          rentalRent: rental.monthlyRent,
          name: doc.name,
          url: doc.url,
          uploadedAt: doc.uploadedAt,
        })
      }
    }
  }

  return contracts.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
}

export const formatSignedContractDate = (date: string | Date) =>
  format(new Date(date), 'dd MMM yyyy', { locale: fr })

export const formatSignedContractCurrency = (amount?: number) =>
  typeof amount === 'number' ? new Intl.NumberFormat('fr-FR').format(amount) : '—'
