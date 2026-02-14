import { VALIDATION_ERRORS } from '../validation-keys'
import { VALIDATION_MESSAGES_FR_COMMON } from './validation.common'
import { VALIDATION_MESSAGES_FR_AUTH } from './validation.auth'
import { VALIDATION_MESSAGES_FR_CLIENT } from './validation.client'
import { VALIDATION_MESSAGES_FR_PROPERTY } from './validation.property'
import { VALIDATION_MESSAGES_FR_PAYMENT } from './validation.payment'

/**
 * Messages de validation - Français
 * Clés centralisées pour tous les messages d'erreur de validation
 */

export { VALIDATION_ERRORS }

export const VALIDATION_MESSAGES_FR: Record<string, string> = {
  ...VALIDATION_MESSAGES_FR_COMMON,
  ...VALIDATION_MESSAGES_FR_AUTH,
  ...VALIDATION_MESSAGES_FR_CLIENT,
  ...VALIDATION_MESSAGES_FR_PROPERTY,
  ...VALIDATION_MESSAGES_FR_PAYMENT,
}

// Type pour l'export
export type ValidationMessagesFr = typeof VALIDATION_MESSAGES_FR
