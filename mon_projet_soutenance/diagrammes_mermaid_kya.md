# Use case global

# Aspect Fonctionnel - Analyse - Diagramme de Cas d Utilisation

## Diagramme global

```mermaid
flowchart LR
  SA["SUPER_ADMIN"] --> UC1["Gerer demandes admin"]
  SA --> UC2["Activer seconde authentification"]
  SA --> UC3["Impersoner un admin"]
  SA --> UC4["Bloquer/Debloquer IP"]
  SA --> UC5["Activer/Desactiver maintenance"]
  SA --> UC6["Valider paiement cash abonnement"]
  SA --> UC7["Consulter audit et supervision"]

  AD["ADMIN"] --> UC8["Se connecter"]
  AD --> UC9["Gerer clients"]
  AD --> UC10["Gerer locations et documents"]
  AD --> UC11["Payer abonnement"]
  AD --> UC12["Consulter statut abonnement"]
  AD --> UC13["Importer clients"]
  AD --> UC14["Executer rollback autorise"]

  OPS["OPS/SUPPORT"] --> UC15["Analyser incidents"]
  OPS --> UC16["Suivre imports en erreur"]
  OPS --> UC17["Consulter audit logs"]

  PSP["SYSTEME PAIEMENT"] --> UC18["Envoyer webhook signe"]
  UC18 --> UC19["Confirmer paiement admin"]
```

## Use cases par acteur

### SUPER_ADMIN

```mermaid
flowchart LR
  SA["SUPER_ADMIN"] --> S1["Se connecter"]
  SA --> S2["Second auth"]
  SA --> S3["Impersonation"]
  SA --> S4["Valider/Rejeter admin_request"]
  SA --> S5["Bloquer IP"]
  SA --> S6["Debloquer IP"]
  SA --> S7["Valider paiement cash"]
  SA --> S8["Maintenance policy"]
```

### ADMIN

```mermaid
flowchart LR
  AD["ADMIN"] --> A1["Login"]
  AD --> A2["CRUD clients"]
  AD --> A3["CRUD rentals"]
  AD --> A4["Gerer documents"]
  AD --> A5["Payer abonnement mobile money"]
  AD --> A6["Importer clients"]
  AD --> A7["Undo personnels"]
```

### OPS/SUPPORT

```mermaid
flowchart LR
  OPS["OPS/SUPPORT"] --> O1["Audit consultation"]
  OPS --> O2["Triage incidents login"]
  OPS --> O3["Suivi import_runs/import_errors"]
```

### SYSTEME PAIEMENT

```mermaid
flowchart LR
  PSP["SYSTEME PAIEMENT"] --> P1["Webhook signe"]
  P1 --> P2["Verification signature"]
  P2 --> P3["Passage admin_payment en paid"]
```

# Activite abonnement

# Aspect Fonctionnel - Analyse - Diagramme d Activite

## Activite transversale: abonnement admin

```mermaid
flowchart LR
  A["Debut"] --> B["Admin authentifie"]
  B --> C["Saisir paiement abonnement"]
  C --> D{"Methode valide ?"}
  D -->|Non| X1["Erreur validation"]
  D -->|Oui| E{"Mois requis respecte ?"}
  E -->|Non| X2["Blocage mois prioritaire"]
  E -->|Oui| F{"Doublon actif (admin,mois) ?"}
  F -->|Oui| X3["Rejet doublon"]
  F -->|Non| G{"cash ?"}
  G -->|Oui| H["Validation Super Admin"]
  G -->|Non| I["Initiation provider"]
  I --> J{"Webhook paid ?"}
  J -->|Oui| K["Statut paid + audit"]
  J -->|Non| L["Statut pending"]
  H --> K
  K --> M["Fin succes"]
  L --> M
```

# Architecture globale

# Aspect Architectural - Diagramme d Architecture Globale

```mermaid
flowchart LR
  FE["Frontend React/Electron"] --> API["KYA API"]
  API --> SVC["Services Metier"]
  SVC --> REPO["Repositories"]
  REPO --> DB[(PostgreSQL)]

  API --> SEC["Middlewares\nAuth/RBAC/Ownership/Maintenance"]
  API --> EXT1["Provider Paiement"]
  API --> EXT2["Cloudinary"]

  API --> OBS["Logs/Audit/Metrics"]
  CI["Jenkins CI/CD"] --> API
```

# Composants backend

# Aspect Architectural - Diagramme de Composants

```mermaid
flowchart LR
  subgraph API["API Layer"]
    R["Routes"] --> C["Controllers"]
    C --> V["Validation"]
    C --> D["DTO Mapper"]
    C --> S["Services"]
    S --> I["Repository Interfaces"]
    I --> P["PostgreSQL Repositories"]
    C --> M["Message Catalog"]
  end

  subgraph SEC["Security"]
    MW1["Auth Middleware"]
    MW2["Ownership Middleware"]
    MW3["Maintenance Middleware"]
    MW4["RateLimit/IP Block Middleware"]
  end

  C --> MW1
  C --> MW2
  C --> MW3
  C --> MW4
  P --> DB[(PostgreSQL)]
  S --> PSP["Payment Adapter"]
  S --> CLD["Cloudinary Adapter"]
```

# Diagrammes de sequence

# Diagrammes de Sequence

## Login + second auth

```mermaid
sequenceDiagram
  participant User as User
  participant API as /authContext/login
  participant Sec as Security Logic
  participant Data as Store/DB

  User->>API: POST login(username,password)
  API->>Sec: verifyCredentials()
  Sec->>Data: findUserByLogin()
  alt invalid credentials
    Sec->>Data: appendAuditLog(FAILED_LOGIN)
    Sec->>Data: maybeBlockIp()
    API-->>User: 401 {error}
  else valid admin but pending/inactive
    API-->>User: 403 pending approval
  else valid
    Sec->>Data: setAuthContext(userId)
    API-->>User: 200 authContext + subscription flags
  end

  User->>API: POST /authContext/super-admin/second-auth
  API->>Sec: verifySuperAdminPassword()
  alt wrong password
    Sec->>Data: appendAuditLog(SUPER_ADMIN_SECOND_AUTH_FAILED)
    API-->>User: 401
  else success
    Sec->>Data: set superAdminSecondAuthAt(now)
    Sec->>Data: appendAuditLog(SUPER_ADMIN_SECOND_AUTH_SUCCESS)
    API-->>User: 200 {ok:true}
  end
```

## Creation paiement admin + webhook

```mermaid
sequenceDiagram
  participant Admin as Admin
  participant API as /admin_payments
  participant Svc as Payment Service
  participant PSP as Provider
  participant DB as Store/DB

  Admin->>API: POST payment(amount,method,month)
  API->>Svc: validate role/method/amount/month
  Svc->>Svc: compute requiredMonth
  Svc->>DB: check duplicate active(admin,month)
  alt duplicate or wrong month order
    API-->>Admin: 409
  else mobile method
    Svc->>PSP: initiate payment
    PSP-->>Svc: pending/paid + reference
    Svc->>DB: insert admin_payment
    API-->>Admin: 201 {status pending|paid}
  else cash by super admin
    Svc->>DB: insert admin_payment(status=paid)
    API-->>Admin: 201
  end

  PSP->>API: POST /admin_payments/webhook/:provider
  API->>Svc: verify signature
  alt invalid signature
    API-->>PSP: 401
  else paid event
    Svc->>DB: locate payment
    Svc->>DB: mark paid + update admin paid flag
    API-->>PSP: 200 {ok:true}
  end
```

## Import clients + erreurs

```mermaid
sequenceDiagram
  participant Admin as Admin
  participant API as /import_runs
  participant Svc as Import Service
  participant DB as Store/DB

  Admin->>API: POST import run(file metadata + parsed data)
  API->>Svc: resolve owner adminId
  Svc->>DB: create import_run
  loop each row
    Svc->>Svc: validate row
    alt invalid or duplicate
      Svc->>DB: append import_error
    else valid
      Svc->>DB: create/update client
    end
  end
  Svc->>DB: update run counters/status
  API-->>Admin: 201 import summary
```

## Undo rollback

```mermaid
sequenceDiagram
  participant U as User
  participant API as /undo-actions/:id/rollback
  participant Undo as Undo Service
  participant DB as Store/DB

  U->>API: POST rollback(id)
  API->>Undo: verify auth + ownership
  Undo->>DB: load undo entry
  alt not found/forbidden/expired
    API-->>U: 404|403|410
  else valid
    Undo->>Undo: resolve rollback plan
    Undo->>DB: apply rollback + side effects
    Undo->>DB: remove undo entry
    Undo->>DB: append audit log
    API-->>U: 200 {ok:true}
  end
```
