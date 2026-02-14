/**
 * DTO pour les items de travail
 */
export interface WorkItemDTO {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  assignee?: string
  createdAt?: string
  updatedAt?: string
}
