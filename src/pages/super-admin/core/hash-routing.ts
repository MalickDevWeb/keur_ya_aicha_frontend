import { SECTION_IDS } from './constants'

const SECTION_ID_SET = new Set<string>(Object.values(SECTION_IDS))
const SECTION_QUERY_KEY = 'section'

function normalizeSectionId(value: string): string {
  return String(value || '')
    .trim()
    .replace(/^#+/, '')
}

export function extractSuperAdminSectionHash(rawHash: string): string | null {
  const fragments = String(rawHash || '')
    .split('#')
    .map((part) => part.trim())
    .filter(Boolean)

  if (fragments.length === 0) return null
  const candidate = fragments[fragments.length - 1]
  if (!SECTION_ID_SET.has(candidate)) return null
  return candidate
}

export function extractSuperAdminSectionSearch(rawSearch: string): string | null {
  const search = String(rawSearch || '').trim().replace(/^\?/, '')
  if (!search) return null
  const params = new URLSearchParams(search)
  const candidate = normalizeSectionId(params.get(SECTION_QUERY_KEY) || '')
  if (!candidate || !SECTION_ID_SET.has(candidate)) return null
  return candidate
}

export function buildSuperAdminSectionSearch(rawSearch: string, sectionId: string): string {
  const normalizedSection = normalizeSectionId(sectionId)
  if (!normalizedSection) return String(rawSearch || '')

  const params = new URLSearchParams(String(rawSearch || '').trim().replace(/^\?/, ''))
  params.set(SECTION_QUERY_KEY, normalizedSection)
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}
