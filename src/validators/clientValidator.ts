import { z } from 'zod'

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validate Senegalese phone number
 * Accepts: +221 77 123 45 67 or 77123456 or 771234567 or +22177123456
 */
const validateSenegalNumber = (phone: string): boolean => {
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
const validateCNI = (cni: string): boolean => {
  const cleaned = cni.replace(/\s|-/g, '')
  return /^[0-9]{13}$/.test(cleaned)
}

/**
 * Validate name/firstName/lastName
 * Only letters (including accented ones), spaces, hyphens, and apostrophes
 * Minimum 2 characters
 */
const validateName = (name: string): boolean => {
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
const validatePropertyName = (name: string): boolean => {
  const trimmed = name.trim()
  if (trimmed.length < 1) return false
  if (trimmed.length > 100) return false
  return /^[a-zA-Z0-9À-ÿ\s\-',/#]+$/.test(trimmed)
}

/**
 * Validate amount (must be positive number)
 */
const validateAmount = (amount: number | string): boolean => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return !isNaN(num) && num > 0 && num < 100000000
}

/**
 * Validate date format
 */
const validateDate = (date: string): boolean => {
  if (!date) return false
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}

// ==========================================
// ZOD SCHEMAS
// ==========================================

// Validation schema for personal information
export const personalInfoSchema = z.object({
  lastName: z
    .string()
    .min(1, 'Le nom est requis')
    .refine(
      validateName,
      'Le nom doit contenir au moins 2 lettres (pas de chiffres ou caractères spéciaux)'
    ),
  firstName: z
    .string()
    .min(1, 'Le prénom est requis')
    .refine(
      validateName,
      'Le prénom doit contenir au moins 2 lettres (pas de chiffres ou caractères spéciaux)'
    ),
  phone: z
    .string()
    .min(1, 'Le numéro de téléphone est requis')
    .refine(
      validateSenegalNumber,
      'Numéro sénégalais invalide. Format: +221 77 123 45 67 ou 77123456'
    ),
  cni: z
    .string()
    .min(1, 'La CNI est requise')
    .refine(validateCNI, 'La CNI doit contenir exactement 13 chiffres'),
})

// Validation schema for location/rental information
export const locationInfoSchema = z.object({
  propertyType: z.enum(['studio', 'room', 'apartment', 'villa', 'other'], {
    errorMap: () => ({ message: 'Sélectionnez un type de bien valide' }),
  }),
  propertyName: z
    .string()
    .min(1, 'Le nom du bien est requis')
    .refine(
      validatePropertyName,
      'Le nom du bien ne peut contenir que des lettres, chiffres et caractères de base'
    ),
  startDate: z
    .string()
    .min(1, 'La date de début est requise')
    .refine(validateDate, 'La date de début est invalide'),
  monthlyRent: z
    .number()
    .min(1000, 'Le loyer minimum est 1000 FCFA')
    .max(100000000, 'Le loyer semble être invalide')
    .refine(validateAmount, 'Le montant du loyer est invalide'),
})

// Validation schema for deposit information
export const depositInfoSchema = z
  .object({
    depositTotal: z
      .number()
      .min(0, 'La caution totale ne peut pas être négative')
      .max(100000000, 'La caution semble être invalide'),
    depositPaid: z
      .number()
      .min(0, 'La caution payée ne peut pas être négative')
      .max(100000000, 'La caution semble être invalide'),
  })
  .refine((data) => data.depositPaid <= data.depositTotal, {
    message: 'La caution payée ne peut pas dépasser la caution totale',
    path: ['depositPaid'],
  })

// Combined schema for creating a complete client with rental
export const createClientSchema = z.object({
  personalInfo: personalInfoSchema,
  locationInfo: locationInfoSchema,
  depositInfo: depositInfoSchema,
})

// ==========================================
// TYPE INFERENCE
// ==========================================

// Type inference for form data
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>
export type LocationInfoFormData = z.infer<typeof locationInfoSchema>
export type DepositInfoFormData = z.infer<typeof depositInfoSchema>
export type CreateClientFormData = z.infer<typeof createClientSchema>

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Helper function to validate personal info
export function validatePersonalInfo(data: unknown) {
  return personalInfoSchema.safeParse(data)
}

// Helper function to validate location info
export function validateLocationInfo(data: unknown) {
  return locationInfoSchema.safeParse(data)
}

// Helper function to validate deposit info
export function validateDepositInfo(data: unknown) {
  return depositInfoSchema.safeParse(data)
}

// Helper function to validate complete client data
export function validateCreateClient(data: unknown) {
  return createClientSchema.safeParse(data)
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
