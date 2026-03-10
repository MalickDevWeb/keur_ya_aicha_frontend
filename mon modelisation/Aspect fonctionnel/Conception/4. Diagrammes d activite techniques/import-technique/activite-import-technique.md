# Activite technique — Pipeline import clients

```mermaid
flowchart LR
  A[Upload CSV -> /import_runs] --> B[Controller Import]
  B --> C[Store file (StorageAdapter)]
  C --> D[Create import_run record]
  D --> E[Loop rows]
  E --> F{Parse & validate}
  F -->|Erreur| G[Add import_error]
  F -->|OK| H[Upsert client + rental]
  G --> I[Inc error_count]
  H --> I
  I --> J[Update status/counters]
  J --> K{errors>0 ?}
  K -->|Oui| L[status=completed_with_errors]
  K -->|Non| M[status=completed]
  L --> N[Notify admin]
  M --> N
```
