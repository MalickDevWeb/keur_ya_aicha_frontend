import {
  validateSenegalNumber,
  validateCNI,
  validateName,
  validatePropertyName,
  validateAmount,
  validateDate,
  formatPhoneNumber,
  formatCNI,
  formatName,
} from './clientValidator'

describe('clientValidator helpers', () => {
  test('validateSenegalNumber accepts valid formats', () => {
    expect(validateSenegalNumber('+221771234567')).toBe(true)
    expect(validateSenegalNumber('+221 77 123 45 67')).toBe(true)
    expect(validateSenegalNumber('771234567')).toBe(true)
    expect(validateSenegalNumber('781234567')).toBe(true)
  })

  test('validateSenegalNumber rejects invalid', () => {
    expect(validateSenegalNumber('701234567')).toBe(false)
    expect(validateSenegalNumber('77123456')).toBe(false)
    expect(validateSenegalNumber('abc')).toBe(false)
  })

  test('validateCNI accepts 13 digits', () => {
    expect(validateCNI('1234567890123')).toBe(true)
    expect(validateCNI('123 456 789 0123')).toBe(true)
  })

  test('validateCNI rejects invalid length', () => {
    expect(validateCNI('123')).toBe(false)
    expect(validateCNI('12345678901234')).toBe(false)
  })

  test('validateName accepts letters and rejects short strings', () => {
    expect(validateName('A')).toBe(false)
    expect(validateName('Jean')).toBe(true)
    expect(validateName('Jean-Pierre')).toBe(true)
  })

  test('validatePropertyName accepts basic characters', () => {
    expect(validatePropertyName('Villa #2')).toBe(true)
    expect(validatePropertyName('')).toBe(false)
  })

  test('validateAmount accepts positive numbers', () => {
    expect(validateAmount(1000)).toBe(true)
    expect(validateAmount('2500')).toBe(true)
    expect(validateAmount(-10)).toBe(false)
  })

  test('validateDate accepts ISO-like dates', () => {
    expect(validateDate('2026-02-07')).toBe(true)
    expect(validateDate('invalid')).toBe(false)
  })

  test('format helpers', () => {
    expect(formatPhoneNumber('771234567')).toBe('+221 77 123 45 67')
    expect(formatCNI('12 34-56')).toBe('123456')
    expect(formatName('jean pierre')).toBe('Jean Pierre')
  })
})
