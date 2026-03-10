# Activite — Soumettre et valider une demande admin

```mermaid
flowchart LR
  A[Visiteur] --> B[Soumettre formulaire admin_request]
  B --> C[Enregistrer demande (pending)]
  C --> D[Notifier Super Admin]
  D --> E{Revue super admin}
  E -->|Rejet| F[Statut rejected + motif]
  E -->|Validation| G[Creer compte admin actif]
  G --> H[Notifier nouveau admin]
  F --> I[Audit]
  H --> I
  I --> J[Fin]
```
