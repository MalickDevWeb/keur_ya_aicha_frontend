import type { AdminFeaturePermissions } from '@/dto/frontend/responses'

export const ADMIN_FEATURE_PERMISSION_DEFAULTS: AdminFeaturePermissions = {
  dashboard: true,
  clients: true,
  rentals: true,
  payments: true,
  documents: true,
  settings: true,
  work: true,
  imports: true,
  notifications: true,
  pdfExport: true,
}

export const ADMIN_FEATURE_LABELS: Record<keyof AdminFeaturePermissions, string> = {
  dashboard: 'Tableau de bord',
  clients: 'Clients',
  rentals: 'Locations',
  payments: 'Paiements',
  documents: 'Documents',
  settings: 'Paramètres',
  work: 'Travaux à faire',
  imports: 'Imports',
  notifications: 'Notifications',
  pdfExport: 'Export PDF',
}

export function normalizeAdminFeaturePermissions(
  value?: Partial<AdminFeaturePermissions> | null
): AdminFeaturePermissions {
  const source = value && typeof value === 'object' ? value : {}
  return {
    dashboard:
      typeof source.dashboard === 'boolean' ? source.dashboard : ADMIN_FEATURE_PERMISSION_DEFAULTS.dashboard,
    clients: typeof source.clients === 'boolean' ? source.clients : ADMIN_FEATURE_PERMISSION_DEFAULTS.clients,
    rentals: typeof source.rentals === 'boolean' ? source.rentals : ADMIN_FEATURE_PERMISSION_DEFAULTS.rentals,
    payments: typeof source.payments === 'boolean' ? source.payments : ADMIN_FEATURE_PERMISSION_DEFAULTS.payments,
    documents:
      typeof source.documents === 'boolean' ? source.documents : ADMIN_FEATURE_PERMISSION_DEFAULTS.documents,
    settings: typeof source.settings === 'boolean' ? source.settings : ADMIN_FEATURE_PERMISSION_DEFAULTS.settings,
    work: typeof source.work === 'boolean' ? source.work : ADMIN_FEATURE_PERMISSION_DEFAULTS.work,
    imports: typeof source.imports === 'boolean' ? source.imports : ADMIN_FEATURE_PERMISSION_DEFAULTS.imports,
    notifications:
      typeof source.notifications === 'boolean'
        ? source.notifications
        : ADMIN_FEATURE_PERMISSION_DEFAULTS.notifications,
    pdfExport:
      typeof source.pdfExport === 'boolean' ? source.pdfExport : ADMIN_FEATURE_PERMISSION_DEFAULTS.pdfExport,
  }
}

export function countEnabledAdminPermissions(value?: Partial<AdminFeaturePermissions> | null): number {
  const normalized = normalizeAdminFeaturePermissions(value)
  return Object.values(normalized).filter(Boolean).length
}

