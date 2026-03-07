# Script oral de soutenance - KYA (Keur Ya Aicha)

Temps cible total: 10 a 12 minutes.

## Slide 1 - Soutenance

- Temps conseille: 45 secondes
- Objectif: KYA (Keur Ya Aicha) - Plateforme de gestion locative multi-roles
- Ce que je dis:

Bonjour. Je vais vous presenter KYA, une plateforme de gestion locative multi-roles. L objectif etait de construire un produit concret, deployable et structuré techniquement, capable de gerer les clients, les locations, les paiements, les documents et la gouvernance par Super Admin.

## Slide 2 - Problematique

- Temps conseille: 35 a 50 secondes
- Objectif: Pourquoi ce projet ?
- Ce que je dis:

Le point de depart du projet, c est un besoin de centralisation. Les fichiers Excel isoles, les documents disperses et les paiements suivis manuellement rendent la gestion locative peu fiable. Il fallait donc une plateforme qui structure ces flux et apporte de la traçabilite.

## Slide 3 - Objectif et valeur

- Temps conseille: 35 a 50 secondes
- Objectif: Une solution complete et exploitable
- Ce que je dis:

La valeur de KYA est double. D une part, il couvre le besoin metier de gestion locative. D autre part, il pose une base technique propre pour evoluer vers un SaaS reeel, avec sécurité, import, audit, notifications et déploiement separé frontend/backend.

## Slide 4 - Acteurs et perimetre

- Temps conseille: 35 a 50 secondes
- Objectif: Qui fait quoi dans le systeme ?
- Ce que je dis:

Le projet est organise autour de trois acteurs principaux. Le Super Admin pilote la plateforme. L Admin gère son propre portefeuille sans voir les données des autres. Le Client reste au bout du flux pour recevoir les notifications et justifier les régularisations nécessaires.

## Slide 5 - Architecture globale

- Temps conseille: 35 a 50 secondes
- Objectif: Frontend, backend, base et services externes
- Ce que je dis:

L architecture globale est clairement separée. Le frontend gère l experience utilisateur. Le backend porte la logique metier et la sécurité. PostgreSQL assure la persistence. Les integrations externes restent encapsulees dans des services dédiés pour limiter le couplage.

## Slide 6 - Architecture frontend

- Temps conseille: 35 a 50 secondes
- Objectif: Organisation du web et du desktop
- Ce que je dis:

Le frontend est structuré autour d un routage principal, de providers globaux, d un layout stable et de modules métiers. Un point important est la configuration runtime de l API, qui permet de changer l URL backend sans reconstruire l application desktop.

## Slide 7 - Architecture backend

- Temps conseille: 35 a 50 secondes
- Objectif: POO, SOLID, services et DAO
- Ce que je dis:

Le backend suit une logique de séparation des responsabilités. Les routes recoivent la requête, les controleurs l interprètent, les services appliquent les règles métier, et la persistence est déléguée à des DAO Prisma. Cela améliore la lisibilité, les tests et l évolutivité.

## Slide 8 - Modele de donnees et securite

- Temps conseille: 35 a 50 secondes
- Objectif: Entites clefs et protections
- Ce que je dis:

La base de donnees a ete pensée pour supporter les flux réels : comptes, clients, locations, paiements, documents et imports. Côté sécurité, les protections ne sont pas superficielles : on a du CSRF, du contrôle de session, du blocage IP et une deuxième authentification pour le Super Admin.

## Slide 9 - Grande fonctionnalite 1

- Temps conseille: 35 a 50 secondes
- Objectif: Excel / CSV / JSON avec correction avant insertion
- Ce que je dis:

L import a été une fonctionnalité structurante. Au lieu d injecter un fichier brut, l application permet de mapper, corriger, valider et tracer l import. Cela réduit les erreurs et rassure l administrateur avant la mise en base.

## Slide 10 - Grande fonctionnalite 2

- Temps conseille: 35 a 50 secondes
- Objectif: Demande, validation, creation du compte et notification
- Ce que je dis:

Ce flux montre la gouvernance de la plateforme. Un administrateur ne devient actif qu après validation. Une fois approuvé, il reçoit ses accès. Un correctif important a été apporté sur la normalisation des numéros de téléphone pour éviter les faux échecs de connexion.

## Slide 11 - Grande fonctionnalite 3

- Temps conseille: 35 a 50 secondes
- Objectif: Suivi des regles metier et evenements
- Ce que je dis:

Le paiement d abonnement ne se limite pas à un bouton payer. Le backend vérifie l ordre des mois, les doublons et la finalisation réelle de la transaction. Les notifications sont ensuite diffusées par événement, sans coupler le métier à Brevo directement.

## Slide 12 - Deploiement et documentation

- Temps conseille: 35 a 50 secondes
- Objectif: Liens de production et documentation technique
- Ce que je dis:

Le projet n est pas resté au stade local. Le frontend est déployé sur Vercel et le backend séparément. La documentation technique a été fortement détaillée, avec des diagrammes, des annexes de code et des supports de soutenance exploitables directement.

## Slide 13 - Resultats obtenus

- Temps conseille: 35 a 50 secondes
- Objectif: Bilan du projet
- Ce que je dis:

Le résultat principal est un produit cohérent, pas seulement une maquette. Le backend, le frontend, l import, la gouvernance et les notifications forment un ensemble démontrable. J ai également préparé toute la matière de soutenance pour justifier les choix techniques et métier.

## Slide 14 - Plan de demonstration

- Temps conseille: 45 secondes
- Objectif: Comment montrer rapidement la valeur du produit
- Ce que je dis:

Pour la démonstration, il faut rester court et prouver la valeur. Le bon ordre est : approbation admin, login admin, gestion d un client, import contrôlé, puis paiement abonnement et notifications. Cela montre à la fois la gouvernance et l usage métier.

## Slide 15 - Conclusion et perspectives

- Temps conseille: 35 a 50 secondes
- Objectif: Ce que le projet prouve et ce qui vient ensuite
- Ce que je dis:

Pour conclure, KYA démontre qu il est possible de construire une solution de gestion locative utile, gouvernée et techniquement solide. Les prochaines étapes naturelles sont l analytique, les canaux de notification supplémentaires et le renforcement des tests et du CI/CD.
