# Pack de soutenance KYA

Fichiers generes:

- HTML principal: `dossier_soutenance_kya_papa_malick_teuw_complete.html`
- Sources Mermaid: `diagrammes_mermaid_kya.md`
- Assets: `soutenance_pack_assets/`
- Diagrammes SVG:
  - `use_case_global.svg`
  - `use_case_import.svg`
  - `activite_approbation_admin.svg`
  - `activite_import_clients.svg`
  - `activite_paiement_abonnement.svg`
  - `sequence_approbation_admin.svg`
  - `sequence_login_auth.svg`
  - `sequence_import_clients.svg`
  - `sequence_paiement_abonnement.svg`
  - `architecture_globale.svg`
  - `architecture_frontend.svg`
  - `architecture_backend.svg`
  - `architecture_deploiement.svg`
  - `modele_donnees.svg`
  - `diagramme_classes_technique.svg`

Liens integres dans le dossier:

- Frontend: https://keur-ya-aicha-frontend.vercel.app
- Backend API: https://bakend-next-saas-gestion-client.onrender.com/api
- Docs backend: https://bakend-next-saas-gestion-client.onrender.com/docs

Generation:

```bash
node scripts/generate-soutenance-pack.mjs
```
