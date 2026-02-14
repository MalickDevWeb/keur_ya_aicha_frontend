import { VALIDATION_ERRORS } from '../validation-keys'

export const VALIDATION_MESSAGES_FR_AUTH: Record<string, string> = {
  [VALIDATION_ERRORS.REQUIRED_USERNAME]: "Le nom d'utilisateur est requis",
  [VALIDATION_ERRORS.REQUIRED_PASSWORD]: 'Le mot de passe est requis',
  [VALIDATION_ERRORS.INVALID_USERNAME]: "Nom d'utilisateur invalide",
  [VALIDATION_ERRORS.USERNAME_TOO_SHORT]:
    "Le nom d'utilisateur doit contenir au moins 3 caractères",
  [VALIDATION_ERRORS.USERNAME_TOO_LONG]: "Le nom d'utilisateur ne peut pas dépasser 30 caractères",
  [VALIDATION_ERRORS.USERNAME_INVALID_CHARS]:
    "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores",
}
