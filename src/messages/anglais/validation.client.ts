import { VALIDATION_ERRORS } from '../validation-keys'

export const VALIDATION_MESSAGES_EN_CLIENT: Record<string, string> = {
  [VALIDATION_ERRORS.REQUIRED_PHONE]: 'Phone number is required',
  [VALIDATION_ERRORS.REQUIRED_CNI]: 'ID card number is required',
  [VALIDATION_ERRORS.REQUIRED_NAME]: 'Name is required',
  [VALIDATION_ERRORS.REQUIRED_EMAIL]: 'Email is required',
  [VALIDATION_ERRORS.INVALID_PHONE]:
    'Invalid Senegalese phone number. Format: +221 77 123 45 67',
  [VALIDATION_ERRORS.INVALID_CNI]: 'ID card must contain exactly 13 digits',
  [VALIDATION_ERRORS.INVALID_NAME]: 'Name can only contain letters',
  [VALIDATION_ERRORS.INVALID_EMAIL]: 'Invalid email',
  [VALIDATION_ERRORS.NAME_TOO_SHORT]: 'Name must be at least 2 characters',
  [VALIDATION_ERRORS.NAME_TOO_LONG]: 'Name cannot exceed 50 characters',
  [VALIDATION_ERRORS.NAME_INVALID_CHARS]: 'Name can only contain letters',
  [VALIDATION_ERRORS.DUPLICATE_PHONE]: 'This phone number already exists',
  [VALIDATION_ERRORS.DUPLICATE_EMAIL]: 'This email already exists',
  [VALIDATION_ERRORS.DUPLICATE_CNI]: 'This ID card number already exists',
}
