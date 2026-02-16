# SOP-04 - Validation Paiement Especes (Super Admin)

Objectif:
- Valider un paiement abonnement en especes de maniere controlee.

Role responsable:
- Super Admin

Temps cible:
- 5 a 10 minutes

Declencheur:
- Paiement physique recu et demande de validation.

Pre-requis:
1. Admin cible identifie.
2. Mois a payer confirme.
3. Montant verifie.

Procedure:
1. Verifier identite admin et mois concerne.
2. Verifier qu'il n'existe pas deja un paiement `pending/paid` pour ce mois.
3. Enregistrer le paiement avec methode `cash`.
4. Ajouter une note de preuve (reference recu interne).
5. Verifier que statut passe a `paid`.
6. Verifier que l'admin est marque `paid`.

Controles qualite:
1. Unicite mois admin.
2. Coherence montant/justificatif.
3. Trace audit disponible.

Escalade:
- Si conflit de mois deja paye ou incoherence historique.

Preuves a conserver:
1. ID paiement.
2. Mois.
3. Montant.
4. Reference justificatif.
5. Validateur.
