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

type SpreadsheetCell = string | number | Date | null

export const DEFAULT_IMPORT_ALIASES: Partial<Record<keyof ClientImportMapping, string[]>> = {
  firstName: ['prenom', 'prénom', 'first name', 'firstname'],
  lastName: ['nom', 'lastname', 'last name', 'surname', 'family'],
  phone: ['telephone', 'téléphone', 'phone', 'tel', 'mobile'],
  email: ['email', 'e-mail', 'mail'],
  cni: ['cni', 'cin', 'identite', 'identité', 'numéro cni', 'numero cni'],
  propertyType: ['type', 'property type', 'type de bien'],
  propertyName: ['bien', 'property', 'adresse', 'location', 'logement'],
  startDate: ['date', 'start', 'debut', 'début'],
  monthlyRent: ['loyer', 'rent', 'monthly'],
  depositTotal: ['caution', 'deposit total', 'deposit'],
  depositPaid: ['payee', 'payé', 'paid', 'avance'],
  status: ['status', 'statut'],
}

export const CLIENT_IMPORT_FIELDS: Array<keyof ClientImportMapping> = [
  'firstName',
  'lastName',
  'phone',
  'email',
  'cni',
  'propertyType',
  'propertyName',
  'startDate',
  'monthlyRent',
  'depositTotal',
  'depositPaid',
  'status',
]

export const FIELD_LABELS: Record<keyof ClientImportMapping, string> = {
  firstName: 'Prénom',
  lastName: 'Nom',
  phone: 'Téléphone',
  email: 'Email',
  cni: 'CNI',
  propertyType: 'Type de bien',
  propertyName: 'Bien',
  startDate: 'Date de début',
  monthlyRent: 'Loyer mensuel',
  depositTotal: 'Caution totale',
  depositPaid: 'Caution payée',
  status: 'Statut',
}

export const DEFAULT_REQUIRED_FIELDS: Array<keyof ClientImportMapping> = [
  'firstName',
  'lastName',
  'phone',
  'cni',
]

export async function parseSpreadsheet(file: File): Promise<ClientImportResult> {
  const extension = file.name.toLowerCase()
  if (extension.endsWith('.json')) {
    const text = await readFileAsText(file)
    return parseJsonContent(text)
  }

  if (extension.endsWith('.csv')) {
    const text = await readFileAsText(file)
    const data = parseCsv(text)
    const headers = (data[0] || []).map((h, i) => String(h || `Colonne ${i + 1}`))
    const rows = data.slice(1)
    return { headers, rows }
  }

  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(buffer)
  } catch {
    throw new Error('Format non supporté. Utilisez un fichier Excel (.xlsx), CSV (.csv) ou JSON (.json).')
  }
  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    return { headers: [], rows: [] }
  }

  const rows: SpreadsheetCell[][] = []
  let maxCols = 0
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    maxCols = Math.max(maxCols, row.cellCount)
    const values: SpreadsheetCell[] = []
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

async function readFileAsText(file: File): Promise<string> {
  const maybeText = (file as File & { text?: () => Promise<string> }).text
  if (typeof maybeText === 'function') {
    return maybeText.call(file)
  }
  const buffer = await file.arrayBuffer()
  return new TextDecoder().decode(buffer)
}

function normalizeCell(value: ExcelJS.CellValue): SpreadsheetCell {
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

function parseCsv(text: string): SpreadsheetCell[][] {
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

function parseJsonContent(text: string): ClientImportResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return { headers: [], rows: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new Error('JSON invalide. Vérifiez le format du fichier.')
  }

  const normalizedArray = normalizeJsonRoot(parsed)
  if (normalizedArray.length === 0) {
    return { headers: [], rows: [] }
  }

  if (normalizedArray.every((item) => isPlainObject(item))) {
    const objectRows = normalizedArray as Array<Record<string, unknown>>
    const headers = collectJsonHeaders(objectRows)
    const rows = objectRows.map((row) => headers.map((header) => normalizeJsonCell(row[header])))
    return { headers, rows }
  }

  if (normalizedArray.every(Array.isArray)) {
    return parseJsonArrayRows(normalizedArray as unknown[][])
  }

  throw new Error(
    'Format JSON non supporté. Utilisez un tableau d’objets, par exemple: [{"firstName":"Awa","lastName":"Diop"}].'
  )
}

function normalizeJsonRoot(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (!isPlainObject(value)) {
    throw new Error(
      'Format JSON non supporté. Utilisez un tableau d’objets, par exemple: [{"firstName":"Awa","lastName":"Diop"}].'
    )
  }

  const knownArrayKeys = ['rows', 'data', 'clients', 'items', 'records']
  for (const key of knownArrayKeys) {
    const candidate = value[key]
    if (Array.isArray(candidate)) return candidate
  }

  return [value]
}

function parseJsonArrayRows(rows: unknown[][]): ClientImportResult {
  if (rows.length === 0) return { headers: [], rows: [] }

  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0)
  if (maxCols === 0) return { headers: [], rows: [] }

  const firstRow = rows[0] || []
  const firstRowIsHeader = firstRow.length > 0 && firstRow.every((cell) => typeof cell === 'string')

  const headers = firstRowIsHeader
    ? firstRow.map((value, index) => String(value || `Colonne ${index + 1}`))
    : Array.from({ length: maxCols }, (_, index) => `Colonne ${index + 1}`)

  const dataRows = firstRowIsHeader ? rows.slice(1) : rows
  const normalizedRows = dataRows.map((row) => {
    const values = headers.map((_, index) => normalizeJsonCell(row[index]))
    return values
  })

  return { headers, rows: normalizedRows }
}

function collectJsonHeaders(rows: Array<Record<string, unknown>>): string[] {
  const headers: string[] = []
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) headers.push(key)
    }
  }
  return headers
}

function normalizeJsonCell(value: unknown): SpreadsheetCell {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

function normalizePhoneInput(val: unknown): string {
  const raw = toStringSafe(val)
  if (!raw) return ''

  const compact = raw.replace(/\s|-/g, '')
  if (compact.startsWith('+')) {
    return `+${compact.slice(1).replace(/\D/g, '')}`
  }
  return compact.replace(/\D/g, '')
}

function normalizeCniInput(val: unknown): string {
  const raw = toStringSafe(val)
  if (!raw) return ''
  return raw.replace(/\D/g, '')
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
    phone: normalizePhoneInput(get(mapping.phone)),
    email: toStringSafe(get(mapping.email)),
    cni: normalizeCniInput(get(mapping.cni)),
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

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

export function hasRentalData(row: ClientImportRow): boolean {
  return (
    hasValue(row.propertyType) ||
    hasValue(row.propertyName) ||
    hasValue(row.startDate) ||
    hasValue(row.monthlyRent) ||
    hasValue(row.depositTotal) ||
    hasValue(row.depositPaid)
  )
}

export function validateRow(
  row: ClientImportRow,
  requiredFields: Array<keyof ClientImportMapping> = DEFAULT_REQUIRED_FIELDS
): string[] {
  const errors: string[] = []
  const isRequired = (field: keyof ClientImportMapping) => requiredFields.includes(field)

  if (isRequired('firstName') && !row.firstName) errors.push('Prénom manquant (obligatoire)')
  if (row.firstName && !validateName(row.firstName)) errors.push('Prénom invalide (au moins 2 lettres)')

  if (isRequired('lastName') && !row.lastName) errors.push('Nom manquant (obligatoire)')
  if (row.lastName && !validateName(row.lastName)) errors.push('Nom invalide (au moins 2 lettres)')

  if (isRequired('phone') && !row.phone) errors.push('Téléphone manquant (obligatoire)')
  if (row.phone && !validateSenegalNumber(row.phone)) {
    errors.push('Téléphone invalide (format attendu: +221771234567 ou 771234567)')
  }

  if (isRequired('cni') && !row.cni) errors.push('CNI manquant (obligatoire)')
  if (row.cni && !validateCNI(row.cni)) {
    errors.push('CNI invalide (13 chiffres attendus)')
  }

  if (isRequired('email') && !row.email) errors.push('Email manquant (obligatoire)')
  if (isRequired('propertyType') && !row.propertyType) errors.push('Type de bien manquant (obligatoire)')
  if (isRequired('propertyName') && !row.propertyName) errors.push('Bien manquant (obligatoire)')
  if (isRequired('startDate') && !row.startDate) errors.push('Date de début manquante (obligatoire)')
  if (isRequired('monthlyRent') && (row.monthlyRent === undefined || row.monthlyRent === null)) {
    errors.push('Loyer mensuel manquant (obligatoire)')
  }
  if (isRequired('depositTotal') && (row.depositTotal === undefined || row.depositTotal === null)) {
    errors.push('Caution totale manquante (obligatoire)')
  }
  if (isRequired('depositPaid') && (row.depositPaid === undefined || row.depositPaid === null)) {
    errors.push('Caution payée manquante (obligatoire)')
  }
  if (isRequired('status') && !row.status) errors.push('Statut manquant (obligatoire)')

  if (hasRentalData(row) && !row.propertyName && !isRequired('propertyName')) {
    errors.push('Bien manquant (obligatoire pour créer une location)')
  }

  return errors
}
