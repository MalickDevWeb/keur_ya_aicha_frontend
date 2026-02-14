import { VALIDATION_ERRORS } from '../validation-keys'

export const VALIDATION_MESSAGES_EN_COMMON: Record<string, string> = {
  [VALIDATION_ERRORS.REQUIRED]: 'This field is required',
  [VALIDATION_ERRORS.REQUIRED_ID]: 'ID is required',
  [VALIDATION_ERRORS.INVALID_ID]: 'Invalid ID',
  [VALIDATION_ERRORS.INVALID_STATUS]: 'Invalid status',
  [VALIDATION_ERRORS.INVALID_SELECT]: 'Please select a valid value',
  [VALIDATION_ERRORS.DUPLICATE]: 'This value already exists',
}
