export type CreatedAdmin = {
  name: string
  username: string
  email?: string
  entreprise?: string
  password: string
  phone?: string
  createdAt: string
}

export type AdminAction = {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  action: () => void
}

export type PaymentDistributionEntry = { name: string; value: number }
