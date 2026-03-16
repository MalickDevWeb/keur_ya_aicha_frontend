# Cas d'utilisation (Conception) — Par domaine

- Identity / Auth : `diagramme-cas-utilisation-conception-identity-auth.md`
- Subscription / Abonnement : `diagramme-cas-utilisation-conception-subscription-abonnement.md`
- Billing / Paiement : `diagramme-cas-utilisation-conception-billing-paiement.md`
- Clients : `diagramme-cas-utilisation-conception-clients.md`
- Locations & Documents : `diagramme-cas-utilisation-conception-locations-documents.md`
- Audit & Support : `diagramme-cas-utilisation-conception-audit-support.md`
- Plateforme : `diagramme-cas-utilisation-conception-plateforme.md`

Une vue combinée reste disponible ici pour référence rapide :

```mermaid
flowchart LR
  subgraph Identity/Auth
    ID1([Se connecter - 1ere connexion])
    ID2([Seconde auth Super Admin])
    ID3([Impersoner un admin])
  end
  subgraph Subscription/Abonnement
    SUB1([Payer abonnement])
    SUB2([Consulter statut abonnement])
    SUB3([Valider paiement cash])
  end
  subgraph Billing/Paiement
    BILL1([Webhook signe])
    BILL2([Confirmer paiement admin])
  end
  subgraph Clients
    CL1([Gerer clients])
    CL2([Importer clients])
  end
  subgraph Locations/Documents
    LO1([Gerer locations])
    DOC1([Gerer documents])
  end
  subgraph Audit/Support
    OP1([Consulter audit logs])
    OP2([Analyser incidents])
    OP3([Suivre imports en erreur])
  end
  subgraph Plateforme
    PF1([Bloquer/Debloquer IP])
    PF2([Activer/Desactiver maintenance])
    PF3([Executer rollback autorise])
  end
```
