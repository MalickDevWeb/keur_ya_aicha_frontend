import { SECTION_IDS } from './constants'

const SECTION_ID_SET = new Set<string>(Object.values(SECTION_IDS))

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

export function buildSuperAdminSectionHash(rawHash: string, sectionId: string): string {
  const normalizedSection = String(sectionId || '')
    .trim()
    .replace(/^#+/, '')
  if (!normalizedSection) return String(rawHash || '')

  const current = String(rawHash || '').trim()
  if (current.startsWith('#/')) {
    const baseRoute = current.slice(1).split('#')[0] || '/'
    return `#${baseRoute}#${normalizedSection}`
  }
  return `#${normalizedSection}`
}
