/**
 * Point d'entrée centralisé pour tous les messages de l'application
 * Importer ici pour accéder à tous les messages
 */

// Ré-exporter depuis les sous-dossiers
export * from './validation'
export * from './app'

// Helpers
export { t, getAction, getLabel, getStatus } from './app'

// Constants - ré-exporter depuis MESSAGES
import { MESSAGES } from './app'

export const ACTIONS = MESSAGES.ACTIONS
export const LABELS = MESSAGES.LABELS
export const STATUS = MESSAGES.STATUS
export const PAGES = MESSAGES.PAGES
export const SUCCESS = MESSAGES.SUCCESS
export const ERRORS = MESSAGES.ERRORS
export const CONFIRMATIONS = MESSAGES.CONFIRMATIONS
export const NAV = MESSAGES.NAV
export const ENTITIES = MESSAGES.ENTITIES
export const MENU = MESSAGES.MENU
export const VALIDATION = MESSAGES.VALIDATION
