# SOP-08 - Triage Alertes Securite

Objectif:
- Qualifier et traiter rapidement les alertes securite.

Role responsable:
- Ops + Super Admin

Temps cible:
- 15 minutes par alerte

Declencheur:
- Notification `SECURITY_ALERT` ou pic d'echecs login.

Pre-requis:
1. Acces notifications + audit logs.
2. Regles d'escalade disponibles.

Procedure:
1. Identifier type d'alerte (IP bloquee, IP debloquee, autre).
2. Evaluer criticite:
- Critique: impact multi-comptes / pattern massif
- Majeur: impact local significatif
- Normal: incident isole
3. Correler avec audit logs (periode et IP).
4. Definir action:
- observation
- blocage/deblocage
- contact utilisateur
- escalade technique
5. Executer action retenue.
6. Documenter conclusion et statut incident.

Controles qualite:
1. Alerte classee (critique/majeur/normal).
2. Decision prise avec justification.
3. Dossier incident ferme ou escalade active.

Escalade immediate si:
1. pattern attaque probable
2. recurrence en serie
3. indisponibilite metier

Preuves a conserver:
1. ID notification.
2. Criticite.
3. Action prise.
4. Responsable/date.
