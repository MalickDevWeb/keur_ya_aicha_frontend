# Keur Ya Aicha - Architecture du Projet

## 📋 Vue d'Ensemble

Ce projet est une application de gestion immobilière avec une architecture monolithique actuelle qui sera séparée en **Backend** et **Frontend** distincts.

---

# 🔙 PARTIE BACKEND (Nouveau Dossier)

Le backend a été reorganisé dans le dossier `backend/`:

## 1. Structure du Backend

```
backend/
├── src/
│   └── index.mjs              # Serveur API principal
├── db/
│   ├── db.json               # Base de données JSON
│   ├── *.sql                 # Schémas SQL
│   └── log-backup.sh         # Script backup
└── server/
    ├── index.js              # Serveur Cloudinary signatures
    └── .env
```

## 2. Fichiers du Serveur

| Fichier                                              | Description                   |
| ---------------------------------------------------- | ----------------------------- |
| [`backend/src/index.mjs`](backend/src/index.mjs)     | **Serveur API principal**     |
| [`backend/server/index.js`](backend/server/index.js) | Serveur signatures Cloudinary |

### Base de Données

| Fichier                                                                  | Description                             |
| ------------------------------------------------------------------------ | --------------------------------------- |
| [`backend/db/db.json`](backend/db/db.json)                               | **Base de données JSON**                |
| [`backend/db/audit-logs.sql`](backend/db/audit-logs.sql)                 | Schéma pour les logs d'audit            |
| [`backend/db/anomaly-monitoring.sql`](backend/db/anomaly-monitoring.sql) | Schéma pour la surveillance d'anomalies |
| [`backend/db/notifications.sql`](backend/db/notifications.sql)           | Schéma pour les notifications           |
| [`backend/db/otp.sql`](backend/db/otp.sql)                               | Schéma pour les codes OTP               |
| [`backend/db/log-backup.sh`](backend/db/log-backup.sh)                   | Script de sauvegarde des logs           |

### Endpoints API (dans json-server-auth.mjs)

#### Authentification

- `POST /auth/login` - Connexion utilisateur
- `POST /auth/logout` - Déconnexion
- `GET /auth/session` - Vérification session
- `POST /authContext/login` - Connexion avec contexte
- `POST /authContext/logout` - Déconnexion contexte
- `POST /authContext/impersonate` - Usurpation d'identité admin
- `GET /authContext` - Récupérer contexte auth
- `POST /auth/pending-check` - Vérifier demande en attente

#### Entités CRUD

| Ressource          | Endpoints                                  |
| ------------------ | ------------------------------------------ |
| **Clients**        | `GET/POST/PUT/PATCH/DELETE /clients`       |
| **Users**          | `GET/POST/PUT/PATCH/DELETE /users`         |
| **Admins**         | `GET/POST/PUT/PATCH/DELETE /admins`        |
| **Admin Requests** | `GET/POST/PUT/PATCH /admin_requests`       |
| **Entreprises**    | `GET/POST/PUT/PATCH/DELETE /entreprises`   |
| **Rentals**        | `GET/POST/PUT/PATCH/DELETE /rentals`       |
| **Payments**       | `GET/POST/PUT/PATCH/DELETE /payments`      |
| **Deposits**       | `GET/POST/PUT/PATCH/DELETE /deposits`      |
| **Documents**      | `GET/POST/PUT/PATCH/DELETE /documents`     |
| **Notifications**  | `GET/POST/PUT/PATCH/DELETE /notifications` |
| **Audit Logs**     | `GET/POST /audit_logs`                     |
| **Blocked IPs**    | `GET/DELETE /blocked_ips`                  |
| **Import Runs**    | `GET/POST/PUT/PATCH/DELETE /import_runs`   |
| **Settings**       | `GET/POST/PUT/PATCH/DELETE /settings`      |

### Logique Métier Backend (dans json-server-auth.mjs)

- **Authentification**: Login, logout, session, impersonation
- **Sécurité**: Blocage IP, surveillance d'anomalies, limitation de requêtes
- **Validation**: Détection de doublons (clients, users, admins, entreprises)
- **Audit**: Logging de toutes les actions
- **Notifications**: Notifications aux super admins
- **Filtrage**: Données par admin (clients, etc.)

---

# 🔜 FRONTEND (Partie actuelle)

## 1. Structure des Pages

### Pages Administrateur ([`src/pages/admin/`](src/pages/admin/))

| Dossier                                    | Description           | Fichiers clés                                                                                    |
| ------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------ |
| [`clients/`](src/pages/admin/clients/)     | Gestion des clients   | `AddClient.tsx`, `ClientDetail.tsx`, `ClientDossier.tsx`, `ClientsPage.tsx`, `DangerClients.tsx` |
| [`payments/`](src/pages/admin/payments/)   | Gestion des paiements | `Deposits.tsx`, `PaymentHistory.tsx`, `PaymentReceipts.tsx`, `PaymentsPage.tsx`                  |
| [`documents/`](src/pages/admin/documents/) | Gestion des documents | `DocumentsPage.tsx`, `SignedContractsPage.tsx`                                                   |
| [`archive/`](src/pages/admin/archive/)     | Archives clients      | `ArchiveTableSection.tsx`, `ArchiveFiltersSection.tsx`                                           |

### Pages Super Admin ([`src/pages/super-admin/`](src/pages/super-admin/))

| Dossier                                                  | Description                     |
| -------------------------------------------------------- | ------------------------------- |
| [`core/`](src/pages/super-admin/core/)                   | Dashboard principal Super Admin |
| [`admins/`](src/pages/super-admin/admins/)               | Gestion des admins              |
| [`stats/`](src/pages/super-admin/stats/)                 | Statistiques                    |
| [`monitoring/`](src/pages/super-admin/monitoring/)       | Surveillance performance        |
| [`notifications/`](src/pages/super-admin/notifications/) | Notifications                   |

### Pages Communes ([`src/pages/common/`](src/pages/common/))

| Fichier                                               | Description                  |
| ----------------------------------------------------- | ---------------------------- |
| [`Login.tsx`](src/pages/common/Login.tsx)             | Page de connexion principale |
| [`AdminSignup.tsx`](src/pages/common/AdminSignup.tsx) | Inscription nouvel admin     |
| [`NotFound.tsx`](src/pages/common/NotFound.tsx)       | Page 404                     |
| [`Index.tsx`](src/pages/common/Index.tsx)             | Page d'accueil               |

## 2. Composants ([`src/components/`](src/components/))

### Composants UI (shadcn-ui)

| Fichier                                                              | Description         |
| -------------------------------------------------------------------- | ------------------- |
| [`ui/button.tsx`](src/components/ui/button.tsx)                      | Bouton              |
| [`ui/dialog.tsx`](src/components/ui/dialog.tsx)                      | Modal               |
| [`ui/table.tsx`](src/components/ui/table.tsx)                        | Tableau             |
| [`ui/card.tsx`](src/components/ui/card.tsx)                          | Carte               |
| [`ui/input.tsx`](src/components/ui/input.tsx)                        | Champ de saisie     |
| [`ui/form.tsx`](src/components/ui/form.tsx)                          | Formulaire          |
| [`ui/toast.tsx`](src/components/ui/toast.tsx)                        | Notifications toast |
| [`ui/calendar.tsx`](src/components/ui/calendar.tsx)                  | Calendrier          |
| [`ui/chart.tsx`](src/components/ui/chart.tsx)                        | Graphiques          |
| Et beaucoup d'autres dans [`src/components/ui/`](src/components/ui/) |

### Composants Métier

| Fichier                                                       | Description              |
| ------------------------------------------------------------- | ------------------------ |
| [`AppSidebar.tsx`](src/components/AppSidebar.tsx)             | Menu latéral             |
| [`PaymentModal.tsx`](src/components/PaymentModal.tsx)         | Modal de paiement        |
| [`DepositModal.tsx`](src/components/DepositModal.tsx)         | Modal de dépôt           |
| [`ReceiptModal.tsx`](src/components/ReceiptModal.tsx)         | Modal de reçu            |
| [`ConfirmDialog.tsx`](src/components/ConfirmDialog.tsx)       | Dialogue de confirmation |
| [`SearchInput.tsx`](src/components/SearchInput.tsx)           | Champ de recherche       |
| [`LanguageSelector.tsx`](src/components/LanguageSelector.tsx) | Sélecteur de langue      |

## 3. Services API ([`src/services/`](src/services/))

### Couche HTTP

| Fichier                           | Description                                   |
| --------------------------------- | --------------------------------------------- |
| [`http.ts`](src/services/http.ts) | Client HTTP avec logging et gestion d'erreurs |
| [`api.ts`](src/services/api.ts)   | Exports centraux des API                      |

### API Services

| Fichier                                                             | Description                 |
| ------------------------------------------------------------------- | --------------------------- |
| [`api/clients.api.ts`](src/services/api/clients.api.ts)             | API Clients                 |
| [`api/payments.api.ts`](src/services/api/payments.api.ts)           | API Paiements               |
| [`api/deposits.api.ts`](src/services/api/deposits.api.ts)           | API Dépôts                  |
| [`api/documents.api.ts`](src/services/api/documents.api.ts)         | API Documents               |
| [`api/auth.api.ts`](src/services/api/auth.api.ts)                   | API Authentification        |
| [`api/admins.api.ts`](src/services/api/admins.api.ts)               | API Admins                  |
| [`api/users.api.ts`](src/services/api/users.api.ts)                 | API Users                   |
| [`api/entreprises.api.ts`](src/services/api/entreprises.api.ts)     | API Entreprises             |
| [`api/notifications.api.ts`](src/services/api/notifications.api.ts) | API Notifications           |
| [`api/auditLogs.api.ts`](src/services/api/auditLogs.api.ts)         | API Audit Logs              |
| [`api/blockedIps.api.ts`](src/services/api/blockedIps.api.ts)       | API IPs bloquées            |
| [`api/importRuns.api.ts`](src/services/api/importRuns.api.ts)       | API Imports                 |
| [`api/settings.api.ts`](src/services/api/settings.api.ts)           | API Paramètres              |
| [`api/workItems.api.ts`](src/services/api/workItems.api.ts)         | API Work Items              |
| [`api/endpoint.factory.ts`](src/services/api/endpoint.factory.ts)   | Factory pour endpoints CRUD |

### Services Métier

| Fichier                                                                           | Description       |
| --------------------------------------------------------------------------------- | ----------------- |
| [`services/payments.service.ts`](src/services/services/payments.service.ts)       | Logique paiements |
| [`services/deposits.service.ts`](src/services/services/deposits.service.ts)       | Logique dépôts    |
| [`uploader/cloudinary.uploader.ts`](src/services/uploader/cloudinary.uploader.ts) | Upload Cloudinary |

## 4. Données et Types ([`src/dto/`](src/dto/))

### DTO Backend (requêtes/réponses)

| Dossier                                                | Description                                               |
| ------------------------------------------------------ | --------------------------------------------------------- |
| [`dto/backend/requests/`](src/dto/backend/requests/)   | ClientCreateDTO, PaymentCreateDTO, DepositCreateDTO, etc. |
| [`dto/backend/responses/`](src/dto/backend/responses/) | ClientDTO, PaymentDTO, DepositDTO, etc.                   |

### DTO Frontend

| Dossier                                                  | Description                          |
| -------------------------------------------------------- | ------------------------------------ |
| [`dto/frontend/requests/`](src/dto/frontend/requests/)   | AdminCreateDTO, AuthRequestDTO, etc. |
| [`dto/frontend/responses/`](src/dto/frontend/responses/) | AdminDTO, AuthResponseDTO, etc.      |

## 5. State Management ([`src/stores/`](src/stores/))

| Fichier                                           | Description             |
| ------------------------------------------------- | ----------------------- |
| [`dataStore.ts`](src/stores/dataStore.ts)         | Store Zustand principal |
| [`DataProvider.tsx`](src/stores/DataProvider.tsx) | Provider React          |

## 6. Contextes ([`src/contexts/`](src/contexts/))

| Fichier                                             | Description               |
| --------------------------------------------------- | ------------------------- |
| [`AuthContext.tsx`](src/contexts/AuthContext.tsx)   | Contexte authentification |
| [`ToastContext.tsx`](src/contexts/ToastContext.tsx) | Contexte notifications    |

## 7. Utilitaires ([`src/lib/`](src/lib/))

| Fichier                                        | Description                     |
| ---------------------------------------------- | ------------------------------- |
| [`types.ts`](src/lib/types.ts)                 | Types TypeScript principaux     |
| [`pdfUtils.ts`](src/lib/pdfUtils.ts)           | Utilitaires génération PDF      |
| [`importClients.ts`](src/lib/importClients.ts) | Import clients depuis CSV/Excel |
| [`formatters.ts`](src/lib/formatters.ts)       | Formatage dates, devises        |
| [`i18n.tsx`](src/lib/i18n.tsx)                 | Internationalisation            |

## 8. Validation ([`src/validators/`](src/validators/))

| Fichier                                                                                   | Description             |
| ----------------------------------------------------------------------------------------- | ----------------------- |
| [`backend/common.ts`](src/validators/backend/common.ts)                                   | Validateurs Zod backend |
| [`frontend/auth/connexion.ts`](src/validators/frontend/auth/connexion.ts)                 | Validateur login        |
| [`frontend/client/ajout-client.ts`](src/validators/frontend/client/ajout-client.ts)       | Validateur ajout client |
| [`frontend/payment/ajout-paiement.ts`](src/validators/frontend/payment/ajout-paiement.ts) | Validateur paiement     |

## 9. Hooks Personnalisés ([`src/hooks/`](src/hooks/))

| Fichier                                      | Description      |
| -------------------------------------------- | ---------------- |
| [`use-mobile.tsx`](src/hooks/use-mobile.tsx) | Détection mobile |
| [`index.ts`](src/hooks/index.ts)             | Exports hooks    |

---

# 📊 Matrice des Responsabilités

## Backend Responsabilités

| Domaine      | Détails                                         |
| ------------ | ----------------------------------------------- |
| **Auth**     | Login, logout, session, impersonation, sécurité |
| **Données**  | CRUD complet, filtrage par admin, validation    |
| **Métier**   | Détection doublons, notifications, audit        |
| **Sécurité** | Blocage IP, limitation requêtes, monitoring     |

## Frontend Responsabilités

| Domaine   | Détails                               |
| --------- | ------------------------------------- |
| **UI**    | Composants, pages, mise en page       |
| **UX**    | Forms, validations client, navigation |
| **API**   | Appels serveur, gestion erreurs       |
| **State** | Cache local, gestion estado           |

---

# 🚀 Prochaine Étape: Séparation Backend/Frontend

Pour une architecture production-ready:

1. **Backend** → Node.js/Express ou Python/FastAPI
   - Migrer la logique de `json-server-auth.mjs`
   - Base de données: PostgreSQL/MySQL
   - Auth: JWT

2. **Frontend** → Conserver tel quel
   - Pointer vers le nouveau backend
   - Améliorer le state management (React Query)

---

# ☁️ Services Externes (Cloudinary)

| Service        | Emplacement              | Description                     |
| -------------- | ------------------------ | ------------------------------- |
| **Cloudinary** | Frontend + Service Cloud | Stockage fichiers (images, PDF) |

### Fichiers Cloudinary

| Fichier                                                                                                | Description                               |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| [`src/services/uploader/cloudinary.uploader.ts`](src/services/uploader/cloudinary.uploader.ts)         | Client upload Cloudinary (Frontend)       |
| [`src/services/uploader/uploader.factory.ts`](src/services/uploader/uploader.factory.ts)               | Factory pour uploader                     |
| [`src/services/uploader/file-uploader.interface.ts`](src/services/uploader/file-uploader.interface.ts) | Interface uploader                        |
| [`backend/server/index.js`](backend/server/index.js) | Serveur signatures Cloudinary |
| [`docs/CLOUDINARY.md`](docs/CLOUDINARY.md)                                                             | Documentation Cloudinary                  |
| [`.env`](.env)                                                                                         | Variables Cloudinary (VITE*CLOUDINARY*\*) |

Cloudinary est un service externe (SaaS). Le frontend upload directement vers Cloudinary via leur API. Le serveur [`backend/server/index.js`](backend/server/index.js) fournit les signatures pour les uploads sécurisés.

---

# 📁 Structure Complète du Projet

```
/
├── backend/                        # 🔙 BACKEND
│   ├── src/
│   │   └── index.mjs             # API principale
│   ├── db/
│   │   ├── db.json               # Base de données JSON
│   │   ├── *.sql                # Schémas SQL
│   │   └── log-backup.sh        # Script backup
│   └── server/
│       ├── index.js              # Cloudinary signatures
│       └── .env
│
├── src/                           # 🔜 FRONTEND
│   ├── components/               # Composants React
│   │   ├── ui/                  # Composants UI (shadcn)
│   │   └── *.tsx               # Composants métier
│   │
│   ├── pages/                   # Pages application
│   │   ├── admin/               # Pages admin
│   │   ├── super-admin/         # Pages super admin
│   │   └── common/             # Pages communes
│   │
│   ├── services/                # Services API
│   │   ├── http.ts             # Client HTTP
│   │   ├── api.ts              # Exports API
│   │   ├── api/                # Modules API
│   │   └── services/           # Services métier
│   │
│   ├── dto/                    # Data Transfer Objects
│   │   ├── backend/            # DTO backend
│   │   └── frontend/           # DTO frontend
│   │
│   ├── stores/                 # State management
│   ├── contexts/              # React Contexts
│   ├── lib/                   # Utilitaires
│   ├── hooks/                 # Hooks personnalisés
│   ├── validators/            # Validations Zod
│   └── messages/              # Internationalisation
│
├── docs/                      # Documentation
├── public/                    # Assets statiques
└── Configuration
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── tsconfig.json
```

---

_Document généré automatiquement - Archi Keur Ya Aicha_
