export type AdminStatus =
  | 'EN_ATTENTE'
  | 'ACTIF'
  | 'SUSPENDU'
  | 'BLACKLISTE'
  | 'ARCHIVE'

export const ADMIN_STATUS_LABELS: Record<AdminStatus, string> = {
  EN_ATTENTE: 'En attente',
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  BLACKLISTE: 'Blacklisté',
  ARCHIVE: 'Archivé',
}

export const ADMIN_STATUS_COLORS: Record<AdminStatus, string> = {
  EN_ATTENTE: 'bg-slate-100 text-slate-700 border-slate-300',
  ACTIF: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  SUSPENDU: 'bg-amber-100 text-amber-700 border-amber-300',
  BLACKLISTE: 'bg-red-100 text-red-700 border-red-300',
  ARCHIVE: 'bg-gray-100 text-gray-700 border-gray-300',
}

export const ADMIN_STATUS_BADGE_COLORS: Record<AdminStatus, string> = {
  EN_ATTENTE: 'bg-slate-500',
  ACTIF: 'bg-emerald-500',
  SUSPENDU: 'bg-amber-500',
  BLACKLISTE: 'bg-red-500',
  ARCHIVE: 'bg-gray-500',
}

export interface AdminDTO {
  id: string
  userId: string
  adminRequestId?: string
  username: string
  name: string
  email: string
  status: AdminStatus
  entrepriseId?: string
  createdAt?: string
}

export interface AdminRequestDTO {
  id: string
  name: string
  email?: string
  phone?: string
  entrepriseName?: string
  status: AdminStatus
  username?: string
  password?: string
  paid?: boolean
  paidAt?: string
  createdAt?: string
}
