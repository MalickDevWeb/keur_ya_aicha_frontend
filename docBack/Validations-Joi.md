# Validations Joi pour toutes les entites

Cette proposition reproduit les validations actuelles (front + backend) et les rend executables cote API Next.js.

## 1. Installation
```bash
npm i joi
```

## 2. Fichier recommande: `modules/common/validators.ts`
```ts
import Joi from 'joi'

const monthKeyRegex = /^\d{4}-(0[1-9]|1[0-2])$/
const cniRegex = /^\d{13}$/

// Front login utilise 70/75/76/77/78.
const authPhoneRegex = /^(?:\+221|221|0)?\s?(70|75|76|77|78)\s?\d{3}\s?\d{2}\s?\d{2}$/

// Client/import helper actuel est plus strict (77/78).
const legacyClientPhoneRegex = /^(?:\+221)?(77|78)\d{7}$/

const usernameRegex = /^[a-zA-Z0-9_-]+$/
const receiptRegex = /^[a-zA-Z0-9\-/]+$/

export const idSchema = Joi.string().trim().min(1)

export const authLoginSchema = Joi.object({
  username: Joi.string().trim().min(1).required(),
  password: Joi.string().min(1).required(),
})

export const authPendingCheckSchema = authLoginSchema

export const superAdminSecondAuthSchema = Joi.object({
  password: Joi.string().min(1).required(),
})

export const impersonationSchema = Joi.object({
  adminId: Joi.string().trim().min(1).required(),
  adminName: Joi.string().trim().min(1).required(),
  userId: Joi.string().trim().allow('', null),
})

export const userCreateSchema = Joi.object({
  id: Joi.string().trim().optional(),
  username: Joi.string().trim().min(3).max(30).pattern(usernameRegex).required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().trim().allow('', null),
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'CLIENT').required(),
  status: Joi.string().trim().allow('', null),
})

export const adminCreateSchema = Joi.object({
  id: Joi.string().trim().optional(),
  userId: Joi.string().trim().required(),
  username: Joi.string().trim().min(3).max(30).pattern(usernameRegex).required(),
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().required(),
  status: Joi.string().valid('EN_ATTENTE', 'ACTIF', 'SUSPENDU', 'BLACKLISTE', 'ARCHIVE', 'INACTIF').optional(),
  entrepriseId: Joi.string().trim().allow('', null),
})

export const adminRequestCreateSchema = Joi.object({
  id: Joi.string().trim().optional(),
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().trim().pattern(authPhoneRegex).required(),
  entrepriseName: Joi.string().trim().allow('', null),
  username: Joi.string().trim().min(3).max(30).pattern(usernameRegex).allow('', null),
  password: Joi.string().min(6).allow('', null),
  paid: Joi.boolean().optional(),
  paidAt: Joi.date().iso().allow(null),
})

export const adminRequestUpdateSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).pattern(usernameRegex),
  password: Joi.string().min(6),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().trim().pattern(authPhoneRegex),
  entrepriseName: Joi.string().trim().allow('', null),
  status: Joi.string().valid('EN_ATTENTE', 'ACTIF', 'SUSPENDU', 'BLACKLISTE', 'ARCHIVE', 'INACTIF'),
  paid: Joi.boolean(),
  paidAt: Joi.date().iso().allow(null),
}).min(1)

export const entrepriseCreateSchema = Joi.object({
  id: Joi.string().trim().optional(),
  name: Joi.string().trim().min(1).max(120).required(),
  adminId: Joi.string().trim().allow('', null),
})

export const paymentRecordSchema = Joi.object({
  id: Joi.string().trim().required(),
  amount: Joi.number().positive().max(100000000).required(),
  date: Joi.date().iso().required(),
  receiptNumber: Joi.string().trim().pattern(receiptRegex).required(),
  note: Joi.string().max(500).allow('', null),
})

export const monthlyPaymentSchema = Joi.object({
  id: Joi.string().trim().required(),
  rentalId: Joi.string().trim().required(),
  periodStart: Joi.date().iso().required(),
  periodEnd: Joi.date().iso().required(),
  dueDate: Joi.date().iso().required(),
  amount: Joi.number().positive().max(100000000).required(),
  paidAmount: Joi.number().min(0).max(100000000).required(),
  status: Joi.string().valid('paid', 'partial', 'unpaid').required(),
  payments: Joi.array().items(paymentRecordSchema).required(),
})

export const rentalSchema = Joi.object({
  id: Joi.string().trim().required(),
  clientId: Joi.string().trim().required(),
  propertyType: Joi.string().valid('studio', 'room', 'apartment', 'villa', 'other').required(),
  propertyName: Joi.string().trim().min(1).max(100).required(),
  monthlyRent: Joi.number().positive().max(100000000).required(),
  startDate: Joi.date().iso().required(),
  deposit: Joi.object({
    total: Joi.number().min(0).max(100000000).required(),
    paid: Joi.number().min(0).max(100000000).required(),
    payments: Joi.array().items(paymentRecordSchema).required(),
  }).required(),
  payments: Joi.array().items(monthlyPaymentSchema).required(),
  documents: Joi.array().items(Joi.object()).required(),
})

export const clientCreateSchema = Joi.object({
  id: Joi.string().trim().optional(),
  adminId: Joi.string().trim().allow('', null),
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  phone: Joi.string().trim().pattern(legacyClientPhoneRegex).required(),
  email: Joi.string().email().allow('', null),
  cni: Joi.string().trim().pattern(cniRegex).allow('', null),
  status: Joi.string().valid('active', 'archived', 'blacklisted').default('active'),
  rentals: Joi.array().items(rentalSchema).default([]),
})

export const clientUpdateSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  phone: Joi.string().trim().pattern(legacyClientPhoneRegex),
  email: Joi.string().email().allow('', null),
  cni: Joi.string().trim().pattern(cniRegex).allow('', null),
  status: Joi.string().valid('active', 'archived', 'blacklisted'),
  rentals: Joi.array().items(rentalSchema),
}).min(1)

export const documentCreateSchema = Joi.object({
  id: Joi.string().trim().optional(),
  clientId: Joi.string().trim().allow('', null),
  rentalId: Joi.string().trim().allow('', null),
  name: Joi.string().trim().min(1).max(255).required(),
  type: Joi.string().valid('contract', 'receipt', 'other').default('other'),
  url: Joi.string().uri().required(),
  uploadedAt: Joi.date().iso().optional(),
  signed: Joi.boolean().default(false),
}).or('clientId', 'rentalId')

export const paymentCreateSchema = Joi.object({
  id: Joi.string().trim().optional(),
  rentalId: Joi.string().trim().required(),
  paymentId: Joi.string().trim().allow('', null),
  amount: Joi.number().positive().max(100000000).required(),
  receiptId: Joi.string().trim().allow('', null),
  date: Joi.date().iso().required(),
  receiptNumber: Joi.string().trim().pattern(receiptRegex).allow('', null),
  description: Joi.string().max(500).allow('', null),
})

export const depositCreateSchema = Joi.object({
  id: Joi.string().trim().optional(),
  rentalId: Joi.string().trim().required(),
  amount: Joi.number().positive().max(100000000).required(),
  receiptId: Joi.string().trim().allow('', null),
  date: Joi.date().iso().required(),
  description: Joi.string().max(500).allow('', null),
})

export const adminPaymentCreateSchema = Joi.object({
  id: Joi.string().trim().optional(),
  adminId: Joi.string().trim().allow('', null),
  entrepriseId: Joi.string().trim().allow('', null),
  amount: Joi.number().positive().max(100000000).required(),
  method: Joi.string().valid('wave', 'orange_money', 'cash').required(),
  provider: Joi.string().valid('stripe', 'wave', 'orange', 'manual').optional(),
  payerPhone: Joi.string().trim().allow('', null),
  transactionRef: Joi.string().trim().allow('', null),
  note: Joi.string().max(500).allow('', null),
  paidAt: Joi.date().iso().optional(),
  month: Joi.string().pattern(monthKeyRegex).optional(),
})

export const blockedIpCreateSchema = Joi.object({
  ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required(),
  reason: Joi.string().trim().max(255).allow('', null),
})

export const importRunCreateSchema = Joi.object({
  id: Joi.string().trim().optional(),
  adminId: Joi.string().trim().optional(),
  fileName: Joi.string().trim().min(1).required(),
  totalRows: Joi.number().integer().min(0).required(),
  inserted: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().allow('', null),
    })
  ).default([]),
  errors: Joi.array().items(
    Joi.object({
      rowNumber: Joi.number().integer().min(1).required(),
      errors: Joi.array().items(Joi.string().required()).required(),
      parsed: Joi.object().required(),
    })
  ).default([]),
  ignored: Joi.boolean().default(false),
  readSuccess: Joi.boolean().optional(),
  readErrors: Joi.boolean().optional(),
})

export const importRunPatchSchema = Joi.object({
  inserted: Joi.array().items(Joi.object()),
  errors: Joi.array().items(Joi.object()),
  ignored: Joi.boolean(),
  readSuccess: Joi.boolean(),
  readErrors: Joi.boolean(),
  updatedAt: Joi.date().iso(),
}).min(1)

export const settingSchema = Joi.object({
  id: Joi.string().trim().optional(),
  key: Joi.string().trim().required(),
  value: Joi.string().required(),
})

export const cloudinarySignSchema = Joi.object({
  folder: Joi.string().trim().allow('', null),
  public_id: Joi.string().trim().allow('', null),
})

export const cloudinaryOpenUrlSchema = Joi.object({
  url: Joi.string().uri().required(),
})

export function validateOrThrow<T>(schema: Joi.ObjectSchema<T>, payload: unknown): T {
  const { value, error } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  })
  if (error) {
    throw new Error(error.details.map((d) => d.message).join(', '))
  }
  return value as T
}
```

## 3. Note importante sur les telephones
- Ton code actuel contient deux comportements:
  - Auth: accepte `70|75|76|77|78`.
  - Client/import (helpers legacy): accepte surtout `77|78`.
- Si tu veux uniformiser sans regression, garde ces deux schemas separes au debut, puis migre progressivement.
