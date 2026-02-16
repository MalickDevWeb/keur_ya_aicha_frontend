# SOP-03 - Regularisation Abonnement Admin Impaye

Objectif:
- Debloquer un admin en retard d'abonnement en respectant la priorite de mois.

Role responsable:
- Support Ops + Admin concerne + Super Admin (si validation manuelle requise)

Temps cible:
- 10 minutes

Declencheur:
- Erreur d'acces type abonnement impaye (HTTP 402 metier).

Pre-requis:
1. Admin identifie.
2. Mois requis connu (`requiredMonth` / `overdueMonth`).

Procedure:
1. Verifier statut abonnement via l'ecran statut paiement admin.
2. Identifier le mois prioritaire a regler.
3. Informer l'admin du montant et de la methode autorisee.
4. Executer l'enregistrement de paiement pour le mois requis.
5. Verifier que le statut paiement devient `paid` (ou confirme via webhook).
6. Re-tester une action metier bloquee.
7. Confirmer deblocage a l'admin.

Controles qualite:
1. Paiement non duplique sur le mois.
2. Montant strictement positif.
3. Statut final coherent.

Escalade:
- Si paiement provider confirme mais non reflete en interne -> SOP-05.

Preuves a conserver:
1. ID paiement.
2. Mois regularise.
3. Operateur.
4. Date/heure.
