# Presentation de soutenance - KYA (Keur Ya Aicha)

## Informations

- Etudiant: Papa Malick Teuw
- Formation: Developpeur Full Stack Web et Mobile
- Etablissement: Orange Digital Center
- Annee academique: 2025-2026
- Encadrant: M. Birane Bailla Wone

## Slide 1 - Soutenance

### Kicker
Projet de fin de cycle

### Sous-titre
KYA (Keur Ya Aicha) - Plateforme de gestion locative multi-roles

### Points cles
- Presente par Papa Malick Teuw
- Developpeur Full Stack Web et Mobile
- Orange Digital Center - 2025-2026
- Encadrement: M. Birane Bailla Wone

## Slide 2 - Problematique

### Kicker
Constat de depart

### Sous-titre
Pourquoi ce projet ?

### Points cles
- La gestion locative manuelle produit des doublons et des oublis.
- Les paiements et depots sont difficiles a suivre sans historique centralise.
- Les documents restent souvent disperses et peu relies aux dossiers clients.
- Sans gouvernance ni audit, le controle multi-acteurs reste fragile.

## Slide 3 - Objectif et valeur

### Kicker
Ce que KYA apporte

### Sous-titre
Une solution complete et exploitable

### Points cles
- Centraliser clients, locations, paiements, cautions et documents.
- Distinguer clairement Super Admin, Admin et Client.
- Permettre l import Excel / CSV / JSON avec controle anti-doublon.
- Offrir un produit deployable sur web et exploitable sur desktop Electron.

## Slide 4 - Acteurs et perimetre

### Kicker
Analyse fonctionnelle

### Sous-titre
Qui fait quoi dans le systeme ?

### Points cles
- Super Admin : approbation, gouvernance, maintenance, impersonation, supervision.
- Admin : gestion de ses clients, locations, paiements, imports et documents.
- Client : reçoit les informations, recus et relances le concernant.
- Services externes : paiement, Cloudinary, Brevo.

## Slide 5 - Architecture globale

### Kicker
Vue d ensemble

### Sous-titre
Frontend, backend, base et services externes

### Points cles
- Frontend React/Vite/TypeScript pour l interface metier.
- Backend Next.js App Router structure en couches.
- PostgreSQL via Prisma pour la persistence relationnelle.
- Brevo, Cloudinary et provider de paiement comme integrations externes.

## Slide 6 - Architecture frontend

### Kicker
Couche presentation

### Sous-titre
Organisation du web et du desktop

### Points cles
- React Router pour la navigation et les gardes de routes.
- AuthContext pour la session et les permissions.
- Zustand pour centraliser les donnees metier.
- Composants reutilisables et configuration runtime de l API.

## Slide 7 - Architecture backend

### Kicker
Couche metier

### Sous-titre
POO, SOLID, services et DAO

### Points cles
- Routes API fines, sans logique metier lourde.
- Controleurs et services applicatifs pour l orchestration.
- Interfaces DAO / Repository pour decoupler la persistence.
- Prisma, audit, securite et notifications comme briques d infrastructure.

## Slide 8 - Modele de donnees et securite

### Kicker
Fiabilite du systeme

### Sous-titre
Entites clefs et protections

### Points cles
- Entites principales : Utilisateur, Admin, Client, Location, Paiement, Document.
- ImportRun, Notification et JournalAudit pour la traçabilite.
- JWT, cookies, CSRF, blocage IP et seconde authentification Super Admin.
- Isolation des donnees par admin et impersonation encadree.

## Slide 9 - Grande fonctionnalite 1

### Kicker
Import de donnees

### Sous-titre
Excel / CSV / JSON avec correction avant insertion

### Points cles
- Chargement du fichier et extraction des colonnes detectees.
- Mapping clair des champs obligatoires et optionnels.
- Previsualisation editable avant envoi en base.
- Journal d import avec erreurs, succes et pages dediees.

## Slide 10 - Grande fonctionnalite 2

### Kicker
Approbation administrateur

### Sous-titre
Demande, validation, creation du compte et notification

### Points cles
- Le Super Admin valide ou rejette une demande d inscription.
- En cas d approbation, user, admin et entreprise sont crees.
- Les identifiants sont generes puis notifies.
- Le login accepte email ou telephone avec normalisation +221.

## Slide 11 - Grande fonctionnalite 3

### Kicker
Paiement abonnement et notifications

### Sous-titre
Suivi des regles metier et evenements

### Points cles
- Controle du mois requis et des doublons de paiement.
- Gestion de plusieurs methodes : cash, Wave, Orange Money.
- Passage en paid seulement si le paiement est reellement finalise.
- Notification transactionnelle vers Super Admin, Admin et Client.

## Slide 12 - Deploiement et documentation

### Kicker
Produit demonstrable

### Sous-titre
Liens de production et documentation technique

### Points cles
- Frontend : https://keur-ya-aicha-frontend.vercel.app
- Backend API : https://bakend-next-saas-gestion-client.onrender.com/api
- Docs backend : https://bakend-next-saas-gestion-client.onrender.com/docs
- Memoire complet, diagrammes UML, annexes code et scripts de generation fournis.

## Slide 13 - Resultats obtenus

### Kicker
Ce qui est effectivement livre

### Sous-titre
Bilan du projet

### Points cles
- Application web cohérente et responsive.
- Backend structuré et industrialisable.
- Import robuste avec pages succes / erreurs.
- Pack de soutenance complet : mémoire, UML, slides, oral, FAQ jury.

## Slide 14 - Plan de demonstration

### Kicker
Parcours live recommande

### Sous-titre
Comment montrer rapidement la valeur du produit

### Points cles
- Connexion Super Admin et validation d une demande admin.
- Connexion Admin, creation d un client et d une location.
- Import d un fichier avec erreurs puis correction.
- Paiement abonnement et visualisation des notifications / statuts.

## Slide 15 - Conclusion et perspectives

### Kicker
Ouverture

### Sous-titre
Ce que le projet prouve et ce qui vient ensuite

### Points cles
- KYA constitue une base serieuse de SaaS de gestion locative.
- L architecture permet l evolution vers analytics, SMS/WhatsApp et CI/CD complet.
- Le projet combine valeur metier, gouvernance et rigueur technique.
- Merci de votre attention.
