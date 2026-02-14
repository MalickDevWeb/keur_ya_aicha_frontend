export type WorkPriority = 'low' | 'medium' | 'high'
export type WorkStatus = 'pending' | 'in-progress' | 'completed'

export type WorkItem = {
  id: string
  title: string
  description: string
  priority: WorkPriority
  status: WorkStatus
  createdAt: string
  dueDate?: string
  autoDetected?: boolean
}
