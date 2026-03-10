import { z } from 'zod'

const REGEX_TELEPHONE_SN = /^(?:\+221|221|0)?\s?(70|75|76|77|78)\s?\d{3}\s?\d{2}\s?\d{2}$/
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const connexionSchema = z.object({
  telephone: z
    .string()
    .trim()
    .min(1, 'Identifiant requis (email ou téléphone)')
    .refine(
      (value) => REGEX_TELEPHONE_SN.test(value) || REGEX_EMAIL.test(value),
      'Identifiant invalide (email ou numéro Sénégal, ex: +221 77 123 45 67)'
    ),
  motDePasse: z.string().min(8, 'Mot de passe requis (8 caractères min.)'),
})

export type ConnexionFormData = z.infer<typeof connexionSchema>
