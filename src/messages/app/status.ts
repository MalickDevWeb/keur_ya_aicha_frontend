export const STATUS = {
  ACTIVE: 'app.status.active',
  INACTIVE: 'app.status.inactive',
  PENDING: 'app.status.pending',
  ARCHIVED: 'app.status.archived',
  BLACKLISTED: 'app.status.blacklisted',
  SUSPENDED: 'app.status.suspended',
  PAID: 'app.status.paid',
  UNPAID: 'app.status.unpaid',
  PARTIAL: 'app.status.partial',
} as const

export const STATUS_FR: Record<string, string> = {
  [STATUS.ACTIVE]: 'Actif',
  [STATUS.INACTIVE]: 'Inactif',
  [STATUS.PENDING]: 'En attente',
  [STATUS.ARCHIVED]: 'Archivé',
  [STATUS.BLACKLISTED]: 'Blacklisté',
  [STATUS.SUSPENDED]: 'Suspendu',
  [STATUS.PAID]: 'Payé',
  [STATUS.UNPAID]: 'Non payé',
  [STATUS.PARTIAL]: 'Partiel',
}

export const STATUS_EN: Record<string, string> = {
  [STATUS.ACTIVE]: 'Active',
  [STATUS.INACTIVE]: 'Inactive',
  [STATUS.PENDING]: 'Pending',
  [STATUS.ARCHIVED]: 'Archived',
  [STATUS.BLACKLISTED]: 'Blacklisted',
  [STATUS.SUSPENDED]: 'Suspended',
  [STATUS.PAID]: 'Paid',
  [STATUS.UNPAID]: 'Unpaid',
  [STATUS.PARTIAL]: 'Partial',
}
