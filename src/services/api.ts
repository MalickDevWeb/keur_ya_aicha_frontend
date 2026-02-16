export * from './api/clients.api'
export * from './api/documents.api'
export * from './api/uploads.api'
export * from './api/importRuns.api'
export * from './api/auth.api'
export * from './api/settings.api'
export * from './api/admins.api'
export * from './api/users.api'
export * from './api/entreprises.api'
export * from './api/notifications.api'
export * from './api/blockedIps.api'
export * from './api/auditLogs.api'
export * from './api/workItems.api'
export * from './api/payments.api'
export * from './api/deposits.api'
export * from './api/adminPayments.api'
export * from './api/undo.api'
export * from './api/endpoint.factory'
export * from './services/payments.service'
export * from './services/deposits.service'

/**
 * Aliases de compatibilité rétroactive
 * Les nouvelles fonctions utilisent des noms standardisés (list, get, create, update, delete)
 * Ces alias permettent la transition progressive sans casser le code existant
 */

// Clients
export { listClients as fetchClients } from './api/clients.api'
export { getClient as fetchClientById } from './api/clients.api'

// Documents
export { listDocuments as fetchDocuments } from './api/documents.api'
export { createDocument as postDocument } from './api/documents.api'

// Payments
export { listPayments as fetchPayments } from './api/payments.api'
export { listAdminPayments as fetchAdminPayments } from './api/adminPayments.api'

// Deposits
export { listDeposits as fetchDeposits } from './api/deposits.api'

// Users
export { listUsers as fetchUsers } from './api/users.api'

// Admins
export { listAdmins as fetchAdmins } from './api/admins.api'
export { listAdminRequests as fetchAdminRequests } from './api/admins.api'

// Entreprises
export { listEntreprises as fetchEntreprises } from './api/entreprises.api'

// ImportRuns
export { listImportRuns as fetchImportRuns } from './api/importRuns.api'

// AuditLogs
export { listAuditLogs as fetchAuditLogs } from './api/auditLogs.api'

// WorkItems
export { listWorkItems as getWorkItems } from './api/workItems.api'
export { createWorkItem as postWorkItem } from './api/workItems.api'
