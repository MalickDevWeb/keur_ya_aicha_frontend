/**
 * Validation Messages Index
 * Export all validation messages by language
 */

import {
  VALIDATION_ERRORS,
  VALIDATION_MESSAGES_FR,
  type ValidationMessagesFr,
} from './franchais/validation'
import { VALIDATION_MESSAGES_EN, type ValidationMessagesEn } from './anglais/validation'

export { VALIDATION_ERRORS, VALIDATION_MESSAGES_FR, type ValidationMessagesFr }
export { VALIDATION_MESSAGES_EN, type ValidationMessagesEn }

export type ValidationMessages = typeof VALIDATION_MESSAGES_FR

export const getValidationMessage = (key: string, lang: 'fr' | 'en' = 'fr'): string => {
  const messages = lang === 'fr' ? VALIDATION_MESSAGES_FR : VALIDATION_MESSAGES_EN
  return messages[key] || key
}
