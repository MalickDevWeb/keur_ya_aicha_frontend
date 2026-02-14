import { VALIDATION_ERRORS } from '../validation-keys'

export const VALIDATION_MESSAGES_FR_PAYMENT: Record<string, string> = {
  [VALIDATION_ERRORS.REQUIRED_AMOUNT]: 'Le montant est requis',
  [VALIDATION_ERRORS.REQUIRED_DATE]: 'La date est requise',
  [VALIDATION_ERRORS.INVALID_AMOUNT]: 'Le montant doit être un nombre',
  [VALIDATION_ERRORS.INVALID_DATE]: 'Date invalide',
  [VALIDATION_ERRORS.AMOUNT_NEGATIVE]: 'Le montant doit être positif',
  [VALIDATION_ERRORS.AMOUNT_TOO_LARGE]: 'Le montant semble invalide',
}
