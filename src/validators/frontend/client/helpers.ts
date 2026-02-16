// ==========================================
// VALIDATION HELPERS
// ==========================================

// ==========================================
// Phone Number Validators
// ==========================================

/**
 * Validate Senegalese phone number
 * Accepts: +221 77 123 45 67 or 77123456 or 771234567 or +22177123456
 */
export const validateSenegalNumber = (phone: string): boolean => {
  if (!phone) return false
  const cleaned = phone.replace(/\s|-/g, '')
  const patterns = [
    /^\+22177\d{7}$/,
    /^\+22178\d{7}$/,
    /^77\d{7}$/,
    /^78\d{7}$/,
  ]
  return patterns.some((pattern) => pattern.test(cleaned))
}

// ==========================================
// ID Validators
// ==========================================

/**
 * Validate CNI (Carte Nationale d'Identité Sénégalaise)
 * Should be 13 digits only
 */
export const validateCNI = (cni: string): boolean => {
  if (!cni) return false
  const cleaned = cni.replace(/\s|-/g, '')
  return /^[0-9]{13}$/.test(cleaned)
}

// ==========================================
// Name Validators
// ==========================================

/**
 * Validate name/firstName/lastName
 * Only letters (including accented ones), spaces, hyphens, and apostrophes
 * Minimum 2 characters, maximum 50
 */
export const validateName = (name: string): boolean => {
  if (!name) return false
  const trimmed = name.trim()
  if (trimmed.length < 2) return false
  if (trimmed.length > 50) return false
  return /^[a-zA-ZÀ-ÿ\s\-']+$/.test(trimmed)
}

// ==========================================
// Property Validators
// ==========================================

/**
 * Validate property name
 * Allow letters, numbers, spaces, hyphens, apostrophes
 */
export const validatePropertyName = (name: string): boolean => {
  if (!name) return false
  const trimmed = name.trim()
  if (trimmed.length < 1) return false
  if (trimmed.length > 100) return false
  return /^[a-zA-Z0-9À-ÿ\s\-',/#]+$/.test(trimmed)
}

// ==========================================
// Amount Validators
// ==========================================

/**
 * Validate amount (must be positive number)
 */
export const validateAmount = (amount: number | string): boolean => {
  if (amount === null || amount === undefined || amount === '') return false
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return !isNaN(num) && num > 0 && num < 100000000
}

// ==========================================
// Date Validators
// ==========================================

/**
 * Validate date format
 */
export const validateDate = (date: string): boolean => {
  if (!date) return false
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}

// ==========================================
// Email Validators
// ==========================================

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false
  const trimmed = email.trim()
  if (!trimmed) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

// ==========================================
// FORMATTING HELPERS
// ==========================================

/**
 * Format phone number to standard format: +221 77 123 45 67
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\s|-|\+221/g, '').slice(-9)
  if (cleaned.length === 9) {
    return `+221 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

/**
 * Normalize phone for equality checks (Senegal numbers).
 * Returns last 9 digits without country code.
 */
export function normalizePhoneForCompare(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '')
  const withoutCountry = digits.startsWith('221') ? digits.slice(3) : digits
  return withoutCountry.slice(-9)
}

export function normalizeEmailForCompare(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Format CNI to standard format
 */
export function formatCNI(cni: string): string {
  return cni.replace(/\s|-/g, '').replace(/[^0-9]/g, '')
}

/**
 * Format name (trim and capitalize first letter)
 */
export function formatName(name: string): string {
  return name
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
