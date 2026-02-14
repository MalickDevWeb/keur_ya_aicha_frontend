/**
 * Centralized formatters for common data transformations
 * Eliminates scattered formatting logic across components
 */

/**
 * Format date to locale string
 * @param date - Date to format
 * @returns Formatted date (e.g., "09/02/2026")
 */
export function formatDate(date: string | Date): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR')
}

/**
 * Format datetime with time
 * @param date - Date to format
 * @returns Formatted datetime (e.g., "09/02/2026 14:30")
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format phone number (assuming Senegal/West Africa format)
 * @param phone - Phone number string
 * @returns Formatted phone (e.g., "771 23 45 67")
 */
export function formatPhone(phone: string): string {
  if (!phone) return '-'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 9) return phone
  return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
}

/**
 * Format currency in XOF (West African CFA franc)
 * @param amount - Amount in XOF
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted currency (e.g., "100 000 XOF")
 */
export function formatCurrency(amount: number, decimals = 0): string {
  if (typeof amount !== 'number') return '-'
  return amount.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format percentage
 * @param value - Decimal value (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage (e.g., "75%")
 */
export function formatPercentage(value: number, decimals = 0): string {
  if (typeof value !== 'number') return '-'
  return (
    (value * 100).toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + '%'
  )
}

/**
 * Format enum/status values to display text
 * @param status - Status value
 * @param translations - Translation map
 * @returns Formatted status text
 */
export function formatStatus(status: string, translations: Record<string, string> = {}): string {
  return translations[status] || status
}

/**
 * Capitalize first letter
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string): string {
  if (!text) return '-'
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Format name (first letter uppercase)
 * @param name - Name to format
 * @returns Formatted name
 */
export function formatName(name: string): string {
  if (!name) return '-'
  return name
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ')
}

/**
 * Format email
 * @param email - Email to format
 * @returns Email (masked if too long for display)
 */
export function formatEmail(email: string): string {
  if (!email) return '-'
  if (email.length > 30) {
    return email.substring(0, 27) + '...'
  }
  return email
}

/**
 * Formatter object with all functions
 * @example
 * import { Formatters } from '@/lib/formatters'
 * Formatters.date(now)
 * Formatters.currency(100000)
 */
export const Formatters = {
  date: formatDate,
  dateTime: formatDateTime,
  phone: formatPhone,
  currency: formatCurrency,
  percentage: formatPercentage,
  status: formatStatus,
  capitalize,
  name: formatName,
  email: formatEmail,
}
