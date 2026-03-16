

## Use cases par acteur

### Diagramme global (acteurs + UC)

```mermaid
flowchart LR
  classDef actor fill:#0b1525,stroke:#7ad9ff,color:#e8f6ff,font-weight:bold;
  classDef ext fill:#0b1c2d,stroke:#79f2a1,color:#e8fff4,font-weight:bold;
  classDef uc fill:#0f1f38,stroke:#9bb8ff,color:#f3f6ff;
  classDef login fill:#13284a,stroke:#ffd166,color:#fff,font-weight:bold;

  %% Nœud central
  LOGIN{{Se connecter}}:::login

  %% Colonne Super Admin
  subgraph SA_COL["Super Admin"]
    direction TB
    SA((Super Admin)):::actor
    SA1([Gerer demandes admin]):::uc
    SA2([Activer seconde auth]):::uc
    SA3([Impersoner un admin]):::uc
    SA4([Bloquer/Debloquer IP]):::uc
    SA5([Activer/Desactiver maintenance]):::uc
    SA6([Valider paiement cash]):::uc
    SA7([Consulter audit & supervision]):::uc
    SA --> SA1 & SA2 & SA3 & SA4 & SA5 & SA6 & SA7
    SA1 -.-> LOGIN
    SA2 -.-> LOGIN
    SA3 -.-> LOGIN
    SA4 -.-> LOGIN
    SA5 -.-> LOGIN
    SA6 -.-> LOGIN
    SA7 -.-> LOGIN
  end

  %% Colonne Admin
  subgraph AD_COL["Admin"]
    direction TB
    AD((Admin)):::actor
    A1([Gerer clients]):::uc
    A2([Gerer locations & documents]):::uc
    A3([Payer abonnement]):::uc
    A4([Consulter statut abonnement]):::uc
    A5([Importer clients]):::uc
    A6([Executer rollback autorise]):::uc
    AD --> A1 & A2 & A3 & A4 & A5 & A6
    A1 -.-> LOGIN
    A2 -.-> LOGIN
    A3 -.-> LOGIN
    A4 -.-> LOGIN
    A5 -.-> LOGIN
    A6 -.-> LOGIN
  end

  %% Colonne Ops/Support
  subgraph OPS_COL["Ops / Support"]
    direction TB
    OPS((Ops/Support)):::actor
    O1([Consulter audit logs]):::uc
    O2([Analyser incidents]):::uc
    O3([Suivre imports en erreur]):::uc
    OPS --> O1 & O2 & O3
    O1 -.-> LOGIN
    O2 -.-> LOGIN
    O3 -.-> LOGIN
  end

  %% Colonne Paiement externe
  subgraph PAY_COL["Systeme paiement"]
    direction TB
    PSP[[Systeme paiement]]:::ext
    P1(["Webhook signe"]):::uc
    P2(["Verification signature"]):::uc
    P3(["Marquer admin_payment paid"]):::uc
    PSP --> P1 --> P2 --> P3
  end

  %% Colonne Services externes (autres)
  subgraph EXT_COL["Services externes"]
    direction TB
    CLD[[Cloudinary]]:::ext
    NOTIF[[Email/SMS Gateway]]:::ext
    MON[[Monitoring / Logs]]:::ext

    CLD1(["Stocker / servir fichiers"]):::uc
    NOT1(["Envoyer notifications"]):::uc
    MON1(["Collecter logs / metrics"]):::uc

    CLD --> CLD1
    NOTIF --> NOT1
    MON --> MON1
  end

  %% Ajuster la largeur : forcer l'ordre gauche -> droite
  SA_COL --- LOGIN
  AD_COL --- LOGIN
  OPS_COL --- LOGIN
  PAY_COL --- LOGIN
  EXT_COL --- LOGIN
```

### SUPER_ADMIN

```mermaid
flowchart LR
  SA([Super Admin])
  subgraph SYS["Systeme KYA"]
    S1([Gerer demandes admin])
    S2([Activer seconde authentification])
    S3([Impersoner un admin])
    S4([Bloquer IP])
    S5([Debloquer IP])
    S6([Valider paiement cash abonnement])
    S7([Activer/Desactiver maintenance])
    S8([Consulter audit et supervision])
    S_LOGIN([Se connecter])
  end

  SA --- S1
  SA --- S2
  SA --- S3
  SA --- S4
  SA --- S5
  SA --- S6
  SA --- S7
  SA --- S8

  S1 -. "include" .-> S_LOGIN
  S2 -. "include" .-> S_LOGIN
  S3 -. "include" .-> S_LOGIN
  S4 -. "include" .-> S_LOGIN
  S5 -. "include" .-> S_LOGIN
  S6 -. "include" .-> S_LOGIN
  S7 -. "include" .-> S_LOGIN
  S8 -. "include" .-> S_LOGIN
```

### ADMIN

```mermaid
flowchart LR
  AD([Admin])
  subgraph SYS["Systeme KYA"]
    UC1([Gerer clients])
    UC2([Gerer locations et documents])
    UC3([Payer abonnement])
    UC4([Consulter statut abonnement])
    UC5([Executer rollback autorise])
    UC6([Importer clients])
    UC_LOGIN([Se connecter])
  end

  AD --- UC1
  AD --- UC2
  AD --- UC3
  AD --- UC4
  AD --- UC5
  AD --- UC6

  UC1 -. "include" .-> UC_LOGIN
  UC2 -. "include" .-> UC_LOGIN
  UC3 -. "include" .-> UC_LOGIN
  UC4 -. "include" .-> UC_LOGIN
  UC5 -. "include" .-> UC_LOGIN
  UC6 -. "include" .-> UC_LOGIN
```

### OPS/SUPPORT

```mermaid
flowchart LR
  OPS([Ops/Support])
  subgraph SYS["Systeme KYA"]
    O1([Consulter audit logs])
    O2([Analyser incidents])
    O3([Suivre imports en erreur])
    O_LOGIN([Se connecter])
  end

  OPS --- O1
  OPS --- O2
  OPS --- O3

  O1 -. "include" .-> O_LOGIN
  O2 -. "include" .-> O_LOGIN
  O3 -. "include" .-> O_LOGIN
```

### SYSTEME PAIEMENT

```mermaid
flowchart LR
  PSP["SYSTEME PAIEMENT"] --> P1["Webhook signe"]
  P1 --> P2["Verification signature"]
  P2 --> P3["Passage admin_payment en paid"]
```

## Use cases par domaine (DDD / Hexagonal) - Diagrammes separes

### Domaine Identity / Auth

```mermaid
flowchart LR
  AD([Admin])
  SA([Super Admin])
  subgraph SYS["Systeme KYA - Domaine Identity / Auth"]
    ID1([Se connecter - 1ere connexion])
    ID2([Seconde authentification Super Admin - 2e connexion])
    ID3([Impersoner un admin])
  end

  AD --- ID1
  SA --- ID1
  SA --- ID2
  SA --- ID3

  ID2 -. "include" .-> ID1
  ID3 -. "include" .-> ID2
```

### Domaine Subscription / Abonnement

```mermaid
flowchart LR
  AD([Admin])
  SA([Super Admin])
  subgraph SYS["Systeme KYA - Domaine Subscription / Abonnement"]
    SUB1([Payer abonnement])
    SUB2([Consulter statut abonnement])
    SUB3([Valider paiement cash])
    SUB_LOGIN([Se connecter])
  end

  AD --- SUB1
  AD --- SUB2
  SA --- SUB3

  SUB1 -. "include" .-> SUB_LOGIN
  SUB2 -. "include" .-> SUB_LOGIN
  SUB3 -. "include" .-> SUB_LOGIN
```

### Domaine Billing / Paiement

```mermaid
flowchart LR
  PSP([Systeme Paiement])
  subgraph SYS["Systeme KYA - Domaine Billing / Paiement"]
    BILL1([Webhook signe])
    BILL2([Confirmer paiement admin])
  end

  PSP --- BILL1
  BILL1 --> BILL2
```

### Domaine Clients

```mermaid
flowchart LR
  AD([Admin])
  subgraph SYS["Systeme KYA - Domaine Clients"]
    CL1([Gerer clients])
    CL2([Importer clients])
    CL_LOGIN([Se connecter])
  end

  AD --- CL1
  AD --- CL2

  CL1 -. "include" .-> CL_LOGIN
  CL2 -. "include" .-> CL_LOGIN
```

### Domaine Locations & Documents

```mermaid
flowchart LR
  AD([Admin])
  subgraph SYS["Systeme KYA - Domaine Locations & Documents"]
    LO1([Gerer locations])
    DOC1([Gerer documents])
    LD_LOGIN([Se connecter])
  end

  AD --- LO1
  AD --- DOC1

  LO1 -. "include" .-> LD_LOGIN
  DOC1 -. "include" .-> LD_LOGIN
```

### Domaine Audit & Support

```mermaid
flowchart LR
  OPS([Ops/Support])
  SA([Super Admin])
  subgraph SYS["Systeme KYA - Domaine Audit & Support"]
    OP1([Consulter audit logs])
    OP2([Analyser incidents])
    OP3([Suivre imports en erreur])
    OP_LOGIN([Se connecter])
  end

  OPS --- OP1
  OPS --- OP2
  OPS --- OP3
  SA --- OP1

  OP1 -. "include" .-> OP_LOGIN
  OP2 -. "include" .-> OP_LOGIN
  OP3 -. "include" .-> OP_LOGIN
```

### Domaine Plateforme

```mermaid
flowchart LR
  SA([Super Admin])
  AD([Admin])
  subgraph SYS["Systeme KYA - Domaine Plateforme"]
    PF1([Bloquer/Debloquer IP])
    PF2([Activer/Desactiver maintenance])
    PF3([Executer rollback autorise])
    PF_LOGIN([Se connecter])
  end

  SA --- PF1
  SA --- PF2
  AD --- PF3

  PF1 -. "include" .-> PF_LOGIN
  PF2 -. "include" .-> PF_LOGIN
  PF3 -. "include" .-> PF_LOGIN
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

# Architecture frontend

# Aspect Architectural - Frontend React/Electron

```mermaid
flowchart LR
  %% Enveloppes d'execution
  subgraph Shell["Shell d'execution"]
    BROWSER["Navigateur Web"]
    ELECTRON["Electron Main"]
    PRELOAD["Preload IPC"]
  end

  subgraph RENDERER["Renderer React + Vite"]
    APP_ENTRY["main.tsx / App.tsx"]
    PROVIDERS["Providers\n(ErrorBoundary, QueryClient, Auth, Data, I18n, Toast)"]
    ROUTER["Router\nBrowserRouter | HashRouter"]
    LAYOUTS["MainLayout + Pages (Admin / SuperAdmin / Auth)"]
    UI["UI shadcn/radix + tailwind"]
    STATE["Etat client\nZustand stores + local/session storage"]
    SERVERSTATE["Etat serveur\nTanStack React Query"]
    OFFLINE["Offline & Sync\nIndexedDB cache + syncQueue"]
    SERVICES["Services HTTP + validations Zod\n(runtimeConfig, platformConfig, audit)"]
  end

  ELECTRON --> PRELOAD
  BROWSER --> APP_ENTRY
  PRELOAD --> APP_ENTRY

  APP_ENTRY --> PROVIDERS --> ROUTER --> LAYOUTS --> UI
  UI --> STATE
  UI --> SERVERSTATE
  SERVICES --> SERVERSTATE
  SERVICES --> STATE
  SERVICES <--> OFFLINE
  OFFLINE --> SERVERSTATE

  SERVICES --> API["KYA API REST"]
  SERVICES --> CLD["Cloudinary Uploads"]
  API --> PSP["Provider Paiement"]
  API --> LOGS["Endpoints Audit/Monitoring"]

  classDef shell fill:#0b1525,stroke:#7ad9ff,color:#e8f6ff,font-weight:bold;
  classDef app fill:#0f1f38,stroke:#9bb8ff,color:#f3f6ff;
  classDef ext fill:#0b1c2d,stroke:#79f2a1,color:#e8fff4,font-weight:bold;

  class BROWSER,ELECTRON,PRELOAD shell
  class APP_ENTRY,PROVIDERS,ROUTER,LAYOUTS,UI,STATE,SERVERSTATE,OFFLINE,SERVICES app
  class API,CLD,PSP,LOGS ext
```

# Architecture backend

# Aspect Architectural - Backend Next.js / DDD

```mermaid
flowchart LR
  subgraph EDGE["Interface & API (Next.js)"]
    ROUTES["Route handlers /src/controleurs"]
    MIDDLEWARES["Middlewares\nAuth/2FA, RBAC Ownership, Maintenance, Rate limit/IP"]
    DOCS["Swagger / OpenAPI"]
  end

  subgraph APP["Application"]
    DTO["DTOs + validateurs Zod"]
    SVC_APP["Services applicatifs\n(clients, paiements, imports, audit, admin)"]
    MAPPERS["Mappers / Fabriques / Transactions"]
  end

  subgraph DOMAIN["Domaine (DDD)"]
    ENT["Entites & agregats"]
    VO["Objets valeur"]
    RULES["Regles metier + Exceptions"]
  end

  subgraph INFRA["Infrastructure"]
    REPO["Repositories Prisma"]
    SEC["Securite\nArgon2, JWT/Refresh"]
    PAY_ADAPT["Adapter paiement"]
    CLD_ADAPT["Adapter Cloudinary"]
    ALERT["Alertes & audit webhooks"]
    OBS_STORE["Logs/Audit persistes"]
  end

  subgraph EXT["Services externes"]
    PSP["Provider Paiement"]
    CLD["Cloudinary"]
    OBS_EXT["Monitoring/Notifications"]
  end

  DB[(PostgreSQL)]

  ROUTES --> MIDDLEWARES --> SEC --> DTO --> SVC_APP --> ENT --> REPO --> DB
  SVC_APP --> MAPPERS
  SVC_APP --> VO
  ENT --> RULES
  SVC_APP --> PAY_ADAPT
  SVC_APP --> CLD_ADAPT
  REPO --> OBS_STORE
  ALERT --> OBS_STORE

  PAY_ADAPT --> PSP
  CLD_ADAPT --> CLD
  ALERT --> OBS_EXT

  classDef edge fill:#0b1525,stroke:#7ad9ff,color:#e8f6ff,font-weight:bold;
  classDef app fill:#0f1f38,stroke:#9bb8ff,color:#f3f6ff;
  classDef domain fill:#0b1c2d,stroke:#79f2a1,color:#e8fff4,font-weight:bold;
  classDef infra fill:#13284a,stroke:#ffd166,color:#fff,font-weight:bold;
  classDef db fill:#0d2238,stroke:#b6b6b6,color:#f3f3f3;
  classDef ext fill:#0b1c2d,stroke:#79f2a1,color:#e8fff4,font-weight:bold;

  class ROUTES,MIDDLEWARES,DOCS edge
  class DTO,SVC_APP,MAPPERS app
  class ENT,VO,RULES domain
  class REPO,SEC,PAY_ADAPT,CLD_ADAPT,ALERT,OBS_STORE infra
  class DB db
  class PSP,CLD,OBS_EXT ext
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

# Modelisation du cahier des charges

## Diagramme de contexte (systeme et acteurs)

```mermaid
flowchart LR
  AD([Admin])
  SA([Super Admin])
  OPS([Ops/Support])
  PSP([Systeme Paiement])
  CLD([Service Cloud])
  NOTIF([Service Notification])

  subgraph SYS["Systeme KYA"]
    CORE["Backend API + Frontend"]
  end

  AD --- CORE
  SA --- CORE
  OPS --- CORE
  PSP --- CORE
  CLD --- CORE
  NOTIF --- CORE
```

## Diagramme de classes (modele de domaine)

```mermaid
classDiagram
  class Utilisateur
  class Admin
  class Entreprise
  class Client
  class Location
  class Document
  class PaiementMensuel
  class TransactionPaiement
  class PaiementCaution
  class PaiementAbonnementAdmin
  class StatutAbonnementAdmin
  class ExecutionImport
  class ErreurImport
  class MessageErreurImport
  class Notification
  class JournalAudit
  class JournalAuditAdmin
  class IpBloquee
  class ParametreAdmin

  Utilisateur "1" --> "0..1" Admin : profilAdmin
  Admin "0..1" --> "0..1" Entreprise : entreprise
  Admin "1" --> "0..*" Client : gere
  Client "1" --> "0..*" Location : possede
  Location "1" --> "0..*" Document : documents
  Location "1" --> "0..*" PaiementMensuel : paiementsMensuels
  PaiementMensuel "1" --> "0..*" TransactionPaiement : transactions
  Location "1" --> "0..*" PaiementCaution : depots
  Admin "1" --> "0..*" PaiementAbonnementAdmin : abonnements
  Admin "1" --> "0..1" StatutAbonnementAdmin : statut
  Admin "0..1" --> "0..*" ExecutionImport : imports
  ExecutionImport "1" --> "0..*" ErreurImport : erreurs
  ErreurImport "1" --> "0..*" MessageErreurImport : messages
  Utilisateur "1" --> "0..*" Notification : notifications
  Utilisateur "0..1" --> "0..*" JournalAudit : auditsSecurite
```

## Diagrammes de classes par domaine (base sur use cases)

### Domaine Identity / Auth

```mermaid
classDiagram
  class Utilisateur
  class Admin
  class SessionAuthentification
  class JetonRefresh
  class TentativeConnexion
  class PermissionUtilisateur

  Utilisateur "1" --> "0..1" Admin : profilAdmin
  Utilisateur "1" --> "0..*" SessionAuthentification : sessions
  SessionAuthentification "1" --> "0..*" JetonRefresh : refreshTokens
  Utilisateur "1" --> "0..*" TentativeConnexion : tentatives
  Utilisateur "1" --> "0..*" PermissionUtilisateur : permissions
```

### Domaine Subscription / Abonnement

```mermaid
classDiagram
  class Admin
  class PaiementAbonnementAdmin
  class StatutAbonnementAdmin

  Admin "1" --> "0..*" PaiementAbonnementAdmin : paiements
  Admin "1" --> "0..1" StatutAbonnementAdmin : statut
```

### Domaine Billing / Paiement

```mermaid
classDiagram
  class Location
  class PaiementMensuel
  class TransactionPaiement
  class PaiementCaution

  Location "1" --> "0..*" PaiementMensuel : loyers
  PaiementMensuel "1" --> "0..*" TransactionPaiement : transactions
  Location "1" --> "0..*" PaiementCaution : depots
```

### Domaine Clients

```mermaid
classDiagram
  class Admin
  class Client
  class Entreprise

  Admin "1" --> "0..*" Client : gere
  Admin "0..1" --> "0..1" Entreprise : entreprise
```

### Domaine Locations & Documents

```mermaid
classDiagram
  class Client
  class Location
  class Document

  Client "1" --> "0..*" Location : locations
  Location "1" --> "0..*" Document : documents
```

### Domaine Audit & Support

```mermaid
classDiagram
  class JournalAudit
  class JournalAuditAdmin
  class ExecutionImport
  class ErreurImport
  class MessageErreurImport
  class Notification
  class ItemTravail

  ExecutionImport "1" --> "0..*" ErreurImport : erreurs
  ErreurImport "1" --> "0..*" MessageErreurImport : messages
```

### Domaine Plateforme

```mermaid
classDiagram
  class ConfigurationSysteme
  class ParametreAdmin
  class IpBloquee
  class IdempotenceMutation
```
