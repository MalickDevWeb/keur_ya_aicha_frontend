# SOP-05 - Incident Paiement Provider (desynchronisation)

Objectif:
- Resoudre un cas "paye chez provider mais non reflete".

Role responsable:
- Ops Support + Super Admin + Equipe technique si necessaire

Temps cible:
- 20 a 40 minutes

Declencheur:
- Reclamation admin sur paiement mobile non pris en compte.

Pre-requis:
1. Reference transaction provider.
2. Admin concerne.
3. Mois concerne.

Procedure:
1. Collecter: adminId, mois, montant, reference provider, horodatage.
2. Rechercher un paiement interne correspondant (`admin_payments`).
3. Verifier statut interne (`pending` vs `paid`).
4. Verifier logs/audit associes (creation + webhook eventuel).
5. Si webhook non passe: lancer investigation technique (signature, payload, provider).
6. Si preuve paiement validee: appliquer correction controlee selon politique.
7. Re-verifier statut admin et deblocage.
8. Clore incident avec compte-rendu.

Controles qualite:
1. Aucune double comptabilisation.
2. Correction justifiee et tracee.
3. Communication claire a l'admin.

Escalade:
- Equipe technique immediate si plusieurs paiements impactes.

Preuves a conserver:
1. Reference provider.
2. ID paiement interne.
3. Action corrective.
4. Responsable et horodatage.
