import ExcelJS from 'exceljs'
import {
  validateName,
  validateSenegalNumber,
  validateCNI,
} from '@/validators/frontend'

export type ClientImportMapping = {
  firstName?: number
  lastName?: number
  phone?: number
  email?: number
  cni?: number
  propertyType?: number
  propertyName?: number
  startDate?: number
  monthlyRent?: number
  depositTotal?: number
  depositPaid?: number
  status?: number
}

export type ClientImportRow = {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  cni?: string
  propertyType?: string
  propertyName?: string
  startDate?: Date | null
  monthlyRent?: number
  depositTotal?: number
  depositPaid?: number
  status?: string
}

export type ClientImportError = {
  rowIndex: number
  rowNumber: number
  errors: string[]
  raw: (string | number | Date | null)[]
  parsed: ClientImportRow
}

export type ClientImportResult = {
  headers: string[]
  rows: (string | number | Date | null)[][]
}

export const DEFAULT_IMPORT_ALIASES: Partial<Record<keyof ClientImportMapping, string[]>> = {
  firstName: ['prenom', 'prénom', 'first name', 'firstname'],
  lastName: ['nom', 'lastname', 'last name', 'surname', 'family'],
  phone: ['telephone', 'téléphone', 'phone', 'tel', 'mobile'],
  email: ['email', 'e-mail', 'mail'],
  cni: ['cni', 'cin', 'identite', 'identité', 'id'],
  propertyType: ['type', 'property type', 'type de bien'],
  propertyName: ['bien', 'property', 'adresse', 'location', 'logement'],
  startDate: ['date', 'start', 'debut', 'début'],
  monthlyRent: ['loyer', 'rent', 'monthly'],
  depositTotal: ['caution', 'deposit total', 'deposit'],
  depositPaid: ['payee', 'payé', 'paid', 'avance'],
  status: ['status', 'statut'],
}

export async function parseSpreadsheet(file: File): Promise<ClientImportResult> {
  const extension = file.name.toLowerCase()
  if (extension.endsWith('.csv')) {
    const text = await file.text()
    const data = parseCsv(text)
    const headers = (data[0] || []).map((h, i) => String(h || `Colonne ${i + 1}`))
    const rows = data.slice(1)
    return { headers, rows }
  }

  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    return { headers: [], rows: [] }
  }

  const rows: (string | number | Date | null)[][] = []
  let maxCols = 0
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    maxCols = Math.max(maxCols, row.cellCount)
    const values: (string | number | Date | null)[] = []
    for (let i = 1; i <= row.cellCount; i++) {
      values.push(normalizeCell(row.getCell(i).value))
    }
    rows.push(values)
  })

  const normalizedRows = rows.map((row) => {
    const next = [...row]
    if (next.length < maxCols) {
      while (next.length < maxCols) next.push('')
    }
    return next
  })

  const headers = (normalizedRows[0] || []).map((h, i) => String(h || `Colonne ${i + 1}`))
  const dataRows = normalizedRows.slice(1)
  return { headers, rows: dataRows }
}

function normalizeCell(value: ExcelJS.CellValue): string | number | Date | null {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text
    if ('result' in value) return value.result as string | number | Date | null
    if ('richText' in value) return value.richText.map((r) => r.text).join('')
    if ('hyperlink' in value) return value.text || value.hyperlink || ''
  }
  return value as string | number
}

function parseCsv(text: string): (string | number | Date | null)[][] {
  const rows: string[][] = []
  let current: string[] = []
  let value = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      value += '"'
      i++
      continue
    }
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (!inQuotes && (char === ',' || char === ';' || char === '\t')) {
      current.push(value)
      value = ''
      continue
    }
    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') i++
      current.push(value)
      rows.push(current)
      current = []
      value = ''
      continue
    }
    value += char
  }

  if (value.length > 0 || current.length > 0) {
    current.push(value)
    rows.push(current)
  }
  return rows
}

export function guessMapping(
  headers: string[],
  aliases: Partial<Record<keyof ClientImportMapping, string[]>> = DEFAULT_IMPORT_ALIASES
): ClientImportMapping {
  const normalized = headers.map((h) => h.toLowerCase().trim())
  const find = (predicates: string[] = []) => {
    const idx = normalized.findIndex((h) => predicates.some((p) => h.includes(p)))
    return idx >= 0 ? idx : undefined
  }
  return {
    firstName: find(aliases.firstName),
    lastName: find(aliases.lastName),
    phone: find(aliases.phone),
    email: find(aliases.email),
    cni: find(aliases.cni),
    propertyType: find(aliases.propertyType),
    propertyName: find(aliases.propertyName),
    startDate: find(aliases.startDate),
    monthlyRent: find(aliases.monthlyRent),
    depositTotal: find(aliases.depositTotal),
    depositPaid: find(aliases.depositPaid),
    status: find(aliases.status),
  }
}

function toStringSafe(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

function parseNumber(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') return undefined
  if (typeof val === 'number') return val
  const cleaned = String(val).replace(/\s/g, '').replace(',', '.')
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : undefined
}

function parseDate(val: unknown): Date | null {
  if (!val) return null
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val
  if (typeof val === 'number') {
    const epoch = new Date(Math.round((val - 25569) * 86400 * 1000))
    return Number.isNaN(epoch.getTime()) ? null : epoch
  }
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? null : d
}

function normalizePropertyType(value?: string): string | undefined {
  if (!value) return undefined
  const v = value.toLowerCase()
  if (v.includes('studio')) return 'studio'
  if (v.includes('room') || v.includes('chambre')) return 'room'
  if (v.includes('villa')) return 'villa'
  if (v.includes('appart') || v.includes('apartment')) return 'apartment'
  return 'other'
}

export function buildRow(
  row: (string | number | Date | null)[],
  mapping: ClientImportMapping,
  overrides?: Partial<ClientImportRow>
): ClientImportRow {
  const get = (idx?: number) => (idx === undefined ? '' : row[idx])
  const parsed: ClientImportRow = {
    firstName: toStringSafe(get(mapping.firstName)),
    lastName: toStringSafe(get(mapping.lastName)),
    phone: toStringSafe(get(mapping.phone)),
    email: toStringSafe(get(mapping.email)),
    cni: toStringSafe(get(mapping.cni)),
    propertyType: normalizePropertyType(toStringSafe(get(mapping.propertyType))),
    propertyName: toStringSafe(get(mapping.propertyName)),
    startDate: parseDate(get(mapping.startDate)),
    monthlyRent: parseNumber(get(mapping.monthlyRent)),
    depositTotal: parseNumber(get(mapping.depositTotal)),
    depositPaid: parseNumber(get(mapping.depositPaid)),
    status: toStringSafe(get(mapping.status)),
  }
  return { ...parsed, ...(overrides || {}) }
}

export function validateRow(row: ClientImportRow): string[] {
  const errors: string[] = []
  if (!row.firstName) errors.push('Prénom manquant (obligatoire)')
  else if (!validateName(row.firstName)) errors.push('Prénom invalide (au moins 2 lettres)')

  if (!row.lastName) errors.push('Nom manquant (obligatoire)')
  else if (!validateName(row.lastName)) errors.push('Nom invalide (au moins 2 lettres)')

  if (!row.phone) errors.push('Téléphone manquant (obligatoire)')
  else if (!validateSenegalNumber(row.phone)) {
    errors.push('Téléphone invalide (format attendu: +221771234567 ou 771234567)')
  }

  if (row.cni && !validateCNI(row.cni)) {
    errors.push('CNI invalide (13 chiffres attendus)')
  }

  return errors
}
