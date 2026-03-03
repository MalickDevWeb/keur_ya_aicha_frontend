import type { WorkItem, WorkPriority, WorkStatus } from './types'
import type { Client } from '@/lib/types'

const nowIso = () => new Date().toISOString()

type WorkImportRun = {
  errors?: unknown[]
  ignored?: boolean
}

type WorkSubscriptionStatus = {
  blocked?: boolean
  overdueMonth?: string | null
  dueAt?: string | null
  requiredMonth?: string
  currentMonth?: string
  subscriptionMode?: 'monthly' | 'premium' | 'annual'
}

type WorkDetectionOptions = {
  now?: Date
  importRuns?: WorkImportRun[]
  subscriptionStatus?: WorkSubscriptionStatus | null
}

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000
const CRITICAL_PAYMENT_DELAY_DAYS = 30
const DEPOSIT_ALERT_DAYS = 14

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / MILLIS_PER_DAY)
}

function hasMeaningfulPropertyName(value: string | undefined): boolean {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return false
  return !['non renseigné', 'bien inconnu', 'n/a', 'na'].includes(normalized)
}

function pushDetectedTask(
  tasks: WorkItem[],
  taskSet: Set<string>,
  task: Omit<WorkItem, 'status' | 'createdAt' | 'autoDetected'>
): void {
  if (taskSet.has(task.id)) return
  tasks.push({
    ...task,
    status: 'pending',
    createdAt: nowIso(),
    autoDetected: true,
  })
  taskSet.add(task.id)
}

export const detectWorkItems = (clients: Client[], options: WorkDetectionOptions = {}): WorkItem[] => {
  const detectedTasks: WorkItem[] = []
  const taskSet = new Set<string>()
  const now = isValidDate(options.now) ? options.now : new Date()

  const invalidClients = clients.filter((client) => !client.firstName?.trim() || !client.lastName?.trim())
  if (invalidClients.length > 0) {
    pushDetectedTask(detectedTasks, taskSet, {
      id: 'invalid-clients',
      title: `🔴 Corriger ${invalidClients.length} client(s) invalide(s)`,
      description: `${invalidClients.length} client(s) ont un nom ou prénom manquant. Cliquez pour consulter la liste des clients.`,
      priority: 'high',
    })
  }

  const clientsWithoutRentals = clients.filter((client) => !Array.isArray(client.rentals) || client.rentals.length === 0)
  if (clientsWithoutRentals.length > 0) {
    pushDetectedTask(detectedTasks, taskSet, {
      id: 'clients-without-rentals',
      title: `🏠 ${clientsWithoutRentals.length} client(s) sans location`,
      description: `${clientsWithoutRentals.length} client(s) actifs n'ont aucune location associée.`,
      priority: 'medium',
    })
  }

  const overduePayments = clients
    .flatMap((client) =>
      (client.rentals || []).flatMap((rental) =>
        (rental.payments || [])
          .filter((payment) => {
            const dueDate = new Date(payment.dueDate)
            if (Number.isNaN(dueDate.getTime())) return false
            return (payment.status === 'unpaid' || payment.status === 'partial' || payment.status === 'late') && dueDate < now
          })
          .map((payment) => ({ payment }))
      )
    )

  if (overduePayments.length > 0) {
    pushDetectedTask(detectedTasks, taskSet, {
      id: 'overdue-payments',
      title: `⚠️ ${overduePayments.length} paiement(s) en retard`,
      description: `${overduePayments.length} paiement(s) mensuel(s) n'ont pas été réglés à échéance.`,
      priority: 'high',
    })
  }

  const criticalOverdueCount = overduePayments.filter(({ payment }) => {
    const dueDate = new Date(payment.dueDate)
    return !Number.isNaN(dueDate.getTime()) && daysBetween(dueDate, now) >= CRITICAL_PAYMENT_DELAY_DAYS
  }).length

  if (criticalOverdueCount > 0) {
    pushDetectedTask(detectedTasks, taskSet, {
      id: 'critical-overdue-payments',
      title: `🚨 ${criticalOverdueCount} paiement(s) en retard critique`,
      description: `${criticalOverdueCount} paiement(s) ont plus de ${CRITICAL_PAYMENT_DELAY_DAYS} jours de retard.`,
      priority: 'high',
    })
  }

  const incompleteRentals = clients.flatMap((client) =>
    (client.rentals || []).filter((rental) => !hasMeaningfulPropertyName(rental.propertyName))
  )
  if (incompleteRentals.length > 0) {
    pushDetectedTask(detectedTasks, taskSet, {
      id: 'incomplete-rentals',
      title: `🧩 ${incompleteRentals.length} location(s) incomplète(s)`,
      description: `${incompleteRentals.length} location(s) n'ont pas de bien renseigné correctement.`,
      priority: 'high',
    })
  }

  const rentalsWithoutContracts = clients.flatMap((client) =>
    (client.rentals || []).filter((rental) => {
      const contracts = (rental.documents || []).filter((doc) => doc.type === 'contract')
      return contracts.length === 0
    })
  )
  if (rentalsWithoutContracts.length > 0) {
    pushDetectedTask(detectedTasks, taskSet, {
      id: 'missing-contracts',
      title: `📋 ${rentalsWithoutContracts.length} location(s) sans contrat`,
      description: `${rentalsWithoutContracts.length} location(s) n'ont aucun contrat.`,
      priority: 'high',
    })
  }

  const unsignedContracts = clients.flatMap((client) =>
    (client.rentals || []).flatMap((rental) =>
      (rental.documents || []).filter((doc) => doc.type === 'contract' && !doc.signed)
    )
  )
  if (unsignedContracts.length > 0) {
    pushDetectedTask(detectedTasks, taskSet, {
      id: 'unsigned-contracts',
      title: `✍️ ${unsignedContracts.length} contrat(s) à signer`,
      description: `${unsignedContracts.length} contrat(s) existent mais ne sont pas signés.`,
      priority: 'medium',
    })
  }

  const rentalsWithUnpaidDeposit = clients.flatMap((client) =>
    (client.rentals || []).filter((rental) => {
      const total = Number(rental.deposit?.total || 0)
      const paid = Number(rental.deposit?.paid || 0)
      return total > paid
    })
  )
  if (rentalsWithUnpaidDeposit.length > 0) {
    pushDetectedTask(detectedTasks, taskSet, {
      id: 'unpaid-deposits',
      title: `💰 ${rentalsWithUnpaidDeposit.length} caution(s) non soldée(s)`,
      description: `${rentalsWithUnpaidDeposit.length} location(s) ont une caution restant à payer.`,
      priority: 'medium',
    })
  }

  const overdueDepositsCount = rentalsWithUnpaidDeposit.filter((rental) => {
    const startDate = new Date(rental.startDate)
    if (Number.isNaN(startDate.getTime())) return false
    return daysBetween(startDate, now) >= DEPOSIT_ALERT_DAYS
  }).length
  if (overdueDepositsCount > 0) {
    pushDetectedTask(detectedTasks, taskSet, {
      id: 'overdue-deposits',
      title: `🚨 ${overdueDepositsCount} caution(s) en retard`,
      description: `${overdueDepositsCount} caution(s) restent impayées depuis plus de ${DEPOSIT_ALERT_DAYS} jours.`,
      priority: 'high',
    })
  }

  const importRuns = Array.isArray(options.importRuns) ? options.importRuns : []
  const importErrorsCount = importRuns.reduce((total, run) => {
    if (run?.ignored) return total
    const errors = Array.isArray(run?.errors) ? run.errors.length : 0
    return total + errors
  }, 0)
  if (importErrorsCount > 0) {
    pushDetectedTask(detectedTasks, taskSet, {
      id: 'import-errors-open',
      title: `🛑 ${importErrorsCount} erreur(s) d'import à corriger`,
      description: `${importErrorsCount} ligne(s) importées en erreur nécessitent une correction.`,
      priority: 'high',
    })
  }

  const subscriptionStatus = options.subscriptionStatus || null
  if (subscriptionStatus) {
    const requiredPeriod = String(subscriptionStatus.requiredMonth || subscriptionStatus.currentMonth || '').trim()
    const overduePeriod = String(subscriptionStatus.overdueMonth || '').trim()
    const mode =
      String(subscriptionStatus.subscriptionMode || '').toLowerCase() === 'annual' ? 'année' : 'mois'
    const targetPeriod = overduePeriod || requiredPeriod
    const shouldAlert = Boolean(subscriptionStatus.blocked) || Boolean(overduePeriod)

    if (shouldAlert && targetPeriod) {
      pushDetectedTask(detectedTasks, taskSet, {
        id: 'admin-subscription-overdue',
        title: `⛔ Abonnement admin en retard (${targetPeriod})`,
        description: `Le ${mode} ${targetPeriod} est dépassé. Renouvelez maintenant pour éviter ou lever les restrictions d'accès.`,
        priority: 'high',
      })
    }
  }

  return sortWorkItems(detectedTasks)
}

export const mergeWorkItems = (savedItems: WorkItem[], detected: WorkItem[]) => {
  const userItems = savedItems.filter((item) => !item.autoDetected)
  return sortWorkItems([...userItems, ...detected])
}

const PRIORITY_RANK: Record<WorkPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

const STATUS_RANK: Record<WorkStatus, number> = {
  pending: 0,
  'in-progress': 1,
  completed: 2,
}

export const sortWorkItems = (items: WorkItem[]): WorkItem[] =>
  [...items].sort((a, b) => {
    const statusDelta = STATUS_RANK[a.status] - STATUS_RANK[b.status]
    if (statusDelta !== 0) return statusDelta

    const priorityDelta = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
    if (priorityDelta !== 0) return priorityDelta

    const aTime = new Date(a.createdAt || 0).getTime()
    const bTime = new Date(b.createdAt || 0).getTime()
    return bTime - aTime
  })

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
