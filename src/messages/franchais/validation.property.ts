import { VALIDATION_ERRORS } from '../validation-keys'

export const VALIDATION_MESSAGES_FR_PROPERTY: Record<string, string> = {
  [VALIDATION_ERRORS.REQUIRED_PROPERTY_NAME]: 'Le nom du bien est requis',
  [VALIDATION_ERRORS.INVALID_PROPERTY_NAME]: 'Le nom du bien est invalide',
  [VALIDATION_ERRORS.INVALID_PROPERTY_TYPE]: 'Type de bien invalide',
  [VALIDATION_ERRORS.PROPERTY_NAME_TOO_LONG]: 'Le nom du bien ne peut pas dépasser 100 caractères',
}
