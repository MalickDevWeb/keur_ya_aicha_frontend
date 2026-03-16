# Gouvernance et securite

- Gouvernance : IAM + RBAC + ownership + maintenance window.
- Protection : rate-limit/IP block au niveau gateway/controllers.
- Conformite : audits centralises, retention, sauvegardes.

```mermaid
flowchart LR
  IAM["IAM/AuthN"] --> RBAC["RBAC Policy Engine"]
  RBAC --> ENF["Enforcement Hooks (Routes/Services)"]
  ENF --> AUD["Audit Logger"]
  ENF --> MON["Monitoring/Alerts"]

  IAM --> MFA["Second Auth Super Admin"]
  IAM --> SESS["Session/Token Mgmt"]

  NETSEC["IP Blocking / Rate Limit"] --> ENF
  MAINT["Maintenance Windows"] --> ENF

  SECRETS["Secrets/Config Vault"] --> API["API/Services"]
  BACKUP["Backups & RPO"] --> DB[(PostgreSQL)]

  COMPL["Compliance (GDPR, Logs retention)"] --> AUD

  API --> AUD
  API --> MON
```
