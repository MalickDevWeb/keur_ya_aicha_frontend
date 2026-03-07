import { buildAuditLogRecord, buildClientAuditLogPayload, describeStatusTransition } from '../../backend/src/auditSecurity.mjs'

describe('auditSecurity helpers', () => {
  it('buildClientAuditLogPayload accepte seulement les actions client autorisées', () => {
    const denied = buildClientAuditLogPayload(
      {
        action: 'ADMIN_DELETE',
        message: 'forbidden',
      },
      { actorId: 'admin-1', ipAddress: '127.0.0.1' }
    )

    expect(denied).toBeNull()

    const allowed = buildClientAuditLogPayload(
      {
        action: 'API_ERROR',
        message: 'Erreur API',
        meta: {
          method: 'GET',
          path: '/clients',
          deep: {
            nested: {
              value: 'ok',
            },
          },
        },
      },
      { actorId: 'admin-1', ipAddress: '127.0.0.1' }
    )

    expect(allowed).toMatchObject({
      actor: 'admin-1',
      action: 'API_ERROR',
      source: 'client',
      category: 'operations',
      severity: 'high',
      ipAddress: '127.0.0.1',
    })
    expect(allowed?.meta).toMatchObject({
      method: 'GET',
      path: '/clients',
    })
  })

  it('buildAuditLogRecord sanitise et borne les metadonnees', () => {
    const log = buildAuditLogRecord({
      actorId: 'system',
      action: 'SERVER_ERROR',
      message: 'Erreur serveur',
      meta: {
        first: 'value',
        nested: {
          second: 'value',
          third: {
            fourth: {
              tooDeep: 'removed',
            },
          },
        },
      },
    })

    expect(log).toMatchObject({
      actor: 'system',
      action: 'SERVER_ERROR',
      category: 'operations',
      severity: 'high',
    })
    expect(log.meta).toMatchObject({
      first: 'value',
      nested: {
        second: 'value',
      },
    })
  })

  it('describeStatusTransition classe les transitions critiques', () => {
    expect(describeStatusTransition('client', 'active', 'blacklisted')).toEqual({
      action: 'CLIENT_BLACKLISTED',
      category: 'security',
      severity: 'high',
    })

    expect(describeStatusTransition('admin', 'ACTIF', 'BLACKLISTE')).toEqual({
      action: 'ADMIN_BLACKLISTED',
      category: 'security',
      severity: 'critical',
    })
  })
})
