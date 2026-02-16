# Paramètres Super Admin - Référence Complète

## Objectif
Documenter tous les paramètres de gouvernance pilotés par le Super Admin:
- quoi configurer
- impact fonctionnel
- règles de validation
- persistance
- tests de validation

Ce document couvre la configuration stockée dans la clé backend:
- `settings.key = platform_config_v1`

## Où configurer dans l'application
Chemin UI:
- `Super Admin -> Paramètres -> Gouvernance Plateforme (Super Admin)`

Sections disponibles:
1. Mode Maintenance Global
2. Sécurité Session
3. Règles Paiement
4. Documents
5. Notifications
6. Branding
7. Audit & Conformité

## Persistance et chargement runtime
Stockage principal:
- backend `settings` avec `key = platform_config_v1`

Cache local frontend:
- `localStorage.kya_platform_config_v1`

Chargement:
1. Chargement local immédiat (fallback)
2. Rechargement serveur via `refreshPlatformConfigFromServer()`
3. Synchronisation via événement `platform-config-updated`

## Modèle JSON complet
```json
{
  "maintenance": {
    "enabled": false,
    "message": "Maintenance en cours. Les actions d’écriture sont temporairement désactivées."
  },
  "sessionSecurity": {
    "sessionDurationMinutes": 480,
    "inactivityTimeoutMinutes": 120,
    "maxFailedLogins": 5,
    "lockoutMinutes": 30
  },
  "paymentRules": {
    "graceDays": 5,
    "latePenaltyPercent": 0,
    "blockOnOverdue": true
  },
  "documents": {
    "maxUploadMb": 10,
    "allowedMimeTypes": [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp"
    ],
    "retentionDays": 365
  },
  "notifications": {
    "channels": {
      "sms": false,
      "email": true,
      "whatsapp": false
    },
    "events": {
      "maintenance": true,
      "loginFailure": true,
      "paymentOverdue": true,
      "apiError": true
    },
    "templates": {
      "maintenance": "Maintenance active: {message}",
      "loginFailure": "Tentative de connexion échouée pour {username}",
      "paymentOverdue": "Abonnement en retard pour {adminId} ({month})",
      "apiError": "Erreur API {path}: {error}"
    }
  },
  "branding": {
    "appName": "Keur Ya Aicha",
    "logoUrl": "/logo.png",
    "primaryColor": "#121B53",
    "footerText": "© Keur Ya Aicha"
  },
  "auditCompliance": {
    "retentionDays": 365,
    "autoExportEnabled": false,
    "autoExportFormat": "csv",
    "autoExportIntervalHours": 24,
    "alertWebhookEnabled": false,
    "alertWebhookUrl": "",
    "alertWebhookSecret": "",
    "alertOnApiError": true,
    "alertOnSecurityEvent": true
  }
}
```

## Détail des paramètres

## 1) Mode Maintenance Global
Paramètres:
- `maintenance.enabled` (`boolean`)
- `maintenance.message` (`string`)

Validation:
- `message` non vide (fallback auto si vide)

Effet:
- Frontend bloque tous les appels API en écriture (`POST`, `PUT`, `PATCH`, `DELETE`) hors liste blanche.
- Backend applique aussi un blocage d’écriture avec retour `503` + code `MAINTENANCE_MODE`.
- Message affiché à tous (bannière + toast).

Liste blanche maintenance:
- `/settings`
- `/audit_logs`
- `/auth`
- `/authContext`
- `/undo-actions`
- `/sign`
- `/cloudinary/open-url`
- `/admin_payments/webhook/*`

## 2) Sécurité Session
Paramètres:
- `sessionSecurity.sessionDurationMinutes` (`5..1440`)
- `sessionSecurity.inactivityTimeoutMinutes` (`1..1440`)
- `sessionSecurity.maxFailedLogins` (`1..50`)
- `sessionSecurity.lockoutMinutes` (`1..1440`)

Effet frontend:
- Déconnexion automatique sur dépassement durée max.
- Déconnexion automatique sur inactivité.
- Blocage de tentative login après N échecs.

Effet backend:
- Seuil d’échecs IP dynamique selon `maxFailedLogins`.
- Fenêtre de blocage dynamique selon `lockoutMinutes`.

## 3) Règles Paiement
Paramètres:
- `paymentRules.graceDays` (`0..31`)
- `paymentRules.latePenaltyPercent` (`0..100`)
- `paymentRules.blockOnOverdue` (`boolean`)

Effet:
- Date limite abonnement calculée avec `graceDays`.
- Pénalité appliquée côté interface paiement si retard.
- Si `blockOnOverdue = true`, backend limite l’accès admin (`HTTP 402`).

## 4) Documents
Paramètres:
- `documents.maxUploadMb` (`1..1024`)
- `documents.allowedMimeTypes` (`string[]`)
- `documents.retentionDays` (`1..3650`)

Effet:
- Upload rejeté si taille > `maxUploadMb`.
- Upload rejeté si MIME non autorisé.
- Rétention backend automatique:
  - sweep périodique toutes les 60 secondes
  - suppression des documents plus vieux que `retentionDays`.

## 5) Notifications
Paramètres:
- `notifications.channels.sms` (`boolean`)
- `notifications.channels.email` (`boolean`)
- `notifications.channels.whatsapp` (`boolean`)
- `notifications.events.maintenance` (`boolean`)
- `notifications.events.loginFailure` (`boolean`)
- `notifications.events.paymentOverdue` (`boolean`)
- `notifications.events.apiError` (`boolean`)
- `notifications.templates.maintenance` (`string`)
- `notifications.templates.loginFailure` (`string`)
- `notifications.templates.paymentOverdue` (`string`)
- `notifications.templates.apiError` (`string`)

Placeholders supportés (selon événement):
- maintenance: `{message}`
- loginFailure: `{username}`, `{failures}`, `{blocked}`
- paymentOverdue: `{adminId}`, `{month}`, `{dueAt}`
- apiError: `{path}`, `{error}`, `{method}`

Effet:
- Filtrage par événement.
- Construction message à partir du template.
- Envoi via webhook conformité (si activé) avec les canaux actifs dans le payload.

Note:
- Les toggles SMS/Email/WhatsApp pilotent le payload et la gouvernance.
- L’envoi direct provider (Twilio/SMTP/WhatsApp API) n’est pas branché ici.

## 6) Branding
Paramètres:
- `branding.appName` (`string`)
- `branding.logoUrl` (`string`, URL `http(s)` ou chemin local `/...`)
- `branding.primaryColor` (`string`, recommandé `#RRGGBB`)
- `branding.footerText` (`string`)

Effet:
- Titre navigateur mis à jour dynamiquement.
- Couleur primaire injectée au runtime dans les variables CSS.
- Logo dynamique dans l’écran login et la sidebar.
- Texte footer global affiché dans le layout principal.

## 7) Audit & Conformité
Paramètres:
- `auditCompliance.retentionDays` (`1..3650`)
- `auditCompliance.autoExportEnabled` (`boolean`)
- `auditCompliance.autoExportFormat` (`csv|json`)
- `auditCompliance.autoExportIntervalHours` (`1..168`)
- `auditCompliance.alertWebhookEnabled` (`boolean`)
- `auditCompliance.alertWebhookUrl` (`string`, URL `http(s)`)
- `auditCompliance.alertWebhookSecret` (`string`)
- `auditCompliance.alertOnApiError` (`boolean`)
- `auditCompliance.alertOnSecurityEvent` (`boolean`)

Effet:
- Exports automatiques de logs côté app (Super Admin connecté).
- Export manuel immédiat possible depuis paramètres.
- Application manuelle de la rétention logs.
- Rétention backend automatique des logs via sweep périodique.
- Envoi webhook d’alertes conditionnel (API errors / events sécurité).

Header webhook optionnel:
- `x-kya-webhook-secret: <alertWebhookSecret>`

## Actions disponibles dans l’écran Paramètres
Boutons principaux:
1. `Enregistrer` - Sauvegarde de `platform_config_v1`.
2. `Recharger` - Relit la configuration serveur.
3. `Appliquer rétention logs` - Supprime les logs hors politique.
4. `Exporter logs maintenant` - Download `CSV` ou `JSON`.
5. `Tester webhook` - Envoie un événement de test conformité.

## Messages et codes de retour importants
Maintenance:
- HTTP `503`
- code: `MAINTENANCE_MODE`

Blocage abonnement:
- HTTP `402`
- code: `ADMIN_SUBSCRIPTION_BLOCKED`

Session expirée:
- HTTP `401` puis redirection login côté frontend

Validation upload:
- `Fichier trop volumineux (...)`
- `Type de fichier non autorisé (...)`

## Procédure de validation rapide (10 minutes)
1. Activer maintenance + message custom, puis tenter une création client.
2. Réduire `inactivityTimeoutMinutes` à `1` et vérifier la déconnexion auto.
3. Régler `maxFailedLogins=2`, faire 2 échecs login, vérifier le blocage.
4. Mettre `graceDays=0`, `latePenaltyPercent=10`, vérifier le montant ajusté.
5. Mettre `maxUploadMb=1` puis uploader un fichier >1MB, vérifier rejet.
6. Changer `appName` + `logoUrl`, vérifier login/sidebar/titre.
7. Activer webhook + URL de test, déclencher une erreur API, vérifier réception.

## Dépannage
Symptôme: paramètres non appliqués immédiatement  
Actions:
1. Cliquer `Recharger` dans Paramètres.
2. Vérifier que `settings.key = platform_config_v1` existe en backend.
3. Vérifier l’accessibilité de l’API active (runtime API config).

Symptôme: webhook non reçu  
Actions:
1. Vérifier `alertWebhookEnabled=true`.
2. Vérifier URL `http(s)` valide.
3. Vérifier filtres `alertOnApiError` / `alertOnSecurityEvent`.
4. Consulter logs réseau de la cible webhook.

Symptôme: logo cassé  
Actions:
1. Utiliser URL absolue `https://...` ou chemin local `/logo.png`.
2. Tester l’URL directement dans le navigateur.
3. Garder un fallback local dans `public/logo.png`.

