import { z } from 'zod'
import { validatePropertyName } from '@/validators/frontend/client/helpers'

export const ajoutLocationSchema = z.object({
  propertyName: z
    .string()
    .min(1, 'Le nom du bien est requis')
    .refine(validatePropertyName, 'Le nom du bien est invalide'),
  propertyType: z.enum(['studio', 'room', 'apartment', 'villa', 'other'], {
    errorMap: () => ({ message: 'Sélectionnez un type de bien valide' }),
  }),
  monthlyRent: z
    .string()
    .min(1, 'Le loyer est requis')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'Le loyer doit être un nombre positif'
    )
    .refine(
      (val) => Number(val) < 100000000,
      'Le loyer semble être invalide'
    ),
  depositTotal: z
    .string()
    .min(1, 'La caution est requise')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      'La caution doit être un nombre positif'
    ),
  depositPaid: z.string().optional(),
  startDate: z.string().min(1, 'La date de début est requise'),
})

export type AjoutLocationFormData = z.infer<typeof ajoutLocationSchema>
