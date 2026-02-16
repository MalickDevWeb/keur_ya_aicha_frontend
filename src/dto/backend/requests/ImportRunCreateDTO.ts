/**
 * DTO pour créer une exécution d'importation
 */
export interface ImportRunCreateDTO {
  id?: string
  adminId?: string
  fileName: string
  totalRows: number
  inserted?: Array<{
    id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
  }>
  errors?: Array<{
    rowNumber: number
    errors: string[]
    parsed: Record<string, unknown>
  }>
  ignored?: boolean
  readSuccess?: boolean
  readErrors?: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * DTO pour mettre à jour une exécution d'importation
 */
export interface ImportRunUpdateDTO {
  fileName?: string
  totalRows?: number
  inserted?: Array<{
    id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
  }>
  errors?: Array<{
    rowNumber: number
    errors: string[]
    parsed: Record<string, unknown>
  }>
  ignored?: boolean
  readSuccess?: boolean
  readErrors?: boolean
  updatedAt?: string
}
