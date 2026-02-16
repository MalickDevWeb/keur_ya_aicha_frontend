/**
 * Application Constants
 *
 * Centralized constants to avoid magic strings throughout the codebase.
 * Use these constants instead of hardcoded strings.
 */

// ==========================================
// User Roles
// ==========================================

export const ROLES = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const

export type Role = typeof ROLES.ADMIN | typeof ROLES.SUPER_ADMIN

// ==========================================
// User Status
// ==========================================

export const USER_STATUS = {
  ACTIF: 'ACTIF',
  INACTIF: 'INACTIF',
  PENDING: 'PENDING',
  BLOCKED: 'BLOCKED',
} as const

// ==========================================
// Payment Status
// ==========================================

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  PARTIAL: 'partial',
} as const

// ==========================================
// Currency
// ==========================================

export const CURRENCY = {
  CODE: 'XOF',
  SYMBOL: 'FCFA',
  LOCALE: 'fr-FR',
} as const

// ==========================================
// API Endpoints
// ==========================================

export const API_ENDPOINTS = {
  AUTH: '/auth',
  CLIENTS: '/clients',
  PAYMENTS: '/payments',
  RENTALS: '/rentals',
  DEPOSITS: '/deposits',
  DOCUMENTS: '/documents',
  ADMINS: '/admins',
  ENTREPRISES: '/entreprises',
  NOTIFICATIONS: '/notifications',
  AUDIT_LOGS: '/audit_logs',
  SETTINGS: '/settings',
  IMPORTS: '/import_runs',
  WORK_ITEMS: '/work_items',
} as const

// ==========================================
// Date Formats
// ==========================================

export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'd MMM yyyy',
  DATETIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm',
} as const

// ==========================================
// Pagination
// ==========================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const

// ==========================================
// Validation
// ==========================================

export const VALIDATION = {
  PHONE_LENGTH: 9,
  CNI_LENGTH: 13,
  MIN_PASSWORD_LENGTH: 6,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
} as const
