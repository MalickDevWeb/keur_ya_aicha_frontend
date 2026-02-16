# SOP-06 - Echec Import Clients

Objectif:
- Corriger un import en erreur et relancer proprement.

Role responsable:
- Admin (execution) + Ops (support)

Temps cible:
- 15 a 30 minutes

Declencheur:
- Import run avec erreurs de lignes ou resultat inattendu.

Pre-requis:
1. Fichier source disponible.
2. Rapport d'import (`inserted/errors`) accessible.

Procedure:
1. Ouvrir le dernier import run concerne.
2. Identifier les lignes en erreur (num ligne + cause).
3. Classer les erreurs:
- format de colonne
- champ requis manquant
- type de valeur invalide
- doublon metier
4. Corriger le fichier source.
5. Refaire un test sur petit lot (1-5 lignes).
6. Si test OK, relancer import complet.
7. Verifier resultat final: inserted, errors, read flags.

Controles qualite:
1. Zero erreur bloquante restante.
2. Pas de creation de doublons.
3. Rapport final archive.

Escalade:
- Si erreur repetee sans cause claire -> equipe technique.

Preuves a conserver:
1. ID import run.
2. Nombre erreurs avant/apres.
3. Fichier final valide.
