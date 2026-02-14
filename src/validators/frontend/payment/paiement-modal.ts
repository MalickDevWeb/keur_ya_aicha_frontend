import { z } from 'zod'

export const paiementModalSchema = z.object({
  amount: z
    .string()
    .min(1, 'Le montant est requis')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'Le montant doit être un nombre positif'
    )
    .refine(
      (val) => Number(val) < 100000000,
      'Le montant semble être invalide'
    ),
  date: z.string().min(1, 'La date est requise'),
  receiptNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-zA-Z0-9\-/]+$/.test(val),
      'Le numéro de reçu est invalide'
    ),
  notes: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Les notes ne peuvent pas dépasser 500 caractères'
    ),
})

export type PaiementModalFormData = z.infer<typeof paiementModalSchema>
