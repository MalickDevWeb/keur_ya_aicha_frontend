# SOP-07 - Rollback d'une Action

Objectif:
- Annuler une action recente de maniere sure et tracee.

Role responsable:
- Super Admin ou operateur autorise

Temps cible:
- 5 a 15 minutes

Declencheur:
- Erreur metier sur une action recente (modification/suppression/creation).

Pre-requis:
1. ID undo disponible (`undo-actions`).
2. Action encore dans la fenetre de validite.

Procedure:
1. Lister les actions undo recentes.
2. Identifier la bonne action (resource, resourceId, method, date).
3. Verifier impact metier attendu du rollback.
4. Executer rollback via l'ID cible.
5. Verifier resultat metier apres rollback.
6. Documenter la raison de l'annulation.

Controles qualite:
1. Action cible exacte (eviter rollback erreur).
2. Pas d'effet secondaire inattendu.
3. Audit `UNDO_ROLLBACK` present.

Cas d'echec possibles:
1. rollback expire
2. rollback non autorise
3. action introuvable

Escalade:
- Si rollback impossible et impact critique.

Preuves a conserver:
1. ID undo.
2. Resource impactee.
3. Resultat final.
4. Operateur/date.
