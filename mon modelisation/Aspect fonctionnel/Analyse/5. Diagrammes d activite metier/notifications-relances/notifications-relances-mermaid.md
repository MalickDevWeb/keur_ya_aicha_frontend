# Activite — Notifications & relances

```mermaid
flowchart LR
  A[Scheduler] --> B[Scanner abonnements & imports]
  B --> C{Paiement en retard ?}
  C -->|Oui| D[Notifier admin (email/sms)]
  C -->|Non| E{Imports en erreur ?}
  D --> F[Incrementer compteur relance]
  E -->|Oui| G[Notifier admin + lien import]
  E -->|Non| H{Maintenance planifiee ?}
  H -->|Oui| I[Notifier fenetre maintenance]
  H -->|Non| J[Pas de notification]
  F --> K[Log audit]
  G --> K
  I --> K
  J --> K
  K --> L[Fin]
```
