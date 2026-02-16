import type { ClientImportError, ClientImportMapping } from '@/lib/importClients'

export type RowOverrides = Record<number, { firstName?: string; lastName?: string; phone?: string; cni?: string }>

export type ImportState = {
  fileName: string
  headers: string[]
  rows: (string | number | Date | null)[][]
  mapping: ClientImportMapping
  errors: ClientImportError[]
  overrides: RowOverrides
  isImporting: boolean
  showFix: boolean
}
