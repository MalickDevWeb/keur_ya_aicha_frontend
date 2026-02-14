import { describe, expect, it } from 'vitest'
import { buildDuplicateLookup, buildDuplicateMessage, formatBackendError } from '../utils'

const clients = [
  { id: 'c1', firstName: 'Awa', lastName: 'Diop', phone: '77 123 45 67', email: 'awa@example.com' },
  { id: 'c2', firstName: 'Moussa', lastName: 'Ba', phone: '77 123 45 67', email: 'moussa@example.com' },
  { id: 'c3', firstName: 'Fatou', lastName: 'Ndiaye', phone: '76 111 22 33', email: 'fatou@example.com' },
]

describe('import utils', () => {
  it('buildDuplicateLookup keeps first owner per phone/email', () => {
    const { ownerByPhone, ownerByEmail } = buildDuplicateLookup(clients)
    expect(ownerByPhone.get('771234567')?.id).toBe('c1')
    expect(ownerByEmail.get('awa@example.com')?.id).toBe('c1')
  })

  it('buildDuplicateMessage returns contextual message', () => {
    const { ownerByPhone } = buildDuplicateLookup(clients)
    const message = buildDuplicateMessage('phone', '771234567', ownerByPhone)
    expect(message).toContain('Awa Diop')
  })

  it('formatBackendError prefers duplicate details on 409', () => {
    const { ownerByPhone, ownerByEmail } = buildDuplicateLookup(clients)
    const err = { message: '409 Conflict' }
    const message = formatBackendError(err, { phone: '77 123 45 67' }, ownerByPhone, ownerByEmail)
    expect(message).toContain('Numéro déjà utilisé')
  })
})
