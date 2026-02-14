import type { WorkItem, WorkPriority, WorkStatus } from './types'
import type { Client } from '@/lib/types'

const nowIso = () => new Date().toISOString()

export const detectWorkItems = (clients: Client[]): WorkItem[] => {
  const detectedTasks: WorkItem[] = []
  const taskSet = new Set<string>()

  const invalidClients = clients.filter((client) => !client.firstName?.trim() || !client.lastName?.trim())
  if (invalidClients.length > 0) {
    const taskId = `invalid-clients-${invalidClients.length}`
    if (!taskSet.has(taskId)) {
      detectedTasks.push({
        id: taskId,
        title: `🔴 Corriger ${invalidClients.length} client(s) invalide(s)`,
        description: `${invalidClients.length} client(s) ont un nom ou prénom manquant. Cliquez pour consulter la liste des clients.`,
        priority: 'high',
        status: 'pending',
        createdAt: nowIso(),
        autoDetected: true,
      })
      taskSet.add(taskId)
    }
  }

  const overduePayments = clients
    .flatMap((client) =>
      (client.rentals || []).flatMap((rental) =>
        (rental.payments || [])
          .filter((payment) => {
            const dueDate = new Date(payment.dueDate)
            return (payment.status === 'unpaid' || payment.status === 'partial') && dueDate < new Date()
          })
          .map((payment) => ({ client, rental, payment }))
      )
    )

  if (overduePayments.length > 0) {
    const taskId = `overdue-payments-${overduePayments.length}`
    if (!taskSet.has(taskId)) {
      detectedTasks.push({
        id: taskId,
        title: `⚠️ ${overduePayments.length} paiement(s) en retard`,
        description: `${overduePayments.length} paiement(s) mensuel(s) n'ont pas été payés à la date d'échéance.`,
        priority: 'high',
        status: 'pending',
        createdAt: nowIso(),
        autoDetected: true,
      })
      taskSet.add(taskId)
    }
  }

  const rentalsWithoutContracts = clients
    .flatMap((client) =>
      (client.rentals || [])
        .filter((rental) => !rental.documents || rental.documents.filter((doc) => doc.type === 'contract').length === 0)
        .map((rental) => ({ client, rental }))
    )

  if (rentalsWithoutContracts.length > 0) {
    const taskId = `missing-contracts-${rentalsWithoutContracts.length}`
    if (!taskSet.has(taskId)) {
      detectedTasks.push({
        id: taskId,
        title: `📋 ${rentalsWithoutContracts.length} location(s) sans contrat`,
        description: `${rentalsWithoutContracts.length} location(s) n'ont pas de contrat signé.`,
        priority: 'high',
        status: 'pending',
        createdAt: nowIso(),
        autoDetected: true,
      })
      taskSet.add(taskId)
    }
  }

  const unsignedContracts = clients
    .flatMap((client) =>
      (client.rentals || []).flatMap((rental) =>
        (rental.documents || [])
          .filter((doc) => doc.type === 'contract' && !doc.signed)
          .map(() => ({ client, rental }))
      )
    )

  if (unsignedContracts.length > 0) {
    const taskId = `unsigned-contracts-${unsignedContracts.length}`
    if (!taskSet.has(taskId)) {
      detectedTasks.push({
        id: taskId,
        title: `✍️ ${unsignedContracts.length} contrat(s) à signer`,
        description: `${unsignedContracts.length} contrat(s) n'ont pas été signés.`,
        priority: 'medium',
        status: 'pending',
        createdAt: nowIso(),
        autoDetected: true,
      })
      taskSet.add(taskId)
    }
  }

  return detectedTasks
}

export const mergeWorkItems = (savedItems: WorkItem[], detected: WorkItem[]) => {
  const userItems = savedItems.filter((item) => !item.autoDetected)
  const existingDetectedIds = new Set(savedItems.filter((item) => item.autoDetected).map((item) => item.id))
  const newDetectedItems = detected.filter((item) => !existingDetectedIds.has(item.id))

  return [
    ...userItems,
    ...savedItems.filter((item) => item.autoDetected && !newDetectedItems.some((detectedItem) => detectedItem.id === item.id)),
    ...newDetectedItems,
  ]
}

export const buildNewWorkItem = (title: string, description: string): WorkItem => ({
  id: Date.now().toString(),
  title,
  description,
  priority: 'medium',
  status: 'pending',
  createdAt: nowIso(),
  autoDetected: false,
})

export const toggleWorkStatus = (status: WorkStatus): WorkStatus =>
  status === 'completed' ? 'pending' : 'completed'

export const getPriorityBadgeClass = (priority: WorkPriority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'low':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
}

export const getStatusLabel = (status: WorkStatus) => {
  switch (status) {
    case 'completed':
      return '✓ Complété'
    case 'in-progress':
      return 'En cours'
    case 'pending':
      return 'En attente'
    default:
      return 'Inconnu'
  }
}

export const getPriorityLabel = (priority: WorkPriority) => {
  switch (priority) {
    case 'high':
      return 'Haute'
    case 'medium':
      return 'Moyenne'
    case 'low':
      return 'Basse'
    default:
      return 'Inconnu'
  }
}
