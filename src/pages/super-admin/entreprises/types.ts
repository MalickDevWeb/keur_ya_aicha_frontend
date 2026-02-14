import type { AdminDTO, AdminRequestDTO, EntrepriseDTO } from '@/dto/frontend/responses'

export type ViewMode = 'cards' | 'list'

export type EntrepriseRow = {
  entreprise: EntrepriseDTO
  admin?: AdminDTO
  request?: AdminRequestDTO
}
