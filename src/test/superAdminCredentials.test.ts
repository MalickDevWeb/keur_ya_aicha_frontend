import { describe, expect, it } from 'vitest'
import { buildCredentialsMessage } from '@/pages/super-admin/core/utils'

describe('buildCredentialsMessage', () => {
  it('does not expose an undefined password when approval keeps the admin chosen password', () => {
    const message = buildCredentialsMessage(
      {
        name: 'Admin Test',
        username: 'admin-test',
        email: 'admin@test.com',
        phone: '+221771234567',
        createdAt: '2026-03-07T10:00:00.000Z',
      },
      'https://app.test/login'
    )

    expect(message).toContain('Mot de passe : celui choisi lors de l’inscription (non affiché)')
    expect(message).not.toContain('Mot de passe : undefined')
  })
})
