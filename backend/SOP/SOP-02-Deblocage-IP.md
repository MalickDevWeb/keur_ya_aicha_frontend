# SOP-02 - Deblocage IP

Objectif:
- Debloquer une IP legitime en minimisant le risque securite.

Role responsable:
- Super Admin (ou personne autorisee par politique interne)

Temps cible:
- 5 a 10 minutes

Declencheur:
- Ticket utilisateur "acces bloque" ou alerte de faux positif.

Pre-requis:
1. ID/IP dans `blocked_ips`.
2. Historique incident disponible.

Procedure:
1. Verifier l'identite du demandeur (canal officiel).
2. Confirmer l'IP concernee et l'heure du blocage.
3. Consulter l'audit recent (tentatives ratees, pattern suspect).
4. Evaluer le risque:
- Risque faible -> continuer.
- Risque eleve -> escalader.
5. Executer le deblocage de l'IP.
6. Verifier que l'IP n'apparait plus dans la liste bloquee.
7. Informer l'utilisateur et demander re-test de connexion.

Controles qualite:
1. Deblocage trace (audit `IP_UNBLOCKED`).
2. Notification securite emise.
3. Ticket clos avec horodatage.

Escalade immediate si:
1. Multiples comptes touches.
2. Activite anormale persistante.
3. Recurrence de blocage court terme.

Preuves a conserver:
1. IP debloquee.
2. Motif.
3. Nom operateur.
4. Date/heure.
