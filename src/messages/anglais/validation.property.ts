import { VALIDATION_ERRORS } from '../validation-keys'

export const VALIDATION_MESSAGES_EN_PROPERTY: Record<string, string> = {
  [VALIDATION_ERRORS.REQUIRED_PROPERTY_NAME]: 'Property name is required',
  [VALIDATION_ERRORS.INVALID_PROPERTY_NAME]: 'Invalid property name',
  [VALIDATION_ERRORS.INVALID_PROPERTY_TYPE]: 'Invalid property type',
  [VALIDATION_ERRORS.PROPERTY_NAME_TOO_LONG]: 'Property name cannot exceed 100 characters',
}
