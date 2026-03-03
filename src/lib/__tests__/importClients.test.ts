import { describe, expect, it } from 'vitest'
import { hasRentalData, validateRow } from '@/lib/importClients'

describe('import clients location rules', () => {
  const baseRow = {
    firstName: 'Awa',
    lastName: 'Diop',
    phone: '+221771234567',
    cni: '1234567890123',
  }

  it('accepts a client with no rental data', () => {
    const errors = validateRow(baseRow)
    expect(errors).toEqual([])
    expect(hasRentalData(baseRow)).toBe(false)
  })

  it('rejects partial rental data without property name', () => {
    const errors = validateRow({
      ...baseRow,
      monthlyRent: 250000,
    })
    expect(errors).toContain('Bien manquant (obligatoire pour créer une location)')
  })

  it('accepts rental data when property name is provided', () => {
    const errors = validateRow({
      ...baseRow,
      propertyName: 'Appartement F3',
      monthlyRent: 250000,
      depositTotal: 500000,
      depositPaid: 100000,
    })
    expect(errors).toEqual([])
    expect(
      hasRentalData({
        ...baseRow,
        propertyName: 'Appartement F3',
      })
    ).toBe(true)
  })
})
