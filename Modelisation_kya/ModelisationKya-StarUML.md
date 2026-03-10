ModelisationKya – StarUML (solo)
=================================

Objectif
--------
Fixer une façon unique de travailler sur le projet « ModelisationKya » uniquement avec StarUML, en gardant les exports XMI alignés avec l'arborescence existante.

Fichier maître
--------------
- Crée et enregistre dans StarUML un fichier maître : `Modelisation_kya/ModelisationKya.mdj`.
- Ce `.mdj` reste la source de vérité. Chaque export/import XMI est un aller-retour ponctuel.

Arborescence StarUML à reproduire
---------------------------------
Racine
- Partie 1 - Aspect fonctionnel
  - Analyse
    - 1. Diagramme de contexte
    - 2. Diagramme de cas d utilisation
    - 3. Descriptions des cas d utilisation
    - 4. Diagramme de classes
    - 5. Diagrammes d activite metier
  - Conception
    - 1. Diagramme de cas d utilisation de conception
- Partie 2 - Aspect architectural

Emplacement et nommage des exports XMI
--------------------------------------
- Exporte chaque paquet (ou le modèle entier) depuis StarUML avec `File → Export → XMI…`.
- Range les XMI directement dans `Modelisation_kya/` (pas de sous-dossiers physiques supplémentaires).
- Patron de nom : `ModelisationKya-<paquet>-<AAAAMMJJ>.xmi`
  - Exemple : `Modelisation_kya/ModelisationKya-activites-admin-20260309.xmi`

Procédure d'import pour appliquer un XMI
----------------------------------------
1) Ouvre `ModelisationKya.mdj` dans StarUML.
2) Supprime le paquet cible (clic droit → Delete) pour éviter les doublons.
3) `File → Import → XMI…` → sélectionne le XMI ciblé.
4) Parcours rapidement les diagrammes importés : 
   - doublons éventuels, 
   - associations cassées,
   - stéréotypes/notes manquants.
5) Sauvegarde le `.mdj`.

Discipline de version
---------------------
- Toujours garder `.mdj` et XMI synchronisés au même commit Git si tu versionnes les deux.
- Ne pas travailler sur plusieurs XMI en parallèle pour le même paquet.

Checklist rapide (à faire maintenant)
-------------------------------------
- [ ] Ouvrir `Modelisation_kya/ModelisationKya.mdj` et dessiner les diagrammes déjà créés (vides) dans chaque paquet.
- [ ] Reproduire les diagrammes métier (Analyse) d’après les fichiers Markdown existants.
- [ ] Compléter l’Aspect architectural (paquets 1..4 ci-dessous).
- [ ] Exporter un premier XMI par paquet majeur en suivant le patron de nommage, stocké dans `Modelisation_kya/`.
- [ ] Vérifier un cycle complet import/export sur un paquet pour valider le flux.

Liste des diagrammes à recréer dans StarUML
-------------------------------------------
- Analyse / 1. Diagramme de contexte : `diagramme-contexte.md`
- Analyse / 2. Cas d'utilisation : `diagramme-cas-utilisation-analyse-{admin,client,super-admin,visiteur}.md`
- Analyse / 3. Descriptions de cas d'utilisation : `description-cas-utilisation-analyse-{admin,client,super-admin,visiteur}.md` + `descriptions-cas-utilisation-analyse.md`
- Analyse / 4. Diagrammes de classes :  
  - Vue globale du domaine (desc + diagramme)  
  - Gouvernance des acces et comptes administrateur (desc + diagramme)  
  - Gestion locative clients et documents (desc + diagramme)  
  - Abonnement administrateur et reglements (desc + diagramme)  
  - Supervision maintenance et controle global (desc + diagramme)  
  - Index : `diagramme-classes-analyse.md`, `index-diagrammes-classes-analyse.md`
- Analyse / 5. Diagrammes d'activité métier :  
  - `authentifier-acceder-admin.md` (+ version mermaid)  
  - `gestion-locative.md`  
  - `import-donnees.md`  
  - `notifications-relances.md`  
  - `paiement-abonnement-admin.md`  
  - `soumettre-valider-demande-admin.md`  
  - `index-diagrammes-activite.md`
- Conception / 1. Cas d'utilisation de conception : `diagramme-cas-utilisation-conception.md`
- Partie 2 - Aspect architectural (créés vides, à détailler) :  
  - 1. Architecture logique (composants) — diag « Architecture logique » (Component)  
  - 2. Architecture physique (deploiement) — diag « Deploiement » (Deployment)  
  - 3. Flux et integrations — diag « Flux et integrations » (Sequence)  
  - 4. Gouvernance et securite — diag « Gouvernance et securite » (Component)  
  - Vue d'ensemble architecture (Component) au niveau du paquet racine.
