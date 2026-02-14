import { z } from 'zod'

export const connexionSchema = z.object({
  telephone: z
    .string()
    .min(1, 'Téléphone requis')
    .regex(
      /^(?:\+221|221|0)?\s?(70|75|76|77|78)\s?\d{3}\s?\d{2}\s?\d{2}$/,
      'Numéro Sénégal invalide (ex: +221 77 123 45 67)'
    ),
  motDePasse: z.string().min(1, 'Mot de passe requis'),
})

export type ConnexionFormData = z.infer<typeof connexionSchema>
