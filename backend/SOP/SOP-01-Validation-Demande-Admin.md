# SOP-01 - Validation Demande Admin

Objectif:
- Valider ou refuser une demande de creation d'admin avec tracabilite.

Role responsable:
- Super Admin

Temps cible:
- 10 a 15 minutes par demande

Declencheur:
- Notification type `ADMIN_REQUEST`

Pre-requis:
1. Acces Super Admin actif.
2. Dossier demande visible (`admin_requests`).

Procedure:
1. Ouvrir la demande et verifier identite, telephone, email, entreprise.
2. Verifier coherence globale (doublon probable, donnees incompletes, risque).
3. Si doute: contacter le demandeur et consigner le retour.
4. Decider:
- Valider -> statut `ACTIF`.
- Refuser/suspendre -> statut approprie selon politique interne.
5. Enregistrer la decision dans le systeme.
6. Verifier que l'action est bien tracee (audit + statut final).

Controles qualite:
1. Aucun champ critique vide (nom, telephone).
2. Decision justifiee par une note interne.
3. Statut final coherent avec la decision.

Escalade:
- Escalader au responsable securite si suspicion fraude.

Preuves a conserver:
1. ID de demande.
2. Decision finale.
3. Nom du validateur.
4. Date/heure.
