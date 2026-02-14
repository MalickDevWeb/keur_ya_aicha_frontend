import type { Client, PropertyType } from '@/lib/types'
import { generateId } from '@/services/utils/ids'

export { generateId }

export const toIsoString = (value: unknown): unknown => {
  if (value instanceof Date) return value.toISOString()
  return value
}

export const normalizeClientStatus = (value: unknown): Client['status'] => {
  if (value === 'active' || value === 'archived' || value === 'blacklisted') return value
  return 'active'
}

export const normalizePropertyType = (value: unknown): PropertyType => {
  if (value === 'studio' || value === 'room' || value === 'apartment' || value === 'villa' || value === 'other') {
    return value
  }
  return 'other'
}
