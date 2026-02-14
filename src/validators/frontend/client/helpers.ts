// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validate Senegalese phone number
 * Accepts: +221 77 123 45 67 or 77123456 or 771234567 or +22177123456
 */
export const validateSenegalNumber = (phone: string): boolean => {
  // Remove all spaces and hyphens
  const cleaned = phone.replace(/\s|-/g, '')

  // Check if it's a valid Senegalese number
  // Pattern 1: +221XXXXXXXXX (13 digits with +221)
  // Pattern 2: 77XXXXXXX or 78XXXXXXX (9 digits starting with 77 or 78)
  const patterns = [
    /^\+22177\d{7}$/, // +221 77 XXXXXXX
    /^\+22178\d{7}$/, // +221 78 XXXXXXX
    /^77\d{7}$/, // 77 XXXXXXX
    /^78\d{7}$/, // 78 XXXXXXX
  ]

  return patterns.some((pattern) => pattern.test(cleaned))
}

/**
 * Validate CNI (Carte Nationale d'Identité Sénégalaise)
 * Should be 13 digits only (for now)
 */
export const validateCNI = (cni: string): boolean => {
  const cleaned = cni.replace(/\s|-/g, '')
  return /^[0-9]{13}$/.test(cleaned)
}

/**
 * Validate name/firstName/lastName
 * Only letters (including accented ones), spaces, hyphens, and apostrophes
 * Minimum 2 characters
 */
export const validateName = (name: string): boolean => {
  const trimmed = name.trim()
  if (trimmed.length < 2) return false
  if (trimmed.length > 50) return false
  // Allow letters (including accented), spaces, hyphens, apostrophes
  return /^[a-zA-ZÀ-ÿ\s\-']+$/.test(trimmed)
}

/**
 * Validate property name
 * Allow letters, numbers, spaces, hyphens, apostrophes
 */
export const validatePropertyName = (name: string): boolean => {
  const trimmed = name.trim()
  if (trimmed.length < 1) return false
  if (trimmed.length > 100) return false
  return /^[a-zA-Z0-9À-ÿ\s\-',/#]+$/.test(trimmed)
}

/**
 * Validate amount (must be positive number)
 */
export const validateAmount = (amount: number | string): boolean => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return !isNaN(num) && num > 0 && num < 100000000
}

/**
 * Validate date format
 */
export const validateDate = (date: string): boolean => {
  if (!date) return false
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
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

export const validateEmail = (email: string): boolean => {
  const trimmed = email.trim()
  if (!trimmed) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
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
