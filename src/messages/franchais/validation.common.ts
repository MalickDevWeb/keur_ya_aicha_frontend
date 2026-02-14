import { VALIDATION_ERRORS } from '../validation-keys'

export const VALIDATION_MESSAGES_FR_COMMON: Record<string, string> = {
  [VALIDATION_ERRORS.REQUIRED]: 'Ce champ est requis',
  [VALIDATION_ERRORS.REQUIRED_ID]: "L'identifiant est requis",
  [VALIDATION_ERRORS.INVALID_ID]: 'Identifiant invalide',
  [VALIDATION_ERRORS.INVALID_STATUS]: 'Statut invalide',
  [VALIDATION_ERRORS.INVALID_SELECT]: 'Sélectionnez une valeur valide',
  [VALIDATION_ERRORS.DUPLICATE]: 'Cette valeur existe déjà',
}
