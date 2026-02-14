// Validation message keys shared across languages
export const VALIDATION_ERRORS = {
  // Common
  REQUIRED: 'validation.common.required',
  REQUIRED_ID: 'validation.common.id.required',
  INVALID_ID: 'validation.common.id.invalid',
  INVALID_STATUS: 'validation.common.status.invalid',
  INVALID_SELECT: 'validation.common.select.invalid',
  DUPLICATE: 'validation.common.duplicate',

  // Client
  REQUIRED_PHONE: 'validation.client.phone.required',
  REQUIRED_CNI: 'validation.client.cni.required',
  REQUIRED_NAME: 'validation.client.name.required',
  REQUIRED_EMAIL: 'validation.client.email.required',
  INVALID_PHONE: 'validation.client.phone.invalid',
  INVALID_CNI: 'validation.client.cni.invalid',
  INVALID_NAME: 'validation.client.name.invalid',
  INVALID_EMAIL: 'validation.client.email.invalid',
  NAME_TOO_SHORT: 'validation.client.name.tooShort',
  NAME_TOO_LONG: 'validation.client.name.tooLong',
  NAME_INVALID_CHARS: 'validation.client.name.invalidChars',
  DUPLICATE_PHONE: 'validation.client.phone.duplicate',
  DUPLICATE_EMAIL: 'validation.client.email.duplicate',
  DUPLICATE_CNI: 'validation.client.cni.duplicate',

  // Auth
  REQUIRED_USERNAME: 'validation.auth.username.required',
  REQUIRED_PASSWORD: 'validation.auth.password.required',
  INVALID_USERNAME: 'validation.auth.username.invalid',
  USERNAME_TOO_SHORT: 'validation.auth.username.tooShort',
  USERNAME_TOO_LONG: 'validation.auth.username.tooLong',
  USERNAME_INVALID_CHARS: 'validation.auth.username.invalidChars',

  // Property
  REQUIRED_PROPERTY_NAME: 'validation.property.name.required',
  INVALID_PROPERTY_NAME: 'validation.property.name.invalid',
  INVALID_PROPERTY_TYPE: 'validation.property.type.invalid',
  PROPERTY_NAME_TOO_LONG: 'validation.property.name.tooLong',

  // Payment
  REQUIRED_AMOUNT: 'validation.payment.amount.required',
  REQUIRED_DATE: 'validation.payment.date.required',
  INVALID_AMOUNT: 'validation.payment.amount.invalid',
  INVALID_DATE: 'validation.payment.date.invalid',
  AMOUNT_NEGATIVE: 'validation.payment.amount.negative',
  AMOUNT_TOO_LARGE: 'validation.payment.amount.tooLarge',
} as const

export type ValidationErrorKey = (typeof VALIDATION_ERRORS)[keyof typeof VALIDATION_ERRORS]
