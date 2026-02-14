import { VALIDATION_ERRORS } from '../validation-keys'

export const VALIDATION_MESSAGES_FR_CLIENT: Record<string, string> = {
  [VALIDATION_ERRORS.REQUIRED_PHONE]: 'Le numéro de téléphone est requis',
  [VALIDATION_ERRORS.REQUIRED_CNI]: 'La CNI est requise',
  [VALIDATION_ERRORS.REQUIRED_NAME]: 'Le nom est requis',
  [VALIDATION_ERRORS.REQUIRED_EMAIL]: "L'email est requis",
  [VALIDATION_ERRORS.INVALID_PHONE]:
    'Numéro sénégalais invalide. Format: +221 77 123 45 67 ou 771234567',
  [VALIDATION_ERRORS.INVALID_CNI]: 'La CNI doit contenir exactement 13 chiffres',
  [VALIDATION_ERRORS.INVALID_NAME]: 'Le nom ne peut contenir que des lettres',
  [VALIDATION_ERRORS.INVALID_EMAIL]: 'Email invalide',
  [VALIDATION_ERRORS.NAME_TOO_SHORT]: 'Le nom doit contenir au moins 2 lettres',
  [VALIDATION_ERRORS.NAME_TOO_LONG]: 'Le nom ne peut pas dépasser 50 caractères',
  [VALIDATION_ERRORS.NAME_INVALID_CHARS]: 'Le nom ne peut contenir que des lettres',
  [VALIDATION_ERRORS.DUPLICATE_PHONE]: 'Ce numéro de téléphone existe déjà',
  [VALIDATION_ERRORS.DUPLICATE_EMAIL]: 'Cet email existe déjà',
  [VALIDATION_ERRORS.DUPLICATE_CNI]: 'Cette CNI existe déjà',
}
