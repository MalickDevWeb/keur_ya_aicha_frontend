# Architecture physique — Deploiement

- Couches : utilisateurs -> reverse proxy/API GW (DMZ) -> cluster app -> data.
- Ressources : conteneurs Node (API/BFF + workers), PostgreSQL managé, object storage, observabilite externalisée.

```mermaid
graph LR
  subgraph UserEnv[Postes utilisateur]
    U1[Admin Desktop/Electron]
    U2[Admin Web]
  end

  subgraph DMZ[Zone publique]
    LB[Reverse Proxy / API Gateway]
  end

  subgraph APP[Cluster App]
    API[API/BFF Node.js]
    SVC[Services metier]
    WORK[Workers async]
  end

  subgraph DATA[Zone donnee]
    DB[(PostgreSQL)]
    FS[(Object Storage\nDocs/Exports)]
  end

  subgraph EXT[Services externes]
    PAY[Provider Paiement]
    CLD[Cloudinary]
    OBS[Monitoring/Logs/Audit]
  end

  U1 --> LB
  U2 --> LB
  LB --> API
  API --> SVC
  SVC --> DB
  SVC --> FS
  API --> WORK
  WORK --> DB
  WORK --> FS
  API --> PAY
  API --> CLD
  API --> OBS
```
