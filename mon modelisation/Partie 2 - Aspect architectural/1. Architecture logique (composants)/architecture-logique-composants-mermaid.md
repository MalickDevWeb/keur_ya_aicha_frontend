# Architecture logique — Composants backend

- Couche API : routes -> controllers -> validation -> messages d'erreur.
- Services metier : logique, orchestration et politiques (auth, RBAC, ownership, maintenance).
- Adapters : payment, storage, cloudinary, envoi events/notifications.
- Persistance : interfaces de repository -> impl PostgreSQL.
- Observabilite : audit, logs, metrics accessibles depuis services et adapters.

```mermaid
flowchart LR
  subgraph API["API Layer"]
    R["Routes"] --> C["Controllers"]
    C --> V["Validation"]
    C --> MSG["Message Catalog"]
    C --> S["Services"]
  end

  subgraph Policies["Security / Policies"]
    MW1["Auth & RBAC"]
    MW2["Ownership"]
    MW3["Maintenance"]
    MW4["RateLimit/IP Block"]
  end

  S --> Policies

  subgraph Adapters
    PAY["Payment Adapter"]
    CLD["Cloudinary Adapter"]
    STOR["Object Storage Adapter"]
  end

  subgraph Persistence
    IFace["Repository Interfaces"] --> PGRepo["PostgreSQL Repos"]
  end

  PGRepo --> DB[(PostgreSQL)]
  S --> IFace
  S --> Adapters
  Adapters --> PAY
  Adapters --> CLD
  Adapters --> STOR
  S --> OBS["Observabilite (logs/metrics/audit)"]
```
