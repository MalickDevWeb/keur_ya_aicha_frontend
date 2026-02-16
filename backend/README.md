# Backend KYA - Specification technique complete

Document de reference backend du projet `Keur Ya Aicha`.

Objectif:
- Donner une vision complete du backend actuel.
- Documenter tous les endpoints, toutes les regles metier, les DTO relies, les validations, les messages, les tables/collections et les variables d'environnement.
- Servir de base de maintien et de migration vers une architecture plus robuste.

Documentation paramétrage Super Admin:
- `docs/18-PARAMETRES_SUPER_ADMIN.md`

Version couverte:
- API principale: `backend/src/index.mjs`
- Serveur Cloudinary legacy: `backend/server/index.js`
- Legacy json-server auth: `backend/json-server-auth.cjs`

## 1) Perimetre backend

Le backend est compose de 2 serveurs actifs possibles + 1 ancien serveur:

1. API principale (recommandee)
- Fichier: `backend/src/index.mjs`
- Stack: `@tinyhttp/app`, `lowdb`, service `json-server` (`Service`, `Observer`, `JSONFile`)
- Base de donnees: `backend/db/db.json`
- Port par defaut: `4000`

2. Serveur legacy Cloudinary sign
- Fichier: `backend/server/index.js`
- Stack: Express + CORS
- Port par defaut: `3001`
- Role: signature upload Cloudinary (`POST /sign`)

3. Ancien serveur JSON auth (legacy)
- Fichier: `backend/json-server-auth.cjs`
- Role: historique, non utilise par les scripts principaux actuels

## 2) Arborescence backend

```txt
backend/
├── README.md
├── .env.example
├── json-server-auth.cjs
├── src/
│   └── index.mjs
├── db/
│   ├── db.json
│   ├── audit-logs.sql
│   ├── anomaly-monitoring.sql
│   ├── notifications.sql
│   ├── otp.sql
│   └── log-backup.sh
└── server/
    ├── index.js
    ├── .env
    └── .env.example
```

## 3) Demarrage et exploitation

## 3.1 Commandes utiles

Depuis la racine `frontend/`:

```bash
# API principale uniquement
npm run start:api

# API + Electron + Vite
npm run dev

# Script complet: liberation ports + API + sign server + Vite
npm run dev:all
```

## 3.2 Ports utilises

- API principale: `http://localhost:4000`
- Serveur Cloudinary legacy: `http://localhost:3001`
- Front Vite (dev): `http://localhost:5173`

## 3.3 Health checks rapides

```bash
curl -i http://localhost:4000/authContext
curl -i -X POST http://localhost:4000/sign -H 'Content-Type: application/json' -d '{}'
curl -i http://localhost:4000/clients
```

## 4) Configuration `.env`

## 4.1 Ordre de chargement des variables (API principale)

Le code charge les fichiers dans cet ordre:

1. `backend/.env`
2. `backend/server/.env`
3. `.env` a la racine du projet

Regle importante:
- Une variable deja definie n'est pas ecrasee par la suivante.

## 4.2 Fichiers d'exemple

Crees dans ce repo:
- `backend/.env.example`
- `backend/server/.env.example`

Copies conseillees:

```bash
cp backend/.env.example backend/.env
cp backend/server/.env.example backend/server/.env
```

## 4.3 Variables supportees par `backend/src/index.mjs`

| Variable | Requise | Defaut | Description |
| --- | --- | --- | --- |
| `PORT` | non | `4000` | Port HTTP API principale |
| `NODE_ENV` | non | vide | Sert pour le defaut de simulation paiement |
| `APP_BASE_URL` | non | vide | Base URL publique generee pour liens de paiement |
| `PUBLIC_BASE_URL` | non | vide | Fallback de `APP_BASE_URL` |
| `PAYMENT_PROVIDER` | non | `stripe` | Provider principal (`stripe`, `wave`, `orange`) |
| `PAYMENT_ALLOW_SIMULATION` | non | auto | `true` en dev, `false` en prod si non defini |
| `CLOUDINARY_URL` | recommandee | vide | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| `CLOUDINARY_API_KEY` | fallback | vide | Cle Cloudinary |
| `CLOUDINARY_API_SECRET` | fallback | vide | Secret Cloudinary |
| `CLOUDINARY_CLOUD_NAME` | fallback | vide | Cloud name |
| `VITE_CLOUDINARY_API_KEY` | fallback | vide | Fallback legacy |
| `VITE_CLOUDINARY_CLOUD_NAME` | fallback | vide | Fallback legacy |
| `STRIPE_BASE_URL` | non | `https://api.stripe.com` | Base API Stripe |
| `STRIPE_SECRET_KEY` | oui si Stripe reel | vide | Secret Stripe |
| `STRIPE_WEBHOOK_SECRET` | oui webhook Stripe | vide | Verification signature Stripe |
| `WAVE_BASE_URL` | oui si Wave reel | vide | Base API Wave |
| `WAVE_SECRET` | oui si Wave reel | vide | Secret Wave |
| `WAVE_WEBHOOK_SECRET` | oui webhook Wave | vide | Verification signature Wave |
| `ORANGE_BASE_URL` | oui si Orange reel | vide | Base API Orange Money |
| `ORANGE_SECRET` | oui si Orange reel | vide | Secret Orange |
| `ORANGE_WEBHOOK_SECRET` | oui webhook Orange | vide | Verification signature Orange |

## 4.4 Variables supportees par `backend/server/index.js`

| Variable | Requise | Defaut | Description |
| --- | --- | --- | --- |
| `PORT` | non | `3001` | Port du sign server legacy |
| `CLOUDINARY_URL` | oui | vide | Signature Cloudinary |

## 4.5 Constantes runtime backend (API principale)

| Constante | Valeur | Effet |
| --- | --- | --- |
| `SLOW_REQUEST_MS` | `1500` | log audit requete lente |
| `FAILED_LOGIN_THRESHOLD` | `5` | blocage auto IP |
| `FAILED_LOGIN_WINDOW_MS` | `3600000` | fenetre 1h pour echecs login |
| `UNDO_WINDOW_MS` | `5184000000` | rollback possible 60 jours |
| `UNDO_HISTORY_LIMIT` | `300` | limite d'actions undo |
| `UNDO_EXCLUDED_RESOURCES` | `audit_logs, undo_actions, deposits, payments` | pas de rollback sur ces ressources |
| `ADMIN_SUBSCRIPTION_GRACE_DAYS` | `5` | delai de grace abonnement mensuel |
| `ADMIN_PAYMENT_METHODS` | `wave, orange_money, cash` | methodes autorisees |
| `ADMIN_PAYMENT_ACTIVE_STATUSES` | `pending, paid` | statuts consideres actifs |
| `MOBILE_PAYMENT_METHODS` | `wave, orange_money` | methodes qui initient un provider |
| `TRUSTED_IPS` | `127.0.0.1, ::1, ::ffff:127.0.0.1` | IP locales non bloquees |

## 5) Architecture logique

Pipeline principal dans `backend/src/index.mjs`:

1. Chargement env
2. Chargement DB JSON (`lowdb`)
3. Initialisation collections manquantes
4. Middleware audit timing + erreurs serveur
5. CORS + parser JSON
6. Endpoints specialises
7. Middleware blocage abonnement admin (HTTP 402)
8. Endpoints CRUD dynamiques
9. Serializer final `app.use('/:name', ...)`

## 6) Modele de donnees (collections JSON)

Les collections sont stockees dans `backend/db/db.json`.

## 6.1 Collections initialisees automatiquement

- `users`
- `admins`
- `superadmins`
- `clients`
- `admin_clients`
- `rentals`
- `notifications`
- `otp`
- `audit_logs`
- `settings`
- `entreprises`
- `blocked_ips`
- `admin_payments`
- `import_runs`
- `import_errors`
- `documents`
- `undo_actions`

## 6.2 Dictionnaire de donnees detaille

## `users`

Role: identite/auth de base (SUPER_ADMIN, ADMIN, CLIENT)

Champs courants:
- `id: string` (PK logique)
- `username: string`
- `password: string` (actuellement en clair)
- `name: string`
- `email?: string`
- `phone?: string`
- `role: string` (`SUPER_ADMIN`, `ADMIN`, `CLIENT`)
- `status?: string` (`EN_ATTENTE`, `ACTIF`, etc.)
- `entrepriseName?: string`
- `paid?: boolean`
- `paidAt?: string | null`
- `createdAt?: string`
- `updatedAt?: string`

## `admins`

Role: projection metier des admins actives

Champs courants:
- `id: string` (meme valeur que `users.id` admin)
- `status?: string`
- `entrepriseId?: string`
- `paid?: boolean`
- `paidAt?: string | null`

## `superadmins`

Role: projection metier super admin

Champs:
- `id: string`
- `userId: string` (FK logique vers `users.id`)
- `name: string`
- `email: string`
- `status: string`
- `createdAt: string`

## `clients`

Role: dossier client metier

Champs de base:
- `id: string`
- `adminId?: string`
- `firstName: string`
- `lastName: string`
- `phone: string`
- `email?: string`
- `cni?: string`
- `status?: string`
- `createdAt?: string`
- `rentals?: Rental[]`

Schema `Rental` (imbrique dans `clients.rentals`):
- `id: string`
- `clientId: string`
- `propertyType: string`
- `propertyName: string`
- `monthlyRent: number`
- `startDate: string`
- `deposit: { total: number; paid: number; payments: PaymentRecord[] }`
- `payments: MonthlyPayment[]`
- `documents: Document[]`

Schema `MonthlyPayment`:
- `id: string`
- `rentalId: string`
- `periodStart: string`
- `periodEnd: string`
- `dueDate: string`
- `amount: number`
- `paidAmount: number`
- `status: string`
- `payments: PaymentRecord[]`

Schema `PaymentRecord`:
- `id: string`
- `amount: number`
- `date: string`
- `receiptNumber: string`

## `admin_clients`

Role: relation d'acces admin -> client

Champs:
- `id?: string`
- `adminId: string`
- `clientId: string`
- `createdAt?: string`

## `admin_payments`

Role: abonnement mensuel admin

Champs courants:
- `id: string`
- `adminId: string`
- `entrepriseId?: string`
- `amount: number`
- `month: string` (`YYYY-MM`)
- `method: 'wave' | 'orange_money' | 'cash'`
- `status?: 'pending' | 'paid' | 'failed' | 'cancelled'`
- `provider?: 'stripe' | 'wave' | 'orange' | 'manual'`
- `providerReference?: string`
- `checkoutUrl?: string`
- `payerPhone?: string`
- `transactionRef?: string`
- `note?: string`
- `paidAt?: string | null`
- `approvedAt?: string | null`
- `approvedBy?: string | null`
- `providerPayload?: unknown`
- `initiatedAt?: string`
- `createdAt?: string`
- `updatedAt?: string`

## `notifications`

Role: notifications super admin et utilisateur

Champs:
- `id: string`
- `user_id: string`
- `type: string`
- `message: string`
- `is_read: boolean`
- `created_at: string`

## `audit_logs`

Role: journal audit / securite / monitoring

Champs:
- `id: string`
- `actor?: string`
- `action?: string`
- `targetType?: string`
- `targetId?: string`
- `message?: string`
- `ipAddress?: string`
- `createdAt?: string`
- `meta?: unknown`

## `blocked_ips`

Role: liste noire IP

Champs:
- `id: string`
- `ip: string`
- `reason?: string`
- `createdAt?: string`

## `settings`

Role: configuration metier (ex: import aliases)

Champs:
- `id: string`
- `key: string`
- `value: string`

## `import_runs`

Role: historique executions d'import

Champs:
- `id: string`
- `adminId?: string`
- `fileName?: string`
- `totalRows?: number`
- `inserted?: Array<{ id; firstName; lastName; phone; email? }>`
- `errors?: Array<{ rowNumber; errors: string[]; parsed: Record<string, unknown> }>`
- `ignored?: boolean`
- `readSuccess?: boolean`
- `readErrors?: boolean`
- `createdAt?: string`
- `updatedAt?: string`

## `undo_actions`

Role: historique d'actions annulables

Champs:
- `id: string`
- `resource: string`
- `resourceId?: string | null`
- `method: string`
- `actorId?: string | null`
- `createdAt: string`
- `expiresAt: string`
- `path: string`
- `rollback: { type: 'delete'|'upsert'|'create'; ... }`
- `sideEffects?: { user?: User | null; adminClientLinks?: AdminClient[] }`

## `documents`

Role: documents attachements

Champs (DTO cible):
- `id: string`
- `name: string`
- `type?: 'contract' | 'receipt' | 'other'`
- `url: string`
- `uploadedAt: string`
- `signed: boolean`

## `payments` (legacy)

Role: paiements loyer legacy hors abonnement admin

Champs observes:
- `id`
- `rentalId`
- `paymentId`
- `amount`
- `receiptId`
- `receiptNumber`
- `date`
- `description`

## `deposits` (legacy)

Role: cautions legacy

Champs observes:
- `id`
- `rentalId`
- `amount`
- `receiptId`
- `date`
- `description`

## `rentals`

Role: collection legacy (souvent vide), certaines vues reconstruisent depuis `clients.rentals`.

## `otp`

Role: reserve OTP (schema SQL fourni), pas de routes actives dediees dans `index.mjs`.

## `entreprises`

Role: entreprises (certaines sont reconstruites depuis `admins.entrepriseId`).

## `import_errors`

Role: reserve import; retour `[]` si absent.

## 6.3 Relations metier

Relations principales:
- `users.id` <-> `admins.id`
- `superadmins.userId` -> `users.id`
- `admin_clients.adminId` -> admin actif (ou impersonne)
- `admin_clients.clientId` -> `clients.id`
- `admin_payments.adminId` -> admin
- `notifications.user_id` -> utilisateur destinataire
- `import_runs.adminId` -> proprietaire run
- `undo_actions.resource/resourceId` -> cible du rollback

## 7) Authentification, session, role, impersonation

Le backend a 2 mecanismes distincts.

## 7.1 Session simple (`/auth/*`)

Stockage memoire process:
- tableau global `sessions[]`
- une seule session conservee a la fois (`sessions.length = 0` puis push)

Endpoints:
- `POST /auth/login`
- `GET /auth/session`
- `POST /auth/logout`

## 7.2 Auth context (`/authContext/*`)

Stockage memoire process:
- objet global `authContext = { userId, impersonation, updatedAt }`
- contexte partage process (pas de session par navigateur)

Endpoints:
- `GET /authContext`
- `POST /authContext/login`
- `POST /authContext/logout`
- `POST /authContext/impersonate`
- `POST /authContext/clear-impersonation`

## 7.3 Resolution role active (`getAuthContextUser()`)

Regles:
- si aucun `authContext.userId`: role null
- role derive de `users[userId].role`
- `adminId` effectif:
  - `SUPER_ADMIN` + impersonation -> `impersonation.adminId`
  - `ADMIN` -> `user.id`

## 7.4 Contraintes admin

Au login/refresh context:
- un user `ADMIN` doit avoir `status === ACTIF`
- et une entree correspondante dans `admins`
- sinon `403` refus

## 8) Controle d'acces global

## 8.1 Middleware blocage IP

- Actif avant routes auth.
- Ignore IP locales (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`).
- Si IP dans `blocked_ips`: HTTP `403` + audit `BLOCKED_IP_HIT`.

## 8.2 Middleware blocage abonnement admin (HTTP 402)

Bloque les admins impayes en retard (hors routes autorisees).

Routes autorisees meme si abonnement bloque:
- `/auth*`
- `/authContext*`
- `/admin_payments*`
- `/audit_logs*`
- `/undo-actions*`
- `GET /admins/:id`

Payload en cas blocage:

```json
{
  "error": "Abonnement mensuel impaye (YYYY-MM). Paiement requis avant deblocage.",
  "code": "ADMIN_SUBSCRIPTION_BLOCKED",
  "overdueMonth": "YYYY-MM",
  "dueAt": "ISO_DATE",
  "requiredMonth": "YYYY-MM"
}
```

## 9) Endpoints specialises (contrats complets)

Base URL: `http://localhost:4000`

## 9.1 `POST /sign`

But:
- Signer des params Cloudinary cote backend.

Body supporte:

```json
{
  "folder": "optional/folder",
  "public_id": "optional-public-id"
}
```

Success 200:

```json
{
  "api_key": "...",
  "timestamp": 1730000000,
  "signature": "sha1...",
  "folder": "optional",
  "public_id": "optional"
}
```

Erreurs:
- `500`: backend Cloudinary non configure.

## 9.2 `POST /cloudinary/open-url`

But:
- Generer une URL de download Cloudinary signee (duree 5 minutes).

Auth:
- exige role present dans `authContext`.

Body:

```json
{
  "url": "https://res.cloudinary.com/..."
}
```

Success 200:

```json
{
  "url": "https://api.cloudinary.com/v1_1/.../download?...",
  "expiresAt": "ISO_DATE"
}
```

Erreurs:
- `401` Not authenticated
- `400` Missing document url
- `400` Invalid Cloudinary delivery url
- `400` Cloudinary cloud name mismatch
- `500` Cloudinary signature service non configure

## 9.3 `POST /auth/login`

But:
- Login session simple (`sessions[]`).

Body:

```json
{
  "username": "username or phone",
  "password": "plain"
}
```

Success 200:

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

Erreurs:
- `400` Missing credentials
- `403` Demande en attente d'approbation
- `401` Invalid credentials
- `403` Acces interdit. Decision du Super Admin.

Effets de bord:
- ajoute audit `FAILED_LOGIN` sur echec
- bloque IP apres seuil
- cree notifications super admin sur blocage IP auto

## 9.4 `POST /auth/pending-check`

Body:

```json
{
  "username": "...",
  "password": "..."
}
```

Success 200:

```json
{ "pending": true }
```

Cas invalide:
- `400` + `{ "pending": false }` si credentials absents

## 9.5 `GET /auth/session`

But:
- Recuperer user de la session simple active.

Success 200:
- `{ "user": { ... } }`

Erreurs:
- `401` No active session
- `401` Session user not found
- `403` Acces interdit. Decision du Super Admin.

## 9.6 `POST /auth/logout`

Success 200:

```json
{ "ok": true }
```

## 9.7 `GET /authContext`

But:
- Recuperer user + impersonation du contexte global.

Success 200:

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

Erreur:
- `403` Acces interdit. Decision du Super Admin. (admin invalide/non actif)

## 9.8 `POST /authContext/login`

Body:

```json
{
  "username": "...",
  "password": "..."
}
```

Success 200:

```json
{
  "user": { "id": "...", "role": "..." },
  "impersonation": null
}
```

Erreurs:
- `400` Missing credentials
- `403` Demande en attente d'approbation
- `401` Invalid credentials

## 9.9 `POST /authContext/logout`

Success 200:

```json
{ "ok": true }
```

## 9.10 `POST /authContext/impersonate`

Body:

```json
{
  "adminId": "...",
  "adminName": "...",
  "userId": "optional"
}
```

Success 200:

```json
{ "ok": true }
```

Erreurs:
- `400` Missing admin
- `401` Not authenticated

## 9.11 `POST /authContext/clear-impersonation`

Success 200:

```json
{ "ok": true }
```

Erreur:
- `401` Not authenticated

## 9.12 `POST /blocked_ips`

Auth:
- `SUPER_ADMIN` requis (via `authContext`).

Body:

```json
{
  "ip": "203.0.113.55",
  "reason": "optional"
}
```

Success 201:

```json
{
  "id": "block-...",
  "ip": "203.0.113.55",
  "reason": "Blocage manuel",
  "createdAt": "ISO"
}
```

Erreurs:
- `403` Access forbidden
- `400` Missing ip

Effets de bord:
- audit `IP_BLOCKED`
- notification `SECURITY_ALERT`

## 9.13 `DELETE /blocked_ips/:id`

Success 200:

```json
{ "ok": true }
```

Erreurs:
- `400` Missing id
- `404` Not found

Effets de bord:
- audit `IP_UNBLOCKED`
- notification `SECURITY_ALERT`

## 9.14 `GET /admin_payments/status`

Query optionnelle:
- `adminId` (utile super admin sans impersonation)

Success 200:

```json
{
  "adminId": "...",
  "blocked": true,
  "overdueMonth": "2026-01",
  "dueAt": "ISO",
  "requiredMonth": "2026-01",
  "currentMonth": "2026-02",
  "graceDays": 5
}
```

Erreurs:
- `401` Not authenticated
- `400` Admin manquant

## 9.15 `POST /admin_payments/webhook/:provider?`

But:
- Confirmer un paiement provider (Stripe/Wave/Orange).

Headers:
- Stripe: `stripe-signature` (ou fallback `x-signature`)
- Wave/Orange: `x-signature` ou `x-webhook-signature`

Body:
- payload provider JSON

Success 200:

```json
{ "ok": true, "paymentId": "...", "status": "paid" }
```

Autres retours:
- `{ "ok": true, "ignored": true }` si event non paye

Erreurs:
- `400` provider invalide
- `401` Signature webhook invalide
- `404` Paiement admin introuvable pour ce webhook

Effets de bord:
- met `admin_payments.status=paid`
- met `admins.paid=true`
- audit `ADMIN_PAYMENT_CONFIRMED`

## 9.16 `GET /undo-actions`

Query:
- `limit` ou `_limit` (max 50, defaut 10)

Success 200:

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

Erreurs:
- `401` Not authenticated

Regle visibilite:
- `SUPER_ADMIN`: voit tout
- autres roles: voient leurs propres actions

## 9.17 `POST /undo-actions/:id/rollback`

Success 200:

```json
{ "ok": true, "rolledBackId": "undo-..." }
```

Erreurs:
- `401` Not authenticated
- `400` ID de rollback manquant
- `404` Action rollback introuvable
- `403` Rollback non autorise pour cette action
- `410` Rollback expire
- `422` Action non annulable / rollback impossible

Effets de bord:
- supprime l'action undo consommee
- audit `UNDO_ROLLBACK`

## 10) Routes CRUD dynamiques (`/:name`)

Routes exposees:
- `GET /:name`
- `GET /:name/:id`
- `POST /:name`
- `PUT /:name`
- `PUT /:name/:id`
- `PATCH /:name`
- `PATCH /:name/:id`
- `DELETE /:name/:id`

## 10.1 Conventions CRUD

- Creation: status `201` sur `POST` si succes.
- Si `res.locals.data === undefined`: status `404` final.
- Collections special-case renvoyees `[]` si absentes: `settings`, `import_runs`, `import_errors`, `documents`.
- Header undo sur ecritures eligibles:
  - `x-undo-id`
  - `x-undo-expires-at`
  - `x-undo-resource`
  - `x-undo-resource-id`

## 10.2 GET `/:name` - comportements specifiques

### `admin_requests`
- reconstruit depuis `users` role ADMIN et status EN_ATTENTE
- inclut champs sensibles `password`

### `admin_payments`
- filtre selon role/authContext
- normalise `month`, `method`, `status`, `provider`
- trie desc date (`paidAt` puis `createdAt`)

### `import_runs`
- filtre par proprietaire (`adminId`) sauf super admin global
- normalise le record (`readSuccess`, `readErrors`, etc.)
- trie desc `createdAt`

### `entreprises`
- fusionne `entreprises` + derive de `admins.entrepriseId`
- dedoublonnage par nom

### `admins`
- vue enrichie via `buildAdminView()` + infos `users`

### `clients`
- filtre par `admin_clients` (sauf super admin global)
- vue enrichie via `buildClientView()`

### `notifications`
- filtre optionnel `user_id`
- tri desc `created_at`

### `audit_logs`
- tri desc `createdAt`

### `blocked_ips`
- tri desc `createdAt`

## 10.3 GET `/:name/:id` - comportements specifiques

### `admin_requests/:id`
- lit dans `users` role ADMIN
- renvoie 404 si absent

### `import_runs/:id`
- role requis
- controle de possession (`canAccessImportRun`)

### `clients/:id`
- role requis
- controle lien admin-client (sauf super admin global)
- vue enrichie client+rental

## 10.4 POST `/:name` - comportements specifiques

### `import_runs`
- role requis
- determine `adminId` proprietaire
- normalise record
- cree + undo

### `clients`
- role requis
- anti-doublon phone/email
- id auto possible (`client-...`)
- cree user CLIENT si absent:
  - `username`: `req.body.username || clientId`
  - `password`: `req.body.password || 'client123'`
- cree lien `admin_clients` si `adminId` actif

### `admin_requests`
- anti-doublon user
- cree user ADMIN en attente (`status='EN_ATTENTE'`)
- defaults possibles:
  - `username = id`
  - `password = 'admin123'`
- notifie super admins (`type='ADMIN_REQUEST'`)
- audit `ADMIN_REQUEST_CREATE`
- undo

### `admin_payments`
- role requis
- resolve admin cible
- applique regles abonnement/mois requis
- valide methode/montant
- contraintes role:
  - super admin -> `cash` uniquement
  - admin -> `cash` interdit
- dedoublonne mois deja `pending` ou `paid`
- initie provider pour `wave` / `orange_money`
- cree paiement + undo
- si status `paid`, maj `admins.paid`

### `users`, `admins`, `entreprises`
- anti-doublons applique

## 10.5 PUT `/:name` et `/:name/:id` - comportements specifiques

Controles generaux:
- anti-doublon sur `clients`, `users`, `admins`, `entreprises`

Specifique `admin_requests/:id`:
- met a jour user ADMIN demande
- si passage `ACTIF`, cree `admins` si absent
- audit `ADMIN_REQUEST_STATUS` sur changement
- undo

Specifique `admins`:
- audit `ADMIN_STATUS` si changement status

## 10.6 PATCH `/:name` et `/:name/:id` - comportements specifiques

Specifique `import_runs/:id`:
- role requis + controle acces
- normalise `inserted/errors/ignored/readSuccess/readErrors`

Specifique `clients/:id`:
- role requis + controle acces
- anti-doublon

Specifique `users/admins/entreprises`:
- anti-doublons

## 10.7 DELETE `/:name/:id` - comportements specifiques

Specifique `clients/:id`:
- role requis
- controle lien admin-client
- audit `CLIENT_DELETE`

Global:
- suppression via `service.destroyById`
- undo si ressource eligible

## 11) Regles metier detaillees

## 11.1 Normalisation identifiants

`normalizePhone(phone)`:
- supprime non chiffres
- retire prefixe pays `221` si present
- conserve les 9 derniers chiffres

`normalizeEmail(email)`:
- trim + lowercase

`normalizeText(value)`:
- trim + lowercase

## 11.2 Doublons

`hasDuplicateClient`:
- conflit si meme phone normalise OU meme email normalise

`hasDuplicateUser`:
- username unique cross `users` + `admins`
- email unique cross `users` + `admins`
- phone unique dans `users`

`hasDuplicateAdmin`:
- username unique dans `admins`
- username non conflictuel avec `users` sauf match sur `payload.userId`

`hasDuplicateEntreprise`:
- nom unique cross `entreprises` + `admins.entrepriseId`

## 11.3 Abonnement admin (algorithme)

`getAdminSubscriptionStatus(adminId)`:
- calcule mois debut depuis date creation admin/user
- recense mois payes depuis `admin_payments` (status paid)
- pour chaque mois <= mois courant:
  - date limite = jour `ADMIN_SUBSCRIPTION_GRACE_DAYS` du mois suivant a 23:59:59.999
  - si depassee et mois non paye => `blocked=true`

Retour:
- `blocked`
- `overdueMonth`
- `dueAt`
- `requiredMonth`

## 11.4 Paiements admin

Methodes supportees:
- `wave`
- `orange_money`
- `cash`

Mapping methode -> provider:
- `wave` -> `wave`
- `orange_money` -> `orange`
- `cash` -> `manual`

Normalisation provider:
- `orange_money` -> `orange`
- `om` -> `orange`
- `manual` -> `manual`
- autres: `stripe`, `wave`, `orange`

Statuts normalises:
- `pending`
- `failed`
- `cancelled`
- `paid`
- default fallback: `paid`

Simulation provider:
- si `PAYMENT_ALLOW_SIMULATION=true`, l'initiation renvoie status `paid` immediatement.

## 11.5 Blocage IP auto

Declencheur:
- >= 5 echecs login (`FAILED_LOGIN`) dans la derniere heure pour la meme IP non locale.

Effets:
- ajoute entree `blocked_ips`
- audit `IP_BLOCKED`
- notification super admin `SECURITY_ALERT`

## 11.6 Undo / rollback

Action rollback construite au moment de l'ecriture:
- `POST` => rollback type `delete`
- `PUT/PATCH` => rollback type `upsert` de l'etat precedent
- `DELETE` => rollback type `create` de l'etat precedent

Side effects clients:
- restauration user CLIENT associe
- restauration liens `admin_clients`

Compatibilite historique:
- `resolveRollbackEntry` reconstruit un plan pour vieilles entrees sans champ `rollback`.

## 11.7 Audit automatique

Middleware global:
- log `SLOW_REQUEST` si temps >= 1500ms (hors `/audit_logs`)
- log `SERVER_ERROR` si status >= 500

## 12) Catalogue des actions audit

Actions observees dans le code:
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

## 13) Catalogue des notifications systeme

Types observes:
- `SECURITY_ALERT`
- `ADMIN_REQUEST`

## 14) Catalogue des erreurs HTTP (API principale)

## 14.1 Messages explicites codifies

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
| 422 | `Rollback impossible.` (ou message detaille `applyResult.error`) |
| 500 | `Cloudinary signature service is not configured on backend.` |
| 502 | message provider (`Configuration ... manquante` ou erreur upstream) |

## 14.2 Erreurs de duplicate metier

Messages renvoyes via `conflict`:
- `Ce nom d'utilisateur existe deja.`
- `Cet email existe deja.`
- `Ce numero existe deja.`
- `Cette entreprise existe deja.`

## 15) Validations backend (module central)

Fichiers:
- `src/validators/backend/index.ts`
- `src/validators/backend/common.ts`

Validateurs de base:
- `validateSenegalNumber`
- `validateCNI`
- `validateName`
- `validateEmail`
- `validateAmount`
- `validateDate`
- `validatePropertyName`
- `validatePropertyType`
- `validateId`
- `validateUsername`
- `validatePassword`
- `validateStatus`

Validateurs entites:
- `validateClientData`
- `validateRentalData`
- `validatePaymentData`
- `validateAdminData`

Duplicate helper:
- `checkDuplicates(db, checks)`

Important:
- Ces validateurs sont disponibles mais non branches automatiquement sur toutes les routes de `backend/src/index.mjs`.
- Les validations runtime majeures sont implementees directement dans le routeur (`index.mjs`).

## 16) Messages centralises (i18n)

Fichiers:
- Cles: `src/messages/validation-keys.ts`
- FR: `src/messages/franchais/*`
- EN: `src/messages/anglais/*`
- Resolveur: `getValidationMessage()` dans `src/messages/validation.ts`

Exemples categories:
- `validation.common.*`
- `validation.client.*`
- `validation.auth.*`
- `validation.property.*`
- `validation.payment.*`

## 17) DTO lies au backend

## 17.1 DTO backend request

Dossier `src/dto/backend/requests`:
- `ClientCreateDTO`
- `ClientUpdateDTO`
- `DocumentCreateDTO`
- `DepositCreateDTO`
- `DepositUpdateDTO`
- `PaymentCreateDTO`
- `PaymentUpdateDTO`
- `PaymentMonthlyUpdateDTO`
- `ImportRunCreateDTO` (contient aussi `ImportRunUpdateDTO`)

## 17.2 DTO backend response

Dossier `src/dto/backend/responses`:
- `ClientDTO` + `RentalDTO`
- `PaymentDTO` (`PaymentRecordDTO`, `MonthlyPaymentDTO`)
- `DepositDTO`
- `DocumentDTO`
- `ImportRunDTO`
- `WorkItemDTO`

## 17.3 DTO frontend relies au backend

Dossiers `src/dto/frontend/requests` et `src/dto/frontend/responses`:
- Auth: `AuthRequestDTO`, `AuthResponseDTO`, `AuthUser`
- Admin: `AdminDTO`, `AdminRequestDTO`, `AdminCreateDTO`, `AdminUpdateDTO`, `AdminRequestCreateDTO`, `AdminRequestUpdateDTO`
- Paiement abonnement: `AdminPaymentCreateDTO`, `AdminPaymentDTO`, `AdminPaymentStatusDTO`
- Support: `EntrepriseDTO`, `EntrepriseCreateDTO`, `UserDTO`, `UserCreateDTO`, `BlockedIpDTO`, `AuditLogDTO`

## 18) Matrice endpoint -> table -> DTO

| Domaine | Endpoints | Tables | DTO |
| --- | --- | --- | --- |
| Auth session | `/auth/login`, `/auth/session`, `/auth/logout` | `users`, `admins`, `audit_logs`, `blocked_ips`, `notifications` | `AuthRequestDTO`, `AuthResponseDTO`, `AuthUser` |
| Auth context | `/authContext*` | `users`, `admins` | `AuthResponseDTO`, `AuthUser` |
| Cloudinary | `/sign`, `/cloudinary/open-url` | aucune ou `documents` indirect | `DocumentDTO` (usage indirect) |
| Admin requests | `/admin_requests` | `users`, `admins`, `notifications`, `audit_logs` | `AdminRequestCreateDTO`, `AdminRequestUpdateDTO`, `AdminRequestDTO` |
| Admin paiements | `/admin_payments*` | `admin_payments`, `admins`, `audit_logs` | `AdminPaymentCreateDTO`, `AdminPaymentDTO`, `AdminPaymentStatusDTO` |
| Clients | `/clients` | `clients`, `users`, `admin_clients`, `audit_logs` | `ClientCreateDTO`, `ClientUpdateDTO`, `ClientDTO` |
| Imports | `/import_runs` | `import_runs` | `ImportRunCreateDTO`, `ImportRunDTO` |
| Undo | `/undo-actions*` | `undo_actions` + ressources cibles | `UndoActionDTO` (service) |
| Securite IP | `/blocked_ips*` | `blocked_ips`, `audit_logs`, `notifications` | `BlockedIpDTO` |
| Monitoring | `/audit_logs`, `/notifications` | `audit_logs`, `notifications` | `AuditLogDTO`, `NotificationDTO` |
| Settings | `/settings` | `settings` | `SettingRecord` |
| Legacy paiements | `/payments`, `/deposits` | `payments`, `deposits` | `PaymentDTO`, `DepositDTO` |

## 19) SQL de reference (`backend/db/*.sql`)

Ces fichiers representent un modele SQL cible/legacy. Ils ne sont pas executes automatiquement par l'API `lowdb`.

- `audit-logs.sql`
  - table `AuditLogs`
  - indexes: `idx_auditlogs_timestamp`, `idx_auditlogs_user_id`
- `anomaly-monitoring.sql`
  - requetes detection echec login et activite anormale IP
- `notifications.sql`
  - table `Notifications`
  - index `idx_notifications_is_read`
- `otp.sql`
  - table `OTP`
  - indexes `idx_otp_is_used`, `idx_otp_expires_at`
- `log-backup.sh`
  - script backup SQL AuditLogs

## 20) Serveur legacy Cloudinary (`backend/server/index.js`)

## 20.1 Endpoints

- `POST /sign`
  - body: `folder?`, `public_id?`
  - response: `api_key`, `timestamp`, `signature`, `folder?`

## 20.2 Particularites

- Charge `CLOUDINARY_URL` via `dotenv`.
- Lance `setInterval(monitorAnomalies, 3600000)`.

## 20.3 Limites techniques observees

Dans `backend/server/index.js`:
- `logAction()` reference `req` et `db` non definis.
- `monitorAnomalies()` reference `db` non defini.
- Le timer d'anomalie peut provoquer des erreurs runtime si ce code est execute tel quel.

Ce serveur doit etre considere comme legacy et minimal.

## 21) Serveur legacy auth (`backend/json-server-auth.cjs`)

Fonction:
- expose un `POST /auth/login` simple sur `users` de `db.json`.
- sert router json-server standard.

Limitations:
- aucune logique avancee (roles, abonnement, undo, ip block, etc.).
- non utilise dans les scripts principaux actuels.

## 22) CORS, parser, format de reponse

CORS:
- active globalement
- `OPTIONS *` autorise
- `allowedHeaders` reprend `access-control-request-headers`

Body parser:
- `app.use(json())` (`milliparsec`)

Sortie:
- JSON pour la plupart des routes
- status `201` force pour POST via serializer final

## 23) Logging frontend <-> backend (important)

Le frontend (`src/services/http.ts`):
- envoie des logs `SLOW_REQUEST_CLIENT` et `API_ERROR` vers `/audit_logs`.
- mappe les erreurs HTTP (`400/401/402/403/...`) en messages UI.
- dispatch event browser sur:
  - `auth-session-expired` (401)
  - `admin-subscription-blocked` (402)
  - `api-undo-available` quand headers undo presents

Implication:
- `/audit_logs` recoit des logs serveur + des logs client.

## 24) Exemples de payload CRUD

## 24.1 Creer client

```json
POST /clients
{
  "firstName": "Moussa",
  "lastName": "Ndiaye",
  "phone": "+221771112233",
  "email": "moussa@example.com",
  "cni": "1234567890123",
  "status": "active",
  "rentals": []
}
```

## 24.2 Creer demande admin

```json
POST /admin_requests
{
  "name": "Modou Ndiaye",
  "phone": "770001010",
  "email": "modou@example.com",
  "entrepriseName": "ModouShop",
  "username": "770001010",
  "password": "secret123"
}
```

## 24.3 Creer paiement abonnement admin

```json
POST /admin_payments
{
  "adminId": "admin-001",
  "entrepriseId": "MY-ENT",
  "amount": 10000,
  "method": "wave",
  "month": "2026-02",
  "payerPhone": "771234567",
  "note": "Paiement abonnement"
}
```

## 24.4 Lister undo

```json
GET /undo-actions?limit=20
```

## 25) Checklist operationnelle

Avant de lancer:
1. Copier les `.env.example`.
2. Renseigner les secrets providers.
3. Verifier que `backend/db/db.json` est present et accessible en ecriture.
4. Demarrer `npm run dev:all`.

Avant mise en production:
1. Supprimer stockage mot de passe en clair.
2. Introduire auth stateless (JWT) ou session robuste par utilisateur.
3. Activer controles role stricts sur toutes routes sensibles.
4. Ajouter tests automatises d'integration.
5. Migrer lowdb vers base transactionnelle.
6. Rationaliser les 2 services Cloudinary (garder un seul).

## 26) Risques et points d'attention

1. `authContext` est global process, pas isole par client HTTP.
2. `/auth/login` et `/authContext/login` coexistent, risque d'incoherence.
3. `DELETE /blocked_ips/:id` ne verifie pas explicitement le role super admin.
4. Certains endpoints retournent des donnees sensibles (`password` dans `admin_requests`).
5. Verification Stripe webhook peut etre fragile si payload brut non conserve.
6. `backend/server/index.js` contient du code SQL non connecte.
7. lowdb n'est pas adapte a forte concurrence.

## 27) Annexes: fichiers techniques utiles

- API principale: `backend/src/index.mjs`
- Sign server legacy: `backend/server/index.js`
- Legacy auth server: `backend/json-server-auth.cjs`
- DB JSON: `backend/db/db.json`
- SQL reference: `backend/db/*.sql`
- DTO backend requests: `src/dto/backend/requests/*`
- DTO backend responses: `src/dto/backend/responses/*`
- Validators backend: `src/validators/backend/*`
- Messages validation/i18n: `src/messages/*`
- Services API frontend relies: `src/services/api/*`

---

## Documents operationnels

- Guide metier (Ops/Admin): `backend/GUIDE_METIER_OPS_ADMIN.md`
- Reference API stricte: `backend/API_REFERENCE.md`
- SOP imprimables (1 page): `backend/SOP/README.md`
