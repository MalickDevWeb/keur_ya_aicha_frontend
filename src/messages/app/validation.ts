export const VALIDATION = {
  REQUIRED: 'app.validation.required',
  REQUIRED_FIELD: 'app.validation.required.field',
  INVALID_PHONE: 'app.validation.invalid.phone',
  INVALID_EMAIL: 'app.validation.invalid.email',
  INVALID_DATE: 'app.validation.invalid.date',
  INVALID_NUMBER: 'app.validation.invalid.number',
  TOO_SHORT: 'app.validation.length.tooShort',
  TOO_LONG: 'app.validation.length.tooLong',
  DUPLICATE: 'app.validation.duplicate',
  DUPLICATE_PHONE: 'app.validation.duplicate.phone',
  DUPLICATE_EMAIL: 'app.validation.duplicate.email',
} as const

export const VALIDATION_FR: Record<string, string> = {
  [VALIDATION.REQUIRED]: 'Ce champ est requis',
  [VALIDATION.REQUIRED_FIELD]: '{field} est requis',
  [VALIDATION.INVALID_PHONE]: 'Numéro de téléphone invalide',
  [VALIDATION.INVALID_EMAIL]: 'Adresse email invalide',
  [VALIDATION.INVALID_DATE]: 'Date invalide',
  [VALIDATION.INVALID_NUMBER]: 'Valeur numérique invalide',
  [VALIDATION.TOO_SHORT]: 'Trop court (minimum {min} caractères)',
  [VALIDATION.TOO_LONG]: 'Trop long (maximum {max} caractères)',
  [VALIDATION.DUPLICATE]: 'Cette valeur existe déjà',
  [VALIDATION.DUPLICATE_PHONE]: 'Ce numéro de téléphone existe déjà',
  [VALIDATION.DUPLICATE_EMAIL]: 'Cette adresse email existe déjà',
}

export const VALIDATION_EN: Record<string, string> = {
  [VALIDATION.REQUIRED]: 'This field is required',
  [VALIDATION.REQUIRED_FIELD]: '{field} is required',
  [VALIDATION.INVALID_PHONE]: 'Invalid phone number',
  [VALIDATION.INVALID_EMAIL]: 'Invalid email address',
  [VALIDATION.INVALID_DATE]: 'Invalid date',
  [VALIDATION.INVALID_NUMBER]: 'Invalid number',
  [VALIDATION.TOO_SHORT]: 'Too short (minimum {min} characters)',
  [VALIDATION.TOO_LONG]: 'Too long (maximum {max} characters)',
  [VALIDATION.DUPLICATE]: 'This value already exists',
  [VALIDATION.DUPLICATE_PHONE]: 'This phone number already exists',
  [VALIDATION.DUPLICATE_EMAIL]: 'This email address already exists',
}
