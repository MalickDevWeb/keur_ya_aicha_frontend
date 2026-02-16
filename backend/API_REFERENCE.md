# KYA Backend API Reference (Strict)

Reference API complete for the current backend implementation.

Scope covered:
- `backend/src/index.mjs` (main API, port 4000)
- `backend/server/index.js` (legacy Cloudinary sign server, port 3001)
- generic CRUD routes `/:name` and `/:name/:id`

## 1) Base URL and transport

Main API:
- `http://localhost:4000`

Legacy sign server:
- `http://localhost:3001`

Transport:
- HTTP/1.1 JSON API
- `Content-Type: application/json` for request bodies (except provider webhooks)

## 2) Authentication model (important)

This backend does **not** use JWT tokens.
It uses in-memory global process state.

There are 2 auth states:

1. Session auth (`/auth/*`)
- stored in global array `sessions[]`
- used by `/auth/session`

2. Auth context (`/authContext/*`)
- stored in global object `authContext`
- used by role checks in most protected business endpoints

Important behavior:
- auth context is global process state, not isolated per browser/client.
- if one client logs in via `/authContext/login`, it affects other clients using the same running process.

## 3) Common response contracts

## 3.1 Success response

- JSON object or JSON array
- POST via generic serializer uses status `201`

## 3.2 Error response shape

Most errors use:

```json
{ "error": "message" }
```

Special case: subscription block (`HTTP 402`):

```json
{
  "error": "Abonnement mensuel impaye (YYYY-MM). Paiement requis avant deblocage.",
  "code": "ADMIN_SUBSCRIPTION_BLOCKED",
  "overdueMonth": "YYYY-MM",
  "dueAt": "ISO",
  "requiredMonth": "YYYY-MM"
}
```

## 3.3 Undo headers (write operations)

Some write responses include:
- `x-undo-id`
- `x-undo-expires-at`
- `x-undo-resource`
- `x-undo-resource-id`

Headers are present only when rollback action is registered and resource is eligible.

Excluded from undo registration:
- `audit_logs`
- `undo_actions`
- `deposits`
- `payments`

## 3.4 Query params handled by generic list route

`GET /:name` converts these query keys to numbers if possible:
- `_start`
- `_end`
- `_limit`
- `_page`
- `_per_page`

## 4) Global middleware effects

## 4.1 IP block middleware

If client IP is in `blocked_ips` (except trusted local IPs), request is rejected:
- `HTTP 403`
- `{"error":"Adresse IP bloquee pour raisons de securite."}`

Trusted IPs:
- `127.0.0.1`
- `::1`
- `::ffff:127.0.0.1`

## 4.2 Admin subscription block middleware

Applies to ADMIN users resolved from auth context.
If admin subscription is overdue, many routes return `HTTP 402`.

Allowed paths even if blocked:
- `/auth*`
- `/authContext*`
- `/admin_payments*`
- `/audit_logs*`
- `/undo-actions*`
- `GET /admins/:id`

## 4.3 Slow/error request audit middleware

Automatic audit logs:
- `SLOW_REQUEST` when duration >= 1500ms
- `SERVER_ERROR` when response status >= 500

## 5) Specialized endpoint reference (main API)

Base: `http://localhost:4000`

---

## 5.1 POST /sign

Purpose:
- Generate Cloudinary upload signature using backend secret.

Auth:
- none

Request body:

```json
{
  "folder": "optional/path",
  "public_id": "optional-public-id"
}
```

Success `200`:

```json
{
  "api_key": "...",
  "timestamp": 1730000000,
  "signature": "sha1hex",
  "folder": "optional/path",
  "public_id": "optional-public-id"
}
```

Errors:
- `500` if Cloudinary config missing:

```json
{ "error": "Cloudinary signature service is not configured on backend." }
```

curl:

```bash
curl -i -X POST http://localhost:4000/sign \
  -H 'Content-Type: application/json' \
  -d '{"folder":"documents","public_id":"client-1-contract"}'
```

---

## 5.2 POST /cloudinary/open-url

Purpose:
- Convert Cloudinary delivery URL into signed temporary download URL.
- Expiration: ~5 minutes.

Auth:
- requires auth context user (`/authContext/login` first)

Request body:

```json
{
  "url": "https://res.cloudinary.com/<cloud>/image/upload/v.../path/file.pdf"
}
```

Success `200`:

```json
{
  "url": "https://api.cloudinary.com/v1_1/<cloud>/<resourceType>/download?...",
  "expiresAt": "2026-02-16T12:34:56.000Z"
}
```

Errors:
- `401` `Not authenticated`
- `400` `Missing document url`
- `400` `Invalid Cloudinary delivery url`
- `400` `Cloudinary cloud name mismatch`
- `500` Cloudinary service not configured

curl:

```bash
curl -i -X POST http://localhost:4000/cloudinary/open-url \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://res.cloudinary.com/demo/image/upload/v1/sample.jpg"}'
```

---

## 5.3 POST /auth/login

Purpose:
- Login using session mechanism (`sessions[]`).

Auth:
- none

Request body:

```json
{
  "username": "username-or-phone",
  "password": "plain-password"
}
```

Success `200`:

```json
{
  "user": {
    "id": "...",
    "username": "...",
    "name": "...",
    "email": "...",
    "role": "ADMIN|SUPER_ADMIN|CLIENT",
    "status": "...",
    "subscriptionBlocked": false,
    "subscriptionOverdueMonth": null,
    "subscriptionDueAt": null,
    "subscriptionRequiredMonth": null
  }
}
```

Errors:
- `400` `Missing credentials`
- `403` `Demande en attente d'approbation`
- `401` `Invalid credentials`
- `403` `Acces interdit. Decision du Super Admin.`

Side effects:
- on failed login:
  - writes audit `FAILED_LOGIN`
  - may auto-block IP after threshold
- on success:
  - clears previous `sessions[]` then stores current session

curl:

```bash
curl -i -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"771718013","password":"pmtadmin2024"}'
```

---

## 5.4 POST /auth/pending-check

Purpose:
- Check whether provided credentials correspond to pending admin request.

Auth:
- none

Request:

```json
{
  "username": "...",
  "password": "..."
}
```

Success `200`:

```json
{ "pending": true }
```

If missing credentials:
- `400` with `{ "pending": false }`

curl:

```bash
curl -i -X POST http://localhost:4000/auth/pending-check \
  -H 'Content-Type: application/json' \
  -d '{"username":"770001010","password":"secret"}'
```

---

## 5.5 GET /auth/session

Purpose:
- Return current session user from `sessions[]`.

Auth:
- session must exist (set by `/auth/login`)

Success `200`:

```json
{ "user": { "id": "...", "role": "..." } }
```

Errors:
- `401` `No active session`
- `401` `Session user not found`
- `403` `Acces interdit. Decision du Super Admin.`

curl:

```bash
curl -i http://localhost:4000/auth/session
```

---

## 5.6 POST /auth/logout

Purpose:
- Clear session array.

Success `200`:

```json
{ "ok": true }
```

curl:

```bash
curl -i -X POST http://localhost:4000/auth/logout
```

---

## 5.7 GET /authContext

Purpose:
- Return auth context user and impersonation state.

Auth:
- optional (returns null context if not set)

Success `200`:

```json
{
  "user": { "id": "...", "role": "..." } | null,
  "impersonation": {
    "adminId": "...",
    "adminName": "...",
    "userId": "..."
  } | null
}
```

Error:
- `403` `Acces interdit. Decision du Super Admin.` if stored ADMIN no longer valid/active

curl:

```bash
curl -i http://localhost:4000/authContext
```

---

## 5.8 POST /authContext/login

Purpose:
- Login into auth context (used by protected role-based business routes).

Auth:
- none

Request:

```json
{
  "username": "...",
  "password": "..."
}
```

Success `200`:

```json
{
  "user": {
    "id": "...",
    "username": "...",
    "name": "...",
    "email": "...",
    "role": "...",
    "status": "..."
  },
  "impersonation": null
}
```

Errors:
- `400` `Missing credentials`
- `403` `Demande en attente d'approbation`
- `401` `Invalid credentials`

Side effects:
- sets global `authContext.userId`
- clears existing impersonation

curl:

```bash
curl -i -X POST http://localhost:4000/authContext/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"771718013","password":"pmtadmin2024"}'
```

---

## 5.9 POST /authContext/logout

Purpose:
- Clear auth context.

Success `200`:

```json
{ "ok": true }
```

curl:

```bash
curl -i -X POST http://localhost:4000/authContext/logout
```

---

## 5.10 POST /authContext/impersonate

Purpose:
- Set SUPER_ADMIN impersonation target admin.

Auth:
- requires existing auth context user

Request:

```json
{
  "adminId": "admin-id",
  "adminName": "Admin Name",
  "userId": "optional-user-id"
}
```

Success `200`:

```json
{ "ok": true }
```

Errors:
- `400` `Missing admin`
- `401` `Not authenticated`

curl:

```bash
curl -i -X POST http://localhost:4000/authContext/impersonate \
  -H 'Content-Type: application/json' \
  -d '{"adminId":"admin-001","adminName":"Admin 001"}'
```

---

## 5.11 POST /authContext/clear-impersonation

Purpose:
- Clear impersonation state.

Success `200`:

```json
{ "ok": true }
```

Error:
- `401` `Not authenticated`

curl:

```bash
curl -i -X POST http://localhost:4000/authContext/clear-impersonation
```

---

## 5.12 POST /blocked_ips

Purpose:
- Manually block an IP.

Auth:
- requires `SUPER_ADMIN` in auth context

Request:

```json
{
  "ip": "203.0.113.55",
  "reason": "optional"
}
```

Success `201`:

```json
{
  "id": "block-...",
  "ip": "203.0.113.55",
  "reason": "Blocage manuel",
  "createdAt": "ISO"
}
```

Errors:
- `403` `Access forbidden`
- `400` `Missing ip`

Side effects:
- audit `IP_BLOCKED`
- notification `SECURITY_ALERT`

curl:

```bash
curl -i -X POST http://localhost:4000/blocked_ips \
  -H 'Content-Type: application/json' \
  -d '{"ip":"203.0.113.55","reason":"Manual block"}'
```

---

## 5.13 DELETE /blocked_ips/:id

Purpose:
- Unblock IP by block entry id.

Auth:
- implementation currently checks id existence only (no explicit role check here)

Success `200`:

```json
{ "ok": true }
```

Errors:
- `400` `Missing id`
- `404` `Not found`

Side effects:
- audit `IP_UNBLOCKED`
- notification `SECURITY_ALERT`

curl:

```bash
curl -i -X DELETE http://localhost:4000/blocked_ips/block-abc123
```

---

## 5.14 GET /admin_payments/status

Purpose:
- Return admin subscription status.

Auth:
- requires auth context user

Query:
- optional `adminId` (for SUPER_ADMIN context without impersonation)

Success `200`:

```json
{
  "adminId": "...",
  "blocked": false,
  "overdueMonth": null,
  "dueAt": "ISO|null",
  "requiredMonth": "YYYY-MM",
  "currentMonth": "YYYY-MM",
  "graceDays": 5
}
```

Errors:
- `401` `Not authenticated`
- `400` `Admin manquant`

curl:

```bash
curl -i 'http://localhost:4000/admin_payments/status?adminId=admin-001'
```

---

## 5.15 POST /admin_payments/webhook/:provider?

Purpose:
- Confirm pending admin payment from provider webhook.

Provider path param:
- optional, defaults to `PAYMENT_PROVIDER`
- normalized accepted forms include: `stripe`, `wave`, `orange`, `om`, `orange_money`

Signature headers:
- Stripe: `stripe-signature` (fallback `x-signature`)
- Wave/Orange: `x-signature` or `x-webhook-signature`

Body:
- provider-specific payload JSON

Success `200`:

```json
{ "ok": true, "paymentId": "...", "status": "paid" }
```

Alternate success `200`:

```json
{ "ok": true, "ignored": true }
```

Errors:
- `400` invalid provider
- `401` `Signature webhook invalide.`
- `404` `Paiement admin introuvable pour ce webhook.`

Side effects:
- marks `admin_payments` item as paid
- updates related `admins` record (`paid=true`)
- writes audit `ADMIN_PAYMENT_CONFIRMED`

curl (example for Wave):

```bash
curl -i -X POST http://localhost:4000/admin_payments/webhook/wave \
  -H 'Content-Type: application/json' \
  -H 'x-signature: <hmac>' \
  -d '{"status":"paid","data":{"id":"tx-1","metadata":{"adminPaymentId":"adminpay-123"}}}'
```

---

## 5.16 GET /undo-actions

Purpose:
- List rollback-able actions.

Auth:
- requires auth context user

Query:
- `limit` or `_limit`
- default `10`, max `50`

Success `200`:

```json
[
  {
    "id": "undo-...",
    "resource": "clients",
    "resourceId": "client-1",
    "method": "PATCH",
    "actorId": "superadmin-001",
    "createdAt": "ISO",
    "expiresAt": "ISO",
    "path": "/clients/client-1"
  }
]
```

Errors:
- `401` `Not authenticated`

Visibility:
- SUPER_ADMIN sees all
- others see entries where `actorId === currentUser.id`

curl:

```bash
curl -i 'http://localhost:4000/undo-actions?limit=20'
```

---

## 5.17 POST /undo-actions/:id/rollback

Purpose:
- Execute rollback action.

Auth:
- requires auth context user

Success `200`:

```json
{ "ok": true, "rolledBackId": "undo-..." }
```

Errors:
- `401` `Not authenticated`
- `400` `ID de rollback manquant.`
- `404` `Action rollback introuvable.`
- `403` `Rollback non autorise pour cette action.`
- `410` `Rollback expire: action trop ancienne (plus de 2 mois).`
- `422` `Cette action ne peut pas etre annulee.`
- `422` `Rollback impossible.` (or detailed plan error)

Side effects:
- removes consumed undo action
- writes audit `UNDO_ROLLBACK`

curl:

```bash
curl -i -X POST http://localhost:4000/undo-actions/undo-abc123/rollback
```

## 6) Generic CRUD routes

Generic routes:
- `GET /:name`
- `GET /:name/:id`
- `POST /:name`
- `PUT /:name`
- `PUT /:name/:id`
- `PATCH /:name`
- `PATCH /:name/:id`
- `DELETE /:name/:id`

Serializer behavior:
- if `res.locals.data` is undefined -> `404`
- POST responses set `201`

## 6.1 Resource map and behavior

The backend supports many collection names. Behavior differs by resource.

### 6.1.1 `admin_requests`

Read behavior:
- derived from `users` where role=ADMIN and status=EN_ATTENTE

POST behavior:
- creates pending ADMIN user in `users`
- sends notifications to SUPER_ADMIN users
- writes audit `ADMIN_REQUEST_CREATE`
- registers undo

PUT `/:name/:id` behavior:
- updates request/user fields
- if status becomes ACTIF, ensures an `admins` record exists
- writes audit `ADMIN_REQUEST_STATUS` on status change
- registers undo

### 6.1.2 `clients`

Read behavior:
- filtered by `admin_clients` for non-global users
- full SUPER_ADMIN (without impersonation adminId) can read all
- response is enriched view (`buildClientView`)

POST behavior:
- requires auth context role
- duplicate check on phone/email
- auto-generates client id if missing
- auto-creates CLIENT user if missing
- creates admin-client link when adminId resolved
- registers undo

PUT/PATCH/DELETE behavior:
- requires role
- checks ownership via `admin_clients` except full SUPER_ADMIN mode
- duplicate checks on updates
- DELETE writes audit `CLIENT_DELETE`
- registers undo

### 6.1.3 `admin_payments`

GET behavior:
- filtered by role/auth context
- normalizes month/method/status/provider
- sorted latest first

POST behavior (strict):
- requires role
- target admin resolution:
  - ADMIN role -> self adminId
  - SUPER_ADMIN -> body.adminId
- validates method: `wave|orange_money|cash`
- role constraints:
  - SUPER_ADMIN can only create `cash`
  - ADMIN cannot create `cash`
- duplicate prevention for month with status `pending|paid`
- amount must be > 0
- mobile methods initiate provider (`wave`/`orange`)
- may return `pending` payment with checkout URL
- writes undo

Webhook confirmation endpoint updates pending payments to paid.

### 6.1.4 `import_runs`

GET behavior:
- role-filtered by admin ownership
- normalized booleans/arrays

GET by id / PATCH by id:
- role required
- ownership required

POST behavior:
- role required
- resolves owner adminId
- normalizes inserted/errors/read flags
- registers undo

### 6.1.5 `users`, `admins`, `entreprises`

POST/PUT/PATCH:
- duplicate checks applied

`admins` status changes:
- writes audit `ADMIN_STATUS`

### 6.1.6 `notifications`, `audit_logs`, `blocked_ips`

GET list sorting:
- descending by created date

### 6.1.7 `settings`, `documents`, `import_errors`

If collection absent:
- list returns `[]`

### 6.1.8 Other collections

`payments`, `deposits`, `rentals`, `otp`, `superadmins`, etc. can be handled by generic CRUD unless blocked by business conditions.

## 6.2 Generic status code patterns

Common possible statuses across CRUD operations:
- `200` success read/update
- `201` create
- `400` validation/business missing field
- `401` not authenticated (role-required branches)
- `402` subscription blocked
- `403` forbidden ownership/role
- `404` item not found
- `409` duplicate/business conflict
- `422` rollback/business unprocessable
- `502` provider initiation failure

## 6.3 Generic CRUD curl examples

### List clients

```bash
curl -i http://localhost:4000/clients
```

### Get client by id

```bash
curl -i http://localhost:4000/clients/client-1
```

### Create client

```bash
curl -i -X POST http://localhost:4000/clients \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName":"Moussa",
    "lastName":"Ndiaye",
    "phone":"+221771112233",
    "email":"moussa@example.com",
    "cni":"1234567890123",
    "status":"active",
    "rentals":[]
  }'
```

### Update client (PUT)

```bash
curl -i -X PUT http://localhost:4000/clients/client-1 \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Moussa Updated"}'
```

### Patch client

```bash
curl -i -X PATCH http://localhost:4000/clients/client-1 \
  -H 'Content-Type: application/json' \
  -d '{"status":"archived"}'
```

### Delete client

```bash
curl -i -X DELETE http://localhost:4000/clients/client-1
```

### List admin requests

```bash
curl -i http://localhost:4000/admin_requests
```

### Create admin request

```bash
curl -i -X POST http://localhost:4000/admin_requests \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Modou Ndiaye",
    "phone":"770001010",
    "email":"modou@example.com",
    "entrepriseName":"ModouShop",
    "username":"770001010",
    "password":"secret123"
  }'
```

### Approve admin request

```bash
curl -i -X PUT http://localhost:4000/admin_requests/user-abc123 \
  -H 'Content-Type: application/json' \
  -d '{"status":"ACTIF"}'
```

### Create admin payment (cash)

```bash
curl -i -X POST http://localhost:4000/admin_payments \
  -H 'Content-Type: application/json' \
  -d '{
    "adminId":"admin-001",
    "amount":10000,
    "method":"cash",
    "month":"2026-02",
    "note":"Manual payment"
  }'
```

### Create admin payment (wave)

```bash
curl -i -X POST http://localhost:4000/admin_payments \
  -H 'Content-Type: application/json' \
  -d '{
    "adminId":"admin-001",
    "amount":10000,
    "method":"wave",
    "month":"2026-02",
    "payerPhone":"771234567"
  }'
```

### List import runs

```bash
curl -i http://localhost:4000/import_runs
```

### Create import run

```bash
curl -i -X POST http://localhost:4000/import_runs \
  -H 'Content-Type: application/json' \
  -d '{
    "fileName":"clients.xlsx",
    "totalRows":3,
    "inserted":[],
    "errors":[],
    "ignored":false
  }'
```

### Patch import run read flag

```bash
curl -i -X PATCH http://localhost:4000/import_runs/imprun-abc123 \
  -H 'Content-Type: application/json' \
  -d '{"readSuccess":true}'
```

### List settings

```bash
curl -i http://localhost:4000/settings
```

### Upsert setting

```bash
curl -i -X POST http://localhost:4000/settings \
  -H 'Content-Type: application/json' \
  -d '{"id":"import_clients_required_fields","key":"import_clients_required_fields","value":"[\"firstName\",\"lastName\"]"}'
```

## 7) Business validation rules (runtime)

## 7.1 Duplicate constraints

`clients`:
- phone normalized unique
- email normalized unique

`users`:
- username unique across users + admins
- email unique across users + admins
- phone unique across users

`admins`:
- username unique in admins
- username cannot conflict with users except linked `payload.userId`

`entreprises`:
- name unique across `entreprises.name` and `admins.entrepriseId`

## 7.2 Payment rules

Allowed methods:
- `wave`
- `orange_money`
- `cash`

Role constraints:
- SUPER_ADMIN: only `cash`
- ADMIN: cannot use `cash`

Amount:
- must be numeric and > 0

Month duplication:
- an admin cannot have duplicate payment for same month when existing status is `pending` or `paid`

Overdue subscription:
- if blocked, required overdue month must be paid first

## 7.3 Login and IP security

- failed login events recorded in `audit_logs`
- if failures >= 5 in 1 hour from same non-local IP:
  - IP is auto-blocked
  - security notification sent to super admins

## 8) Audit actions and notifications

## 8.1 Audit action values used in code

- `SLOW_REQUEST`
- `SERVER_ERROR`
- `BLOCKED_IP_HIT`
- `FAILED_LOGIN`
- `IP_BLOCKED`
- `IP_UNBLOCKED`
- `ADMIN_PAYMENT_CONFIRMED`
- `UNDO_ROLLBACK`
- `ADMIN_REQUEST_CREATE`
- `ADMIN_STATUS`
- `ADMIN_REQUEST_STATUS`
- `CLIENT_DELETE`

## 8.2 Notification types used in code

- `SECURITY_ALERT`
- `ADMIN_REQUEST`

## 9) HTTP error catalog (explicit messages)

| HTTP | Message |
| --- | --- |
| 400 | `Admin manquant` |
| 400 | `Admin manquant pour cet import.` |
| 400 | `Cloudinary cloud name mismatch` |
| 400 | `ID de rollback manquant.` |
| 400 | `Invalid Cloudinary delivery url` |
| 400 | `Methode de paiement invalide (wave, orange_money, cash).` |
| 400 | `Missing admin` |
| 400 | `Missing credentials` |
| 400 | `Missing document url` |
| 400 | `Missing id` |
| 400 | `Missing ip` |
| 400 | `Montant de paiement invalide.` |
| 401 | `Invalid credentials` |
| 401 | `No active session` |
| 401 | `Not authenticated` |
| 401 | `Session user not found` |
| 401 | `Signature webhook invalide.` |
| 402 | `Abonnement mensuel impaye (...)` |
| 403 | `Acces interdit. Decision du Super Admin.` |
| 403 | `Access forbidden` |
| 403 | `Adresse IP bloquee pour raisons de securite.` |
| 403 | `Demande en attente d'approbation` |
| 403 | `Rollback non autorise pour cette action.` |
| 403 | `Super Admin: seul le paiement especes est autorise.` |
| 403 | `Paiement especes: validation reservee au Super Admin.` |
| 404 | `Action rollback introuvable.` |
| 404 | `Not found` |
| 404 | `Paiement admin introuvable pour ce webhook.` |
| 409 | `Client existe deja avec ce numero ou cet email pour cet admin.` |
| 409 | `Le mois YYYY-MM est deja paye.` |
| 409 | `Paiement requis pour YYYY-MM avant tout autre mois.` |
| 410 | `Rollback expire: action trop ancienne (plus de 2 mois).` |
| 422 | `Cette action ne peut pas etre annulee.` |
| 422 | `Rollback impossible.` (or detailed rollback error) |
| 500 | `Cloudinary signature service is not configured on backend.` |
| 502 | provider initiation/config error |

Also possible conflict messages from duplicate checks:
- `Ce nom d'utilisateur existe deja.`
- `Cet email existe deja.`
- `Ce numero existe deja.`
- `Cette entreprise existe deja.`

## 10) DTO links (for client integration)

Backend request DTOs (`src/dto/backend/requests`):
- `ClientCreateDTO`, `ClientUpdateDTO`
- `DocumentCreateDTO`
- `DepositCreateDTO`, `DepositUpdateDTO`
- `PaymentCreateDTO`, `PaymentUpdateDTO`, `PaymentMonthlyUpdateDTO`
- `ImportRunCreateDTO` (+ `ImportRunUpdateDTO` type inside file)

Backend response DTOs (`src/dto/backend/responses`):
- `ClientDTO`, `RentalDTO`
- `PaymentDTO`, `PaymentRecordDTO`, `MonthlyPaymentDTO`
- `DepositDTO`
- `DocumentDTO`
- `ImportRunDTO`
- `WorkItemDTO`

Frontend DTOs tied to backend (`src/dto/frontend/...`):
- Auth: `AuthRequestDTO`, `AuthResponseDTO`, `AuthUser`
- Admin: `AdminDTO`, `AdminRequestDTO`, `AdminCreateDTO`, `AdminUpdateDTO`, `AdminRequestCreateDTO`, `AdminRequestUpdateDTO`
- Admin payments: `AdminPaymentCreateDTO`, `AdminPaymentDTO`, `AdminPaymentStatusDTO`
- Ops/monitoring: `BlockedIpDTO`, `AuditLogDTO`, `EntrepriseDTO`, `UserDTO`

## 11) Legacy sign server API (port 3001)

Base URL:
- `http://localhost:3001`

Endpoint:
- `POST /sign`

Request:

```json
{
  "folder": "optional",
  "public_id": "optional"
}
```

Success `200`:

```json
{
  "api_key": "...",
  "timestamp": 1730000000,
  "signature": "sha1...",
  "folder": "optional"
}
```

Error:
- `500` `Cloudinary not configured`

curl:

```bash
curl -i -X POST http://localhost:3001/sign \
  -H 'Content-Type: application/json' \
  -d '{"folder":"docs"}'
```

## 12) Known limitations and integration warnings

1. Global in-memory auth context is shared across clients.
2. No password hashing in current JSON database.
3. `DELETE /blocked_ips/:id` lacks explicit SUPER_ADMIN guard in route logic.
4. Some admin request payloads include `password` in read responses.
5. Stripe webhook verification can be sensitive to raw body handling.
6. `backend/server/index.js` contains legacy SQL monitor helpers referencing undefined `db`.
7. `lowdb` file storage is not suitable for high-concurrency production loads.

## 13) End-to-end flow examples

## 13.1 Login to auth context, then create client

```bash
# 1) Login
curl -i -X POST http://localhost:4000/authContext/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"771718013","password":"pmtadmin2024"}'

# 2) Verify context
curl -i http://localhost:4000/authContext

# 3) Create client
curl -i -X POST http://localhost:4000/clients \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Awa","lastName":"Diop","phone":"+221771112233","status":"active","rentals":[]}'
```

## 13.2 Create admin request then approve

```bash
# Create request
curl -i -X POST http://localhost:4000/admin_requests \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Admin","phone":"770001010","username":"770001010","password":"secret123"}'

# Approve (replace id)
curl -i -X PUT http://localhost:4000/admin_requests/<request-id> \
  -H 'Content-Type: application/json' \
  -d '{"status":"ACTIF"}'
```

## 13.3 Create payment then rollback by undo id

```bash
# Create a write operation (example client patch)
curl -i -X PATCH http://localhost:4000/clients/client-1 \
  -H 'Content-Type: application/json' \
  -d '{"status":"archived"}'

# Read undo actions
curl -i http://localhost:4000/undo-actions?limit=5

# Rollback latest action
curl -i -X POST http://localhost:4000/undo-actions/<undo-id>/rollback
```

---

This file is intended as strict operational reference for backend integration and maintenance.
