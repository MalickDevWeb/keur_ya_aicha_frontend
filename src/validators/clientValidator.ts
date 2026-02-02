import { z } from 'zod'

// Validation schema for personal information
export const personalInfoSchema = z.object({
  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  phone: z
    .string()
    .regex(
      /^\+221\s[77]\s\d{3}\s\d{2}\s\d{2}$/,
      'Le format du téléphone est invalide (ex: +221 77 123 45 67)'
    ),
  cni: z
    .string()
    .min(13, 'La CNI doit contenir exactement 13 caractères')
    .max(13, 'La CNI doit contenir exactement 13 caractères'),
})

// Validation schema for location/rental information
export const locationInfoSchema = z.object({
  propertyType: z.enum(['studio', 'room', 'apartment', 'villa', 'other'], {
    errorMap: () => ({ message: 'Sélectionnez un type de bien valide' }),
  }),
  propertyName: z
    .string()
    .min(1, 'Le nom du bien est requis')
    .max(100, 'Le nom du bien ne peut pas dépasser 100 caractères'),
  startDate: z.string().min(1, 'La date de début est requise'),
  monthlyRent: z
    .number()
    .min(0, 'Le loyer ne peut pas être négatif')
    .max(10000000, 'Le loyer semble être invalide'),
})

// Validation schema for deposit information
export const depositInfoSchema = z
  .object({
    depositTotal: z.number().min(0, 'La caution totale ne peut pas être négative'),
    depositPaid: z.number().min(0, 'La caution payée ne peut pas être négative'),
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

// Type inference for form data
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>
export type LocationInfoFormData = z.infer<typeof locationInfoSchema>
export type DepositInfoFormData = z.infer<typeof depositInfoSchema>
export type CreateClientFormData = z.infer<typeof createClientSchema>

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
