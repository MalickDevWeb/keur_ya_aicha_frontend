type DocumentKind = 'contract' | 'receipt' | 'payment' | 'deposit' | 'other'

type ReadableDocumentNameInput = {
  name?: string | null
  type?: string | null
  context?: string | null
  uploadedAt?: string | number | Date | null
}

const TECHNICAL_NAME_PATTERNS: RegExp[] = [
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  /^id_[a-z0-9_]+$/i,
  /^(doc|document|file|payment|deposit|receipt|contract)[-_]?[a-z0-9]{6,}$/i,
  /^[a-f0-9]{24,}$/i,
  /^[0-9]{10,}$/,
]

const TECHNICAL_CHARS_PATTERN = /^[a-z0-9_-]+$/i

function normalizeText(value: unknown): string {
  return String(value || '').trim()
}

function resolveDocumentLabel(type: string): string {
  const normalized = normalizeText(type).toLowerCase() as DocumentKind
  if (normalized === 'contract') return 'Contrat'
  if (normalized === 'receipt' || normalized === 'payment') return 'Reçu'
  if (normalized === 'deposit') return 'Caution'
  return 'Document'
}

function formatDayLabel(value: string | number | Date | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function isTechnicalIdentifier(value: unknown): boolean {
  const normalized = normalizeText(value)
  if (!normalized) return false

  for (const pattern of TECHNICAL_NAME_PATTERNS) {
    if (pattern.test(normalized)) return true
  }

  if (!TECHNICAL_CHARS_PATTERN.test(normalized)) return false
  if (normalized.includes('-') || normalized.includes('_')) return normalized.length >= 18
  return normalized.length >= 20
}

export function buildReadableDocumentName(input: ReadableDocumentNameInput): string {
  const explicitName = normalizeText(input.name)
  if (explicitName && !isTechnicalIdentifier(explicitName)) {
    return explicitName
  }

  const label = resolveDocumentLabel(normalizeText(input.type))
  const context = normalizeText(input.context)
  if (context && !isTechnicalIdentifier(context)) {
    return `${label} - ${context}`
  }

  const dayLabel = formatDayLabel(input.uploadedAt)
  if (dayLabel) {
    return `${label} (${dayLabel})`
  }

  return label
}

export function toSafeFileBaseName(value: string): string {
  const normalized = normalizeText(value)
  const fallback = 'document'
  const sanitized = normalized
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '')
    .trim()
  return sanitized || fallback
}
