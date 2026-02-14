import { VALIDATION_ERRORS } from '../validation-keys'
import { VALIDATION_MESSAGES_EN_COMMON } from './validation.common'
import { VALIDATION_MESSAGES_EN_AUTH } from './validation.auth'
import { VALIDATION_MESSAGES_EN_CLIENT } from './validation.client'
import { VALIDATION_MESSAGES_EN_PROPERTY } from './validation.property'
import { VALIDATION_MESSAGES_EN_PAYMENT } from './validation.payment'

/**
 * Validation Messages - English
 * Centralized keys for all validation error messages
 */

export { VALIDATION_ERRORS }

export const VALIDATION_MESSAGES_EN: Record<string, string> = {
  ...VALIDATION_MESSAGES_EN_COMMON,
  ...VALIDATION_MESSAGES_EN_AUTH,
  ...VALIDATION_MESSAGES_EN_CLIENT,
  ...VALIDATION_MESSAGES_EN_PROPERTY,
  ...VALIDATION_MESSAGES_EN_PAYMENT,
}

export type ValidationMessagesEn = typeof VALIDATION_MESSAGES_EN
