/**
 * DTO pour les exécutions d'importation
 */
export interface ImportRunDTO {
  id: string
  filename: string
  totalRecords: number
  successCount: number
  failureCount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt?: string
  updatedAt?: string
  completedAt?: string
}
