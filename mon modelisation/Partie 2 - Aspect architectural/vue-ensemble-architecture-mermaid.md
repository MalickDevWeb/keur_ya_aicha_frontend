# Vue d'ensemble architecture (composants)

- Stratification : Gateway -> BFF/Controllers -> Services -> Adapters -> Data/Externes.
- Dependances externes : paiement, stockage fichiers, cloudinary, observabilite.

```mermaid
flowchart LR
  FE["Frontend (React/Electron)"] --> GATE["Reverse Proxy / API Gateway"]
  GATE --> CTRL["BFF / Controllers"]
  CTRL --> SVC["Services metier"]
  SVC --> ADAPT["Adapters"]
  ADAPT --> DB[(PostgreSQL)]
  ADAPT --> STORAGE[(Object Storage)]
  ADAPT --> PSP["Provider Paiement"]
  ADAPT --> CLD["Cloudinary"]
  SVC --> OBS["Observabilite"]
```
