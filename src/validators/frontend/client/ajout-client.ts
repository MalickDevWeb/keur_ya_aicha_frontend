import { z } from 'zod'
import {
  validateCNI,
  validateEmail,
  validateName,
  validatePropertyName,
  validateSenegalNumber,
} from '@/validators/frontend/client/helpers'

export const ajoutClientSchema = z
  .object({
    lastName: z
      .string()
      .min(1, 'Le nom est requis')
      .refine(validateName, 'Le nom doit contenir au moins 2 lettres (pas de chiffres)'),
    firstName: z
      .string()
      .min(1, 'Le prénom est requis')
      .refine(validateName, 'Le prénom doit contenir au moins 2 lettres (pas de chiffres)'),
    phone: z
      .string()
      .min(1, 'Le numéro de téléphone est requis')
      .refine(validateSenegalNumber, 'Numéro sénégalais invalide. Format: +221 77 123 45 67'),
    cni: z
      .string()
      .min(1, 'La CNI est requise')
      .refine(validateCNI, 'La CNI doit contenir 13 caractères alphanumériques'),
    email: z.string().optional().refine((value) => !value || validateEmail(value), 'Email invalide'),
    propertyType: z.enum(['studio', 'room', 'apartment', 'villa', 'other']),
    propertyName: z
      .string()
      .min(1, 'Le nom du bien est requis')
      .refine(validatePropertyName, 'Le nom du bien est invalide'),
    startDate: z.string().min(1, 'La date de début est requise'),
    monthlyRent: z.number().min(1000, 'Le loyer minimum est 1000'),
    totalDeposit: z.number().min(0, 'La caution totale invalide'),
    paidDeposit: z.number().min(0, 'La caution payée invalide'),
  })
  .refine((data) => data.paidDeposit <= data.totalDeposit, {
    message: 'La caution payée ne peut pas dépasser le total',
    path: ['paidDeposit'],
  })

export type AjoutClientFormData = z.infer<typeof ajoutClientSchema>
