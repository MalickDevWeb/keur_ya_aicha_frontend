/**
 * Backend Validators - Server Side
 * These validations are executed server-side for security
 * Messages are centralized in src/messages/
 */

import { VALIDATION_ERRORS, getValidationMessage } from '@/messages/validation'

// ==========================================
// Helper - Get message by key
// ==========================================

const t = (key: string): string => getValidationMessage(key, 'fr')

// ==========================================
// Basic Validators (no dependencies)
// ==========================================

/**
 * Validate Senegalese phone number
 */
export const validateSenegalNumber = (phone: string): { valid: boolean; errorKey?: string; error?: string } => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, errorKey: VALIDATION_ERRORS.REQUIRED_PHONE, error: t(VALIDATION_ERRORS.REQUIRED_PHONE) }
  }

  const cleaned = phone.replace(/\s|-/g, '')

  const patterns = [
    /^\+22177\d{7}$/,
    /^\+22178\d{7}$/,
    /^77\d{7}$/,
    /^78\d{7}$/,
  ]

  const isValid = patterns.some((pattern) => pattern.test(cleaned))

  if (!isValid) {
    return { valid: false, errorKey: VALIDATION_ERRORS.INVALID_PHONE, error: t(VALIDATION_ERRORS.INVALID_PHONE) }
  }

  return { valid: true }
}

/**
 * Validate Senegalese ID card (13 digits)
 */
export const validateCNI = (cni: string): { valid: boolean; errorKey?: string; error?: string } => {
  if (!cni || typeof cni !== 'string') {
    return { valid: false, errorKey: VALIDATION_ERRORS.REQUIRED_CNI, error: t(VALIDATION_ERRORS.REQUIRED_CNI) }
  }

  const cleaned = cni.replace(/\s|-/g, '')

  if (!/^[0-9]{13}$/.test(cleaned)) {
    return { valid: false, errorKey: VALIDATION_ERRORS.INVALID_CNI, error: t(VALIDATION_ERRORS.INVALID_CNI) }
  }

  return { valid: true }
}

/**
 * Validate name/firstName/lastName
 */
export const validateName = (name: string): { valid: boolean; errorKey?: string; error?: string } => {
  if (!name || typeof name !== 'string') {
    return { valid: false, errorKey: VALIDATION_ERRORS.REQUIRED_NAME, error: t(VALIDATION_ERRORS.REQUIRED_NAME) }
  }

  const trimmed = name.trim()

  if (trimmed.length < 2) {
    return { valid: false, errorKey: VALIDATION_ERRORS.NAME_TOO_SHORT, error: t(VALIDATION_ERRORS.NAME_TOO_SHORT) }
  }

  if (trimmed.length > 50) {
    return { valid: false, errorKey: VALIDATION_ERRORS.NAME_TOO_LONG, error: t(VALIDATION_ERRORS.NAME_TOO_LONG) }
  }

  if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(trimmed)) {
    return { valid: false, errorKey: VALIDATION_ERRORS.NAME_INVALID_CHARS, error: t(VALIDATION_ERRORS.NAME_INVALID_CHARS) }
  }

  return { valid: true }
}

/**
 * Validate email
 */
export const validateEmail = (email: string): { valid: boolean; errorKey?: string; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { valid: true }
  }

  const trimmed = email.trim()

  if (trimmed.length === 0) {
    return { valid: true }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(trimmed)) {
    return { valid: false, errorKey: VALIDATION_ERRORS.INVALID_EMAIL, error: t(VALIDATION_ERRORS.INVALID_EMAIL) }
  }

  return { valid: true }
}

/**
 * Validate amount (must be positive)
 */
export const validateAmount = (amount: number | string): { valid: boolean; errorKey?: string; error?: string } => {
  if (amount === null || amount === undefined) {
    return { valid: false, errorKey: VALIDATION_ERRORS.REQUIRED_AMOUNT, error: t(VALIDATION_ERRORS.REQUIRED_AMOUNT) }
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(num)) {
    return { valid: false, errorKey: VALIDATION_ERRORS.INVALID_AMOUNT, error: t(VALIDATION_ERRORS.INVALID_AMOUNT) }
  }

  if (num < 0) {
    return { valid: false, errorKey: VALIDATION_ERRORS.AMOUNT_NEGATIVE, error: t(VALIDATION_ERRORS.AMOUNT_NEGATIVE) }
  }

  if (num > 100000000) {
    return { valid: false, errorKey: VALIDATION_ERRORS.AMOUNT_TOO_LARGE, error: t(VALIDATION_ERRORS.AMOUNT_TOO_LARGE) }
  }

  return { valid: true }
}

/**
 * Validate date
 */
export const validateDate = (date: string | Date): { valid: boolean; errorKey?: string; error?: string } => {
  if (!date) {
    return { valid: false, errorKey: VALIDATION_ERRORS.REQUIRED_DATE, error: t(VALIDATION_ERRORS.REQUIRED_DATE) }
  }

  const d = date instanceof Date ? date : new Date(date)

  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return { valid: false, errorKey: VALIDATION_ERRORS.INVALID_DATE, error: t(VALIDATION_ERRORS.INVALID_DATE) }
  }

  return { valid: true }
}

/**
 * Validate property name
 */
export const validatePropertyName = (name: string): { valid: boolean; errorKey?: string; error?: string } => {
  if (!name || typeof name !== 'string') {
    return { valid: false, errorKey: VALIDATION_ERRORS.REQUIRED_PROPERTY_NAME, error: t(VALIDATION_ERRORS.REQUIRED_PROPERTY_NAME) }
  }

  const trimmed = name.trim()

  if (trimmed.length < 1) {
    return { valid: false, errorKey: VALIDATION_ERRORS.REQUIRED_PROPERTY_NAME, error: t(VALIDATION_ERRORS.REQUIRED_PROPERTY_NAME) }
  }

  if (trimmed.length > 100) {
    return { valid: false, errorKey: VALIDATION_ERRORS.PROPERTY_NAME_TOO_LONG, error: t(VALIDATION_ERRORS.PROPERTY_NAME_TOO_LONG) }
  }

  return { valid: true }
}

/**
 * Validate property type
 */
export const validatePropertyType = (type: string): { valid: boolean; errorKey?: string; error?: string } => {
  const validTypes = ['studio', 'room', 'apartment', 'villa', 'other']

  if (!validTypes.includes(type)) {
    return { valid: false, errorKey: VALIDATION_ERRORS.INVALID_PROPERTY_TYPE, error: t(VALIDATION_ERRORS.INVALID_PROPERTY_TYPE) }
  }

  return { valid: true }
}

/**
 * Validate ID
 */
export const validateId = (id: string): { valid: boolean; errorKey?: string; error?: string } => {
  if (!id || typeof id !== 'string') {
    return { valid: false, errorKey: VALIDATION_ERRORS.REQUIRED_ID, error: t(VALIDATION_ERRORS.REQUIRED_ID) }
  }

  if (id.trim().length === 0) {
    return { valid: false, errorKey: VALIDATION_ERRORS.INVALID_ID, error: t(VALIDATION_ERRORS.INVALID_ID) }
  }

  return { valid: true }
}

/**
 * Validate username
 */
export const validateUsername = (username: string): { valid: boolean; errorKey?: string; error?: string } => {
  if (!username || typeof username !== 'string') {
    return { valid: false, errorKey: VALIDATION_ERRORS.REQUIRED_USERNAME, error: t(VALIDATION_ERRORS.REQUIRED_USERNAME) }
  }

  const trimmed = username.trim()

  if (trimmed.length < 3) {
    return { valid: false, errorKey: VALIDATION_ERRORS.USERNAME_TOO_SHORT, error: t(VALIDATION_ERRORS.USERNAME_TOO_SHORT) }
  }

  if (trimmed.length > 30) {
    return { valid: false, errorKey: VALIDATION_ERRORS.USERNAME_TOO_LONG, error: t(VALIDATION_ERRORS.USERNAME_TOO_LONG) }
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, errorKey: VALIDATION_ERRORS.USERNAME_INVALID_CHARS, error: t(VALIDATION_ERRORS.USERNAME_INVALID_CHARS) }
  }

  return { valid: true }
}

/**
 * Validate password (basic level)
 */
export const validatePassword = (password: string): { valid: boolean; errorKey?: string; error?: string } => {
  if (!password || typeof password !== 'string') {
    return { valid: false, errorKey: VALIDATION_ERRORS.REQUIRED_PASSWORD, error: t(VALIDATION_ERRORS.REQUIRED_PASSWORD) }
  }

  if (password.length < 6) {
    return { valid: false, errorKey: VALIDATION_ERRORS.REQUIRED_PASSWORD, error: t(VALIDATION_ERRORS.REQUIRED_PASSWORD) }
  }

  return { valid: true }
}

/**
 * Validate status
 */
export const validateStatus = (status: string, validStatuses: string[]): { valid: boolean; errorKey?: string; error?: string } => {
  if (!validStatuses.includes(status)) {
    return { valid: false, errorKey: VALIDATION_ERRORS.INVALID_STATUS, error: t(VALIDATION_ERRORS.INVALID_STATUS) }
  }

  return { valid: true }
}

// ==========================================
// Entity Validators
// ==========================================

/**
 * Validate client data
 */
export const validateClientData = (data: {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  cni?: string
  status?: string
}): { valid: boolean; errorKeys: string[]; errors: string[] } => {
  const errorKeys: string[] = []
  const errors: string[] = []

  const firstNameResult = validateName(data.firstName || '')
  if (!firstNameResult.valid) {
    errorKeys.push(firstNameResult.errorKey!)
    errors.push(firstNameResult.error!)
  }

  const lastNameResult = validateName(data.lastName || '')
  if (!lastNameResult.valid) {
    errorKeys.push(lastNameResult.errorKey!)
    errors.push(lastNameResult.error!)
  }

  const phoneResult = validateSenegalNumber(data.phone || '')
  if (!phoneResult.valid) {
    errorKeys.push(phoneResult.errorKey!)
    errors.push(phoneResult.error!)
  }

  if (data.cni) {
    const cniResult = validateCNI(data.cni)
    if (!cniResult.valid) {
      errorKeys.push(cniResult.errorKey!)
      errors.push(cniResult.error!)
    }
  }

  if (data.email) {
    const emailResult = validateEmail(data.email)
    if (!emailResult.valid) {
      errorKeys.push(emailResult.errorKey!)
      errors.push(emailResult.error!)
    }
  }

  return { valid: errors.length === 0, errorKeys, errors }
}

/**
 * Validate rental data
 */
export const validateRentalData = (data: {
  propertyName?: string
  propertyType?: string
  monthlyRent?: number
  startDate?: string | Date
}): { valid: boolean; errorKeys: string[]; errors: string[] } => {
  const errorKeys: string[] = []
  const errors: string[] = []

  const propertyNameResult = validatePropertyName(data.propertyName || '')
  if (!propertyNameResult.valid) {
    errorKeys.push(propertyNameResult.errorKey!)
    errors.push(propertyNameResult.error!)
  }

  if (data.propertyType) {
    const propertyTypeResult = validatePropertyType(data.propertyType)
    if (!propertyTypeResult.valid) {
      errorKeys.push(propertyTypeResult.errorKey!)
      errors.push(propertyTypeResult.error!)
    }
  }

  if (data.monthlyRent !== undefined) {
    const amountResult = validateAmount(data.monthlyRent)
    if (!amountResult.valid) {
      errorKeys.push(amountResult.errorKey!)
      errors.push(amountResult.error!)
    }
  }

  if (data.startDate) {
    const dateResult = validateDate(data.startDate)
    if (!dateResult.valid) {
      errorKeys.push(dateResult.errorKey!)
      errors.push(dateResult.error!)
    }
  }

  return { valid: errors.length === 0, errorKeys, errors }
}

/**
 * Validate payment data
 */
export const validatePaymentData = (data: {
  clientId?: string
  rentalId?: string
  amount?: number | string
  date?: string | Date
}): { valid: boolean; errorKeys: string[]; errors: string[] } => {
  const errorKeys: string[] = []
  const errors: string[] = []

  if (data.clientId) {
    const idResult = validateId(data.clientId)
    if (!idResult.valid) {
      errorKeys.push(idResult.errorKey!)
      errors.push(idResult.error!)
    }
  }

  if (data.rentalId) {
    const idResult = validateId(data.rentalId)
    if (!idResult.valid) {
      errorKeys.push(idResult.errorKey!)
      errors.push(idResult.error!)
    }
  }

  if (data.amount !== undefined) {
    const amountResult = validateAmount(data.amount)
    if (!amountResult.valid) {
      errorKeys.push(amountResult.errorKey!)
      errors.push(amountResult.error!)
    }
  }

  if (data.date) {
    const dateResult = validateDate(data.date)
    if (!dateResult.valid) {
      errorKeys.push(dateResult.errorKey!)
      errors.push(dateResult.error!)
    }
  }

  return { valid: errors.length === 0, errorKeys, errors }
}

/**
 * Validate admin data
 */
export const validateAdminData = (data: {
  username?: string
  name?: string
  email?: string
  entrepriseName?: string
}): { valid: boolean; errorKeys: string[]; errors: string[] } => {
  const errorKeys: string[] = []
  const errors: string[] = []

  const usernameResult = validateUsername(data.username || '')
  if (!usernameResult.valid) {
    errorKeys.push(usernameResult.errorKey!)
    errors.push(usernameResult.error!)
  }

  const nameResult = validateName(data.name || '')
  if (!nameResult.valid) {
    errorKeys.push(nameResult.errorKey!)
    errors.push(nameResult.error!)
  }

  if (data.email) {
    const emailResult = validateEmail(data.email)
    if (!emailResult.valid) {
      errorKeys.push(emailResult.errorKey!)
      errors.push(emailResult.error!)
    }
  }

  if (data.entrepriseName) {
    const entrepriseResult = validateName(data.entrepriseName)
    if (!entrepriseResult.valid) {
      errorKeys.push(entrepriseResult.errorKey!)
      errors.push(entrepriseResult.error!)
    }
  }

  return { valid: errors.length === 0, errorKeys, errors }
}

// ==========================================
// Duplicate Validation
// ==========================================

export interface DuplicateCheck {
  field: string
  value: string
  existsIn: string[]
  errorKey?: string
}

/**
 * Check duplicates (must be implemented with database)
 */
export const checkDuplicates = async (
  db: Record<string, Record<string, unknown>[]>,
  checks: DuplicateCheck[]
): Promise<{ valid: boolean; errorKeys: string[]; errors: string[] }> => {
  const errorKeys: string[] = []
  const errors: string[] = []

  for (const check of checks) {
    const normalizedValue = check.value.toLowerCase().trim()

    for (const collection of check.existsIn) {
      const collectionData = db[collection] || []

      const exists = collectionData.some((item: Record<string, unknown>) => {
        const itemValue = item[check.field]
        if (!itemValue) return false
        return String(itemValue).toLowerCase().trim() === normalizedValue
      })

      if (exists) {
        const errorKey = check.errorKey || VALIDATION_ERRORS.DUPLICATE
        errorKeys.push(errorKey)
        errors.push(t(errorKey))
      }
    }
  }

  return { valid: errors.length === 0, errorKeys, errors }
}

// Export validation error keys for translation
export { VALIDATION_ERRORS }
