import { z } from 'zod'

export const inscriptionAdminSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  password: z.string().min(6, 'Mot de passe requis (6 caractères min.)'),
  confirmPassword: z.string().min(6, 'Confirmation requise'),
  phone: z
    .string()
    .min(1, 'Numéro requis')
    .regex(
      /^(?:\+221|221|0)?\s?(70|75|76|77|78)\s?\d{3}\s?\d{2}\s?\d{2}$/,
      'Numéro Sénégal invalide (ex: +221 77 123 45 67)'
    ),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  entrepriseName: z.string().optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export type InscriptionAdminData = z.infer<typeof inscriptionAdminSchema>
