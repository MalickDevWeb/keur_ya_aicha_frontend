# Messages d'erreur et de succes centralises

Base actuelle:
- `src/messages/app/errors.ts`
- `src/messages/app/success.ts`
- `src/messages/validation-keys.ts`
- messages routes dans `backend/src/index.mjs`

## 1. Fichier recommande: `lib/messages.js`
```js
export const ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_PENDING: 'AUTH_PENDING',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  AUTH_SECOND_FACTOR_REQUIRED: 'SUPER_ADMIN_SECOND_AUTH_REQUIRED',

  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
  ADMIN_SUBSCRIPTION_BLOCKED: 'ADMIN_SUBSCRIPTION_BLOCKED',

  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTITY: 'DUPLICATE_ENTITY',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',

  PAYMENT_PROVIDER_ERROR: 'PAYMENT_PROVIDER_ERROR',
  WEBHOOK_INVALID_SIGNATURE: 'WEBHOOK_INVALID_SIGNATURE',

  ROLLBACK_EXPIRED: 'ROLLBACK_EXPIRED',
  ROLLBACK_NOT_ALLOWED: 'ROLLBACK_NOT_ALLOWED',

  CLOUDINARY_NOT_CONFIGURED: 'CLOUDINARY_NOT_CONFIGURED',
  CLOUDINARY_INVALID_URL: 'CLOUDINARY_INVALID_URL',
}

export const MESSAGES = {
  fr: {
    // Auth
    missingCredentials: 'Missing credentials',
    invalidCredentials: 'Invalid credentials',
    pendingRequest: "Demande en attente d'approbation",
    forbiddenBySuperAdmin: 'Acces interdit. Decision du Super Admin.',
    superAdminOnly: 'Acces reserve au Super Admin.',
    invalidSuperAdminPassword: 'Mot de passe invalide.',
    secondAuthRequired: 'Seconde authentification Super Admin requise.',

    // Generic
    notAuthenticated: 'Not authenticated',
    accessForbidden: 'Access forbidden',
    notFound: 'Not found',

    // Maintenance / subscription
    maintenanceBlocked: 'Maintenance en cours. Actions d\'ecriture indisponibles.',
    adminSubscriptionBlocked: 'Abonnement mensuel impaye. Paiement requis avant deblocage.',

    // IP / security
    blockedIp: 'Adresse IP bloquee pour raisons de securite.',

    // Admin payment
    missingAdmin: 'Admin manquant',
    invalidPaymentMethod: 'Methode de paiement invalide (wave, orange_money, cash).',
    cashSuperAdminOnly: 'Paiement especes: validation reservee au Super Admin.',
    superAdminCashOnly: 'Super Admin: seul le paiement especes est autorise.',
    invalidPaymentAmount: 'Montant de paiement invalide.',
    monthAlreadyPaid: 'Le mois est deja paye.',
    providerWebhookNotMatched: 'Paiement admin introuvable pour ce webhook.',
    invalidWebhookSignature: 'Signature webhook invalide.',

    // Undo
    undoIdMissing: 'ID de rollback manquant.',
    undoNotFound: 'Action rollback introuvable.',
    undoExpired: 'Rollback expire: action trop ancienne (plus de 2 mois).',
    undoNotAllowed: 'Rollback non autorise pour cette action.',

    // Cloudinary
    cloudinaryNotConfigured: 'Cloudinary signature service is not configured on backend.',
    cloudinaryMissingUrl: 'Missing document url',
    cloudinaryInvalidUrl: 'Invalid Cloudinary delivery url',
    cloudinaryCloudMismatch: 'Cloudinary cloud name mismatch',

    // Duplicates
    duplicateUserName: 'Ce nom d\'utilisateur existe deja.',
    duplicateUserEmail: 'Cet email existe deja.',
    duplicateUserPhone: 'Ce numero existe deja.',
    duplicateClient: 'Client existe deja avec ce numero ou cet email pour cet admin.',
    duplicateEntreprise: 'Cette entreprise existe deja.',

    // Success
    ok: 'Operation reussie',
    created: 'Cree avec succes',
    updated: 'Mis a jour avec succes',
    deleted: 'Supprime avec succes',
    loginSuccess: 'Connexion reussie',
    importSuccess: 'Importe avec succes',
  },
}

export function apiError(res, status, code, message, extra = {}) {
  return res.status(status).json({ error: message, code, ...extra })
}

export function apiSuccess(res, status, data = {}) {
  return res.status(status).json(data)
}
```

## 2. Mapping HTTP recommande
- 400: validation/missing fields
- 401: non authentifie, credentials invalides, signature webhook invalide
- 402: abonnement admin bloque
- 403: acces interdit, seconde auth requise
- 404: ressource introuvable
- 409: conflit/doublon metier
- 410: rollback expire
- 422: rollback impossible / payload semantiquement invalide
- 500/502/503: erreurs serveur/provider/maintenance

## 3. Messages de validation
Conserver les cles `VALIDATION_ERRORS` actuelles et leur traductions FR/EN.
