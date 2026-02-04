import { z } from 'zod'

// Client validation
export const clientSchema = z.object({
  firstName: z.string().min(2, 'Prénom doit avoir au moins 2 caractères').trim(),
  lastName: z.string().min(2, 'Nom doit avoir au moins 2 caractères').trim(),
  phone: z
    .string()
    .min(8, 'Téléphone invalide')
    .regex(/^[\d+\s\-()]+$/, 'Format téléphone invalide'),
  cni: z.string().min(5, 'CNI invalide').max(20, 'CNI invalide'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().min(5, 'Adresse doit avoir au moins 5 caractères').optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>

// Rental validation
export const rentalSchema = z.object({
  propertyType: z.string().min(1, 'Type de propriété requis'),
  propertyName: z.string().min(2, 'Nom de propriété requis'),
  monthlyRent: z
    .number()
    .min(1000, 'Loyer mensuel doit être au minimum 1000')
    .max(100000000, 'Loyer mensuel invalide'),
  depositTotal: z.number().min(0, 'Dépôt doit être positif').optional().default(0),
  startDate: z
    .date()
    .refine((date) => date > new Date(), 'La date de début doit être dans le futur'),
})

export type RentalFormData = z.infer<typeof rentalSchema>

// Payment validation
export const paymentSchema = z.object({
  amount: z.number().min(1, 'Montant doit être au minimum 1').max(100000000, 'Montant invalide'),
  receiptId: z.string().optional(),
  date: z
    .date()
    .optional()
    .default(() => new Date()),
  notes: z.string().optional(),
})

export type PaymentFormData = z.infer<typeof paymentSchema>

// Deposit validation
export const depositSchema = z.object({
  amount: z.number().min(0, 'Montant doit être positif').max(100000000, 'Montant invalide'),
  receiptId: z.string().optional(),
  date: z
    .date()
    .optional()
    .default(() => new Date()),
  notes: z.string().optional(),
})

export type DepositFormData = z.infer<typeof depositSchema>
