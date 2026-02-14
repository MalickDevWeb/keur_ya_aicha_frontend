import type { AdminDTO, EntrepriseDTO } from '@/dto/frontend/responses'

export type ViewMode = 'cards' | 'list'

export type AdminRow = {
  admin: AdminDTO
  entreprises: EntrepriseDTO[]
}
