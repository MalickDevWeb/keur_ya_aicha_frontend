# docBack - Backend Next.js reel base sur ton projet actuel

Ce dossier documente une implementation backend **Next.js + PostgreSQL + Cloudinary** en conservant la logique metier existante dans :
- `backend/src/index.mjs`
- `backend/db/migrations/001_init_schema.sql`
- `backend/db/db.json`
- `src/services/api/*.ts`
- `src/services/services/*.ts`
- `src/validators/frontend/*.ts`
- `src/validators/backend/*.ts`
- `src/dto/backend/*` et `src/dto/frontend/*`
- `src/messages/*`

## 1. Modele et architecture

## 1.1 Cible technique
- Framework API: Next.js App Router (`app/api/**/route.ts`)
- DB: PostgreSQL (`pg`)
- Validation: Joi
- Storage fichiers: Cloudinary (upload + URL signee)
- Auth: session/JWT (au choix), en gardant les memes regles metier
- Logs: audit en base + events metier

## 1.2 Mapping metier actuel
- `User`: table `users`
- `Contact`: table `clients` + table de liaison `admin_clients`
- `Message`: table `notifications` (messages fonctionnels) + `audit_logs` (messages techniques/securite)
- Paiement loyer: `payments` (legacy) + paiements mensuels imbriques dans `clients.rentals[].payments` cote front
- Paiement abonnement admin: `admin_payments`

## 1.3 Tables PostgreSQL (etat cible)
Tables principales (issues de `backend/db/migrations/001_init_schema.sql`):
- `users`
- `admins`
- `superadmins`
- `entreprises`
- `clients`
- `admin_clients`
- `rentals`
- `documents`
- `payments`
- `deposits`
- `admin_payments`
- `settings`
- `audit_logs`
- `notifications`
- `blocked_ips`
- `import_runs`
- `import_errors`
- `undo_actions`
- `otp`

Relations clefs:
- `admins.id -> users.id`
- `clients.admin_id -> admins.id`
- `admin_clients.admin_id -> admins.id`
- `admin_clients.client_id -> clients.id`
- `rentals.client_id -> clients.id`
- `documents.client_id -> clients.id` ou `documents.rental_id -> rentals.id`
- `payments.rental_id -> rentals.id`
- `deposits.rental_id -> rentals.id`
- `admin_payments.admin_id -> admins.id`
- `notifications.user_id -> users.id`
- `import_runs.admin_id -> admins.id`
- `import_errors.run_id -> import_runs.id`
- `undo_actions.actor_id -> users.id`
- `otp.user_id -> users.id`

Colonnes minimales a conserver par table:
- `users`: `id`, `username` (unique), `password`, `name`, `email` (unique), `phone` (unique), `role`, `status`, `created_at`, `updated_at`.
- `admins`: `id` (FK users), `entreprise_id`, `status`, `paid`, `paid_at`, `created_at`, `updated_at`.
- `superadmins`: `id`, `user_id` (FK users), `name`, `email`, `status`, `created_at`.
- `entreprises`: `id`, `name` (unique), `created_at`.
- `clients`: `id`, `admin_id`, `first_name`, `last_name`, `phone`, `email`, `cni`, `status`, `created_at`, `updated_at`.
- `admin_clients`: `id`, `admin_id`, `client_id`, `created_at`, unique `(admin_id, client_id)`.
- `rentals`: `id`, `client_id`, `property_type`, `property_name`, `monthly_rent`, `start_date`, `deposit_total`, `created_at`, `updated_at`.
- `documents`: `id`, `client_id?`, `rental_id?`, `name`, `type`, `url`, `signed`, `uploaded_at`.
- `payments`: `id`, `rental_id`, `payment_id?`, `amount`, `receipt_id?`, `date`, `created_at`.
- `deposits`: `id`, `rental_id`, `amount`, `receipt_id?`, `date`, `created_at`.
- `admin_payments`: `id`, `admin_id`, `amount`, `method`, `status`, `provider`, `provider_reference`, `checkout_url`, `month`, `paid_at`, `approved_at`, `approved_by`, `provider_payload`, `created_at`, `updated_at`.
- `settings`: `id`, `key` (unique), `value`.
- `audit_logs`: `id`, `actor`, `action`, `target_type`, `target_id`, `message`, `ip_address`, `created_at`.
- `notifications` (Message metier): `id`, `user_id`, `type`, `message`, `is_read`, `created_at`.
- `blocked_ips`: `id`, `ip` (unique), `reason`, `created_at`.
- `import_runs`: `id`, `admin_id`, `file_name`, `total_rows`, `inserted(jsonb)`, `errors(jsonb)`, `ignored`, `read_success`, `read_errors`, `created_at`, `updated_at`.
- `import_errors`: `id`, `run_id`, `row_no`, `field`, `message`, `payload`, `created_at`.
- `undo_actions`: `id`, `resource`, `resource_id`, `method`, `actor_id`, `created_at`, `expires_at`, `path`, `rollback(jsonb)`, `side_effects(jsonb)`.
- `otp`: `id`, `user_id`, `code`, `action`, `expires_at`, `consumed_at`, `created_at`.

## 1.4 Arborescence recommandee (Next.js)
```txt
app/
  api/
    auth/
      login/route.ts
      session/route.ts
      logout/route.ts
      pending-check/route.ts
    authContext/
      route.ts
      login/route.ts
      logout/route.ts
      impersonate/route.ts
      clear-impersonation/route.ts
      super-admin/second-auth/route.ts
    admin_payments/
      status/route.ts
      webhook/[provider]/route.ts
    blocked_ips/
      route.ts
      [id]/route.ts
    undo-actions/
      route.ts
      [id]/rollback/route.ts
    cloudinary/
      sign/route.ts
      open-url/route.ts
    [resource]/route.ts
    [resource]/[id]/route.ts
lib/
  db.js
  cloudinary.js
  messages.js
  constants.js
modules/
  auth/
  users/
  admins/
  clients/
  payments/
  imports/
  security/
  undo/
  settings/
```

## 2. Ordre exact d'implementation

1. Creer la connexion PostgreSQL (`docBack/Utilitaires.md` -> `db.js`).
2. Appliquer la migration SQL de base (`backend/db/migrations/001_init_schema.sql`).
3. Centraliser les messages erreur/succes (`docBack/Messages.md`).
4. Implementer les DTOs typescript (`docBack/DTOs.md`).
5. Implementer les schemas Joi (`docBack/Validations-Joi.md`).
6. Implementer les services metier (`docBack/Services-Metier.md`).
7. Implementer les route handlers Next.js (`docBack/Routes-API.md`).
8. Ajouter Cloudinary (`docBack/Utilitaires.md` -> `cloudinary.js`).
9. Ajouter les middlewares metier: maintenance, blocage IP, seconde auth super admin, abonnement admin.
10. Ajouter la retention (`documents`, `audit_logs`) et cleanup `undo_actions` expires.
11. Ajouter les tests API (auth, paiements admin, undo, imports, cloudinary, droits d'acces).
12. Faire la migration progressive front: garder les memes endpoints et formats JSON.

## 3. Ce qui ne change jamais (invariants metier)

- Doublons: interdit sur username/email/phone selon les regles actuelles.
- Client: unicite telephone/email par admin + verification role/acces.
- Paiement abonnement admin:
  - methodes autorisees: `wave`, `orange_money`, `cash`
  - `cash` reserve Super Admin
  - Admin normal ne peut pas valider du cash
  - impossible de payer un mois futur si un mois requis est impaye
  - une ligne active max par `(adminId, month)` avec statut `pending|paid`
- Seconde authentification Super Admin obligatoire (TTL 30 min) hors routes exemptes.
- Blocage IP auto apres trop d'echecs login (seuil + fenetre configurables).
- Maintenance: bloque les ecritures hors whitelist.
- Undo: fenetre 60 jours, limite 300, rollback strict selon methode HTTP.
- Retention: purge periodique `documents` et `audit_logs` selon `settings.platform_config_v1`.
- Webhook provider: signature obligatoire avant confirmation paiement.

## 4. Variables d'environnement a configurer

```bash
# DB
DATABASE_URL=postgres://user:password@localhost:5432/kya

# App
APP_BASE_URL=http://localhost:3000
PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# Paiement provider
PAYMENT_PROVIDER=stripe
PAYMENT_ALLOW_SIMULATION=true

# Cloudinary
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
# fallback
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=

# Stripe
STRIPE_BASE_URL=https://api.stripe.com
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Wave
WAVE_BASE_URL=
WAVE_SECRET=
WAVE_WEBHOOK_SECRET=

# Orange
ORANGE_BASE_URL=
ORANGE_SECRET=
ORANGE_WEBHOOK_SECRET=
```

## 5. Bonnes pratiques
- Garder les noms de routes actuels pour eviter toute regression front.
- Mettre la logique metier dans `modules/*/service.ts`, pas dans les route handlers.
- Tout echec metier doit renvoyer un code HTTP + `error` lisible + `code` stable.
- Utiliser des transactions SQL pour les operations multi-tables (ex: `admin_requests` -> `users + admins + notifications`).
- Journaliser les actions sensibles dans `audit_logs`.
- Ne jamais exposer de secrets provider dans les reponses API.

## 5.1 Ecarts detectes dans l'etat actuel
- `work_items` est consomme cote front (`src/services/api/workItems.api.ts`) mais n'est pas dans la migration SQL principale. Ajoute la table si tu utilises ce module.
- Le format telephone n'est pas 100% uniforme selon les ecrans (auth plus permissif que client/import). Conserver ce comportement en migration 1 pour eviter une regression fonctionnelle.

## 6. Contenu de ce dossier
- `docBack/DTOs.md`
- `docBack/Services-Metier.md`
- `docBack/Validations-Joi.md`
- `docBack/Messages.md`
- `docBack/Utilitaires.md`
- `docBack/Routes-API.md`
- `docBack/Exemples-JSON.md`
