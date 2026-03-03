# Routes API Next.js a implementer

Cette section reprend les endpoints reellement utilises par ton front (`src/services/api/*.ts`) et le backend actuel (`backend/src/index.mjs`).

## 1. Auth
- `POST /api/auth/login`
- `POST /api/auth/pending-check`
- `GET /api/auth/session`
- `POST /api/auth/logout`

### Exemple `POST /api/auth/login`
Input:
```json
{ "username": "771234567", "password": "secret" }
```
Output 200:
```json
{ "user": { "id": "user-1", "role": "ADMIN", "subscriptionBlocked": false } }
```

## 2. Auth context / impersonation
- `GET /api/authContext`
- `POST /api/authContext/login`
- `POST /api/authContext/logout`
- `POST /api/authContext/impersonate`
- `POST /api/authContext/clear-impersonation`
- `POST /api/authContext/super-admin/second-auth`

## 3. Paiement abonnement admin
- `GET /api/admin_payments/status?adminId=<id>`
- `POST /api/admin_payments`
- `GET /api/admin_payments`
- `POST /api/admin_payments/webhook/:provider?`

## 4. Securite IP
- `GET /api/blocked_ips`
- `POST /api/blocked_ips`
- `DELETE /api/blocked_ips/:id`

## 5. Undo actions
- `GET /api/undo-actions?limit=10`
- `POST /api/undo-actions/:id/rollback`

## 6. Cloudinary
- `POST /api/sign`
- `POST /api/cloudinary/open-url`

## 7. CRUD ressources metier
Ces routes doivent rester compatibles avec le front actuel:

- `users`: `GET/POST/PUT/PATCH/DELETE`
- `admins`: `GET/POST/PUT/PATCH/DELETE`
- `admin_requests`: `GET/POST/PUT/PATCH/DELETE`
- `entreprises`: `GET/POST/PUT/PATCH/DELETE`
- `clients`: `GET/POST/PUT/PATCH/DELETE`
- `documents`: `GET/POST/PUT/PATCH/DELETE`
- `payments`: `GET/POST/PUT/PATCH/DELETE`
- `deposits`: `GET/POST/PUT/PATCH/DELETE`
- `notifications`: `GET/POST/PATCH/DELETE`
- `audit_logs`: `GET/POST/DELETE`
- `settings`: `GET/POST/PATCH`
- `import_runs`: `GET/POST/PATCH`
- `import_errors`: `GET/POST`
- `work_items`: `GET/POST/PATCH/DELETE`

## 7.1 Compatibilite \"messages\" et \"contacts\"
Si tu veux exposer explicitement ces noms:
- `messages` -> mapper sur `notifications` (metier) et/ou `audit_logs` (technique)
- `contacts` -> mapper sur `clients` + `admin_clients`

Routes optionnelles:
- `GET /api/messages` (wrapper de `notifications`)
- `POST /api/messages` (creer notification)
- `GET /api/contacts` (wrapper clients filtres par admin)
- `POST /api/contacts` (creer client + lien admin_clients)

## 8. Contrat reponse d'erreur recommande
```json
{
  "error": "Message lisible",
  "code": "ERROR_CODE_STABLE",
  "details": {}
}
```

## 9. Contrat undo headers (ecritures)
Sur chaque reponse d'ecriture undo-able:
- `x-undo-id`
- `x-undo-expires-at`
- `x-undo-resource`
- `x-undo-resource-id`

## 10. Exemple route handler Next.js

`app/api/admin_payments/status/route.ts`
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminPaymentStatusService } from '@/modules/admin-payments/service'

export async function GET(req: NextRequest) {
  try {
    const adminId = req.nextUrl.searchParams.get('adminId') || undefined
    const data = await getAdminPaymentStatusService({ adminId, req })
    return NextResponse.json(data)
  } catch (error: any) {
    const status = Number(error?.status || 500)
    return NextResponse.json(
      { error: error?.message || 'Erreur serveur', code: error?.code || 'INTERNAL_ERROR' },
      { status }
    )
  }
}
```
