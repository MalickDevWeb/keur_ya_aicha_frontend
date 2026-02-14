export type DocumentType = 'contract' | 'receipt' | 'other'

export type DocumentRow = {
  id: string
  clientId: string
  clientName: string
  rentalId: string
  rentalName: string
  name: string
  type: DocumentType
  signed: boolean
  url?: string
  uploadedAt: string
  isMissing?: boolean
}

export type DocumentGroup = {
  type: DocumentType
  label: string
  icon: string
  items: DocumentRow[]
}

export type DocumentFilter = 'missing-contracts' | 'unsigned-contracts' | ''
