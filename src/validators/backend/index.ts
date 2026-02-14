/**
 * Backend Validators - Exports
 * Validations exécutées côté serveur
 */

// Validateurs de base
export * from './common'

// Types pour les résultats de validation
export interface ValidationResult {
  valid: boolean
  error?: string
  errors?: string[]
}

// Fonction utilitaire pour lancer une erreur de validation
export const throwValidationError = (message: string): never => {
  throw new Error(`VALIDATION_ERROR: ${message}`)
}
