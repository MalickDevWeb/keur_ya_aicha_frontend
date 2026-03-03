# DTOs Next.js + PostgreSQL (alignes sur ton projet)

Les DTO ci-dessous reprennent les contrats utilises actuellement par :
- `src/dto/backend/requests/*`
- `src/dto/backend/responses/*`
- `src/dto/frontend/requests/*`
- `src/dto/frontend/responses/*`

Utilise ces types dans `modules/*/dto.ts`.

## 1. Enums metier
```ts
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT'
export type AdminStatus = 'EN_ATTENTE' | 'ACTIF' | 'SUSPENDU' | 'BLACKLISTE' | 'ARCHIVE' | 'INACTIF'
export type ClientStatus = 'active' | 'archived' | 'blacklisted'

export type PropertyType = 'studio' | 'room' | 'apartment' | 'villa' | 'other'

export type AdminPaymentMethod = 'wave' | 'orange_money' | 'cash'
export type AdminPaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled'
export type PaymentProvider = 'stripe' | 'wave' | 'orange' | 'manual'

export type DocumentType = 'contract' | 'receipt' | 'other'
```

## 2. Auth DTO
```ts
export type AuthLoginRequestDTO = {
  username: string
  password: string
}

export type AuthUserDTO = {
  id: string
  username: string
  name: string
  email: string
  role: UserRole
  status?: string
  subscriptionBlocked?: boolean
  subscriptionOverdueMonth?: string | null
  subscriptionDueAt?: string | null
  subscriptionRequiredMonth?: string | null
  superAdminSecondAuthRequired?: boolean
}

export type AuthResponseDTO = {
  user: AuthUserDTO | null
  impersonation?: {
    adminId: string
    adminName: string
    userId?: string | null
  } | null
}
```

## 3. Users / Admins / Entreprises
```ts
export type UserDTO = {
  id: string
  username: string
  password?: string
  name: string
  email?: string
  phone?: string
  role: UserRole
  status?: string
  createdAt?: string
  updatedAt?: string
}

export type UserCreateDTO = {
  id?: string
  username: string
  password: string
  name: string
  email?: string
  phone?: string
  role: UserRole
  status?: string
}

export type AdminDTO = {
  id: string
  userId: string
  username: string
  name: string
  email: string
  status: AdminStatus
  entrepriseId?: string
  paid?: boolean
  paidAt?: string | null
  createdAt?: string
}

export type AdminCreateDTO = {
  id?: string
  userId: string
  username: string
  name: string
  email: string
  status?: AdminStatus
  entrepriseId?: string
}

export type AdminUpdateDTO = Partial<Pick<AdminDTO, 'username' | 'name' | 'email' | 'status' | 'entrepriseId'>>

export type AdminRequestDTO = {
  id: string
  name: string
  email?: string
  phone?: string
  entrepriseName?: string
  status: AdminStatus
  username?: string
  password?: string
  paid?: boolean
  paidAt?: string | null
  createdAt?: string
}

export type AdminRequestCreateDTO = {
  id?: string
  name: string
  email?: string
  phone: string
  entrepriseName?: string
  username?: string
  password?: string
  paid?: boolean
  paidAt?: string | null
}

export type EntrepriseDTO = {
  id: string
  name: string
  adminId?: string
  createdAt?: string
}
```

## 4. Clients / Rentals / Documents
```ts
export type PaymentRecordDTO = {
  id: string
  amount: number
  date: string
  receiptNumber: string
  note?: string
}

export type MonthlyPaymentDTO = {
  id: string
  rentalId: string
  periodStart: string
  periodEnd: string
  dueDate: string
  amount: number
  paidAmount: number
  status: 'paid' | 'partial' | 'unpaid'
  payments: PaymentRecordDTO[]
}

export type RentalDTO = {
  id: string
  clientId: string
  propertyType: PropertyType
  propertyName: string
  monthlyRent: number
  startDate: string
  deposit: {
    total: number
    paid: number
    payments: PaymentRecordDTO[]
  }
  payments: MonthlyPaymentDTO[]
  documents: DocumentDTO[]
}

export type ClientDTO = {
  id: string
  adminId?: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  cni?: string
  status: ClientStatus
  createdAt: string
  rentals: RentalDTO[]
}

export type ClientCreateDTO = {
  id?: string
  adminId?: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  cni?: string
  status?: ClientStatus
  rentals?: RentalDTO[]
}

export type ClientUpdateDTO = Partial<Omit<ClientCreateDTO, 'adminId'>>

export type DocumentDTO = {
  id: string
  clientId?: string
  rentalId?: string
  name: string
  type: DocumentType
  url: string
  uploadedAt: string
  signed: boolean
}

export type DocumentCreateDTO = {
  id?: string
  clientId?: string
  rentalId?: string
  name: string
  type?: DocumentType
  url: string
  uploadedAt?: string
  signed?: boolean
}
```

## 5. Paiements et cautions (legacy)
```ts
export type PaymentDTO = {
  id: string
  rentalId: string
  paymentId?: string
  amount: number
  receiptId?: string
  date: string
  description?: string
}

export type PaymentCreateDTO = {
  id?: string
  rentalId: string
  paymentId?: string
  amount: number
  receiptId?: string
  date: string
  receiptNumber?: string
  description?: string
}

export type DepositDTO = {
  id: string
  rentalId: string
  amount: number
  receiptId?: string
  date: string
  status?: 'pending' | 'completed' | 'failed'
  description?: string
}

export type DepositCreateDTO = {
  id?: string
  rentalId: string
  amount: number
  receiptId?: string
  date: string
  description?: string
}
```

## 6. Admin payments
```ts
export type AdminPaymentDTO = {
  id: string
  adminId: string
  entrepriseId?: string
  amount: number
  method: AdminPaymentMethod
  status: AdminPaymentStatus
  provider?: PaymentProvider
  providerReference?: string
  checkoutUrl?: string
  payerPhone?: string
  transactionRef?: string
  note?: string
  paidAt?: string | null
  month: string // YYYY-MM
  approvedAt?: string | null
  approvedBy?: string | null
  providerPayload?: Record<string, unknown> | null
  initiatedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type AdminPaymentCreateDTO = {
  id?: string
  adminId?: string
  entrepriseId?: string
  amount: number
  method: AdminPaymentMethod
  provider?: PaymentProvider
  payerPhone?: string
  transactionRef?: string
  note?: string
  paidAt?: string
  month?: string
}

export type AdminPaymentStatusDTO = {
  adminId: string
  blocked: boolean
  overdueMonth: string | null
  dueAt: string | null
  requiredMonth: string
  currentMonth: string
  graceDays: number
}
```

## 7. Imports / Undo / Security / Ops
```ts
export type ImportRunRowDTO = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
}

export type ImportRunErrorDTO = {
  rowNumber: number
  errors: string[]
  parsed: Record<string, unknown>
}

export type ImportRunDTO = {
  id: string
  adminId: string
  fileName: string
  totalRows: number
  inserted: ImportRunRowDTO[]
  errors: ImportRunErrorDTO[]
  ignored: boolean
  readSuccess: boolean
  readErrors: boolean
  createdAt: string
  updatedAt?: string
}

export type UndoActionDTO = {
  id: string
  resource: string
  resourceId?: string | null
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  actorId?: string | null
  createdAt: string
  expiresAt: string
  path?: string
  rollback: Record<string, unknown>
  sideEffects?: Record<string, unknown> | null
}

export type AuditLogDTO = {
  id: string
  actor?: string
  action: string
  targetType?: string
  targetId?: string
  message?: string
  ipAddress?: string
  createdAt?: string
}

export type NotificationDTO = {
  id: string
  user_id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

export type BlockedIpDTO = {
  id: string
  ip: string
  reason?: string
  createdAt?: string
}

export type SettingDTO = {
  id: string
  key: string
  value: string
}

export type WorkItemDTO = {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  assignee?: string
  createdAt?: string
  updatedAt?: string
}
```
