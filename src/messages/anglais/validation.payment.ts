import { VALIDATION_ERRORS } from '../validation-keys'

export const VALIDATION_MESSAGES_EN_PAYMENT: Record<string, string> = {
  [VALIDATION_ERRORS.REQUIRED_AMOUNT]: 'Amount is required',
  [VALIDATION_ERRORS.REQUIRED_DATE]: 'Date is required',
  [VALIDATION_ERRORS.INVALID_AMOUNT]: 'Amount must be a number',
  [VALIDATION_ERRORS.INVALID_DATE]: 'Invalid date',
  [VALIDATION_ERRORS.AMOUNT_NEGATIVE]: 'Amount must be positive',
  [VALIDATION_ERRORS.AMOUNT_TOO_LARGE]: 'Amount seems invalid',
}
