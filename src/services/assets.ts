const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z\d+\-.]*:|\/\/)/i

export const DEFAULT_LOGO_ASSET_PATH = '/logo.png'
export const DEFAULT_VIDEO_ASSET_PATH = '/VIDEO.mp4'

export function resolveAssetUrl(path: string): string {
  const rawPath = String(path || '').trim()
  if (!rawPath) return ''

  if (ABSOLUTE_URL_PATTERN.test(rawPath) || rawPath.startsWith('data:') || rawPath.startsWith('blob:')) {
    return rawPath
  }

  const normalizedPath = rawPath.replace(/^\.\//, '').replace(/^\/+/, '')
  const baseUrl = String(import.meta.env.BASE_URL || '/')
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const relativePath = `${normalizedBase}${normalizedPath}`

  if (typeof window !== 'undefined' && window.location?.href) {
    try {
      return new URL(relativePath, window.location.href).toString()
    } catch {
      return relativePath
    }
  }

  return relativePath
}
