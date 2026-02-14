import { THEME_CLASSNAMES } from './constants'

export const applyThemeToDocument = (themeKey: string) => {
  const root = document.documentElement
  THEME_CLASSNAMES.forEach((name) => root.classList.remove(name))
  if (themeKey) root.classList.add(themeKey)
}

export const safeJsonParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}
