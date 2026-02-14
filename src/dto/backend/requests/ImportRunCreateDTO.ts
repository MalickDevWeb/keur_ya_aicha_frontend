/**
 * DTO pour créer une exécution d'importation
 */
export interface ImportRunCreateDTO {
  filename: string
  totalRecords: number
  successCount?: number
  failureCount?: number
  status?: 'pending' | 'processing' | 'completed' | 'failed'
}

/**
 * DTO pour mettre à jour une exécution d'importation
 */
export interface ImportRunUpdateDTO {
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  successCount?: number
  failureCount?: number
  completedAt?: string
}
