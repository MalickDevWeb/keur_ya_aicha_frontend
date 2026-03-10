# Activite technique — Paiement abonnement admin

```mermaid
flowchart LR
  A[Controller Payment] --> B[Validate dto + role]
  B --> C{Method mobile ?}
  C -->|Oui| D[Check duplicate (Repo)]
  C -->|Non| G[Check duplicate]
  D --> E[Adapter PSP initiate]
  E --> F{PSP response}
  F -->|pending/paid| H[Persist payment + status]
  H --> I[Return 201]
  G --> J[Persist payment status=paid (cash)]
  J --> I
  PSP[Webhook PSP] --> K[Controller webhook]
  K --> L[Verify signature]
  L --> M[Find payment by ref]
  M --> N[Update status paid + admin flag]
  N --> O[Audit log]
```
