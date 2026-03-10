# Architecture globale (vue haute)

- Portee : interactions principales entre front, gateway, couche metier, adapteurs et dependances externes.
- Hypotheses : single API publique derriere un reverse-proxy, stockage principal PostgreSQL + object storage, observabilite centralisee.

```mermaid
flowchart LR
  FE["Frontend React/Electron"] --> GATE["Reverse Proxy / API Gateway"]
  GATE --> CTRL["BFF / Controllers"]
  CTRL --> SVC["Services metier"]
  SVC --> ADAPT["Adapters"]

  ADAPT --> DB[(PostgreSQL)]
  ADAPT --> OBJ[(Object Storage)]
  ADAPT --> PSP["Provider Paiement"]
  ADAPT --> CLD["Cloudinary"]

  SVC --> OBS["Observabilite (logs/metrics/audit)"]
  CI["CI/CD"] --> GATE
```
