import { VALIDATION_ERRORS } from '../validation-keys'

export const VALIDATION_MESSAGES_EN_AUTH: Record<string, string> = {
  [VALIDATION_ERRORS.REQUIRED_USERNAME]: 'Username is required',
  [VALIDATION_ERRORS.REQUIRED_PASSWORD]: 'Password is required',
  [VALIDATION_ERRORS.INVALID_USERNAME]: 'Invalid username',
  [VALIDATION_ERRORS.USERNAME_TOO_SHORT]: 'Username must be at least 3 characters',
  [VALIDATION_ERRORS.USERNAME_TOO_LONG]: 'Username cannot exceed 30 characters',
  [VALIDATION_ERRORS.USERNAME_INVALID_CHARS]:
    'Username can only contain letters, numbers, hyphens and underscores',
}
