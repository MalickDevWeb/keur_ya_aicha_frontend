export interface DocumentCreateDTO {
  id?: string
  name: string
  type?: 'contract' | 'receipt' | 'other'
  url: string
  uploadedAt?: string
  signed?: boolean
}
