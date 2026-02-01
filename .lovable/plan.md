

# 🏠 Application Admin Gestion Locative

## Vue d'ensemble
Une interface d'administration complète et professionnelle pour gérer les clients, locations, paiements et documents. L'application sera bilingue (FR/EN) avec WhatsApp comme canal de communication prioritaire.

---

## Phase 1 : Fondations & Design System

### 🎨 Thème et composants de base
- Mise en place de la palette de couleurs personnalisée (#0F2854, #1C4D8D, #4988C4, #BDE8F5)
- Création des composants réutilisables :
  - **BadgeStatut** : Badges colorés (Payé/Partiel/Non payé)
  - **CardStat** : Cartes statistiques avec icônes
  - **SearchInput** : Recherche multi-critères
  - **TableClient** et **TableLocations** : Tables avec tri et actions
- Support du mode clair/sombre
- Système de traduction FR/EN avec sélecteur de langue

---

## Phase 2 : Authentification Admin

### 🔐 Page de connexion
- Formulaire avec username et mot de passe
- Messages d'erreur en cas de mauvais identifiants
- Redirection vers le Dashboard après connexion
- Données de démo pour tester (admin/admin123)

---

## Phase 3 : Dashboard - Statistiques

### 📊 Tableau de bord en temps réel
- **Cartes statistiques** avec chiffres et icônes :
  - 👥 Nombre total de clients
  - 🏠 Nombre total de locations
  - ✅ Locations payées
  - ⚠️ Locations impayées
  - 💸 Locations avec reste (partiel)
  - 💰 Somme totale encaissée ce mois
- Mise à jour automatique selon les données
- Accès rapide aux listes filtrées depuis chaque carte

---

## Phase 4 : Gestion des Clients

### 📋 Liste des clients
- Tableau avec colonnes : Nom, Prénom, Téléphone, Nombre de locations, Statut global
- 🔎 **Recherche multi-critères** : Nom, Prénom, Téléphone, CNI
- 🏷️ **Filtres** : Statut paiement, Type de location, Appartement/Bien
- Résultats instantanés avec highlighting
- Actions rapides : Détails, Modifier, Ajouter location

### ➕ Ajouter un client
- Formulaire complet avec validation
- Type de location (Studio, Chambre, Appartement, Villa, Autre)
- Sélection du bien loué
- Date de début et montant mensuel
- **Caution** : Calcul automatique du reste (Total - Payée)
- Validation : impossible de dépasser le montant total
- Après création : Option d'imprimer le contrat PDF

---

## Phase 5 : Dossier Client Détaillé

### 👁️ Page détail client
- **Informations générales** : Nom, Prénom, Téléphone, CNI
- **Boutons d'action** : Modifier infos, Archiver, Blacklist

### 📍 Liste des locations du client
- Tableau avec toutes les locations
- Pour chaque location : Type, Bien, Montant mensuel, Statut caution
- Ajout de nouvelle location au client existant

### 💳 Paiements mensuels par location
- Tableau des mois avec :
  - Période (Date début → Date fin)
  - Montant dû et montant payé
  - Statut avec badge couleur
  - Dérogation automatique de 5 jours
- Ajout/modification de paiement avec validation
- Impossible de dépasser le montant du mois

### 🏦 Gestion de la caution
- Affichage : Total, Payée, Restante
- Ajout de paiement partiel
- Badge mis à jour en temps réel
- Historique des versements

---

## Phase 6 : Documents & Reçus

### 🧾 Génération de reçus PDF
- Template professionnel avec logo
- Détails du paiement (client, montant, date, type)
- Numéro de reçu unique
- Téléchargement direct

### 📤 Envoi via canaux
- **WhatsApp** (prioritaire) : Lien de partage avec message pré-rempli
- **Email** : Formulaire d'envoi avec aperçu
- **Telegram** : Lien de partage

### 📁 Contrats
- Upload du contrat signé (PDF, images)
- Historique des documents uploadés
- Téléchargement et prévisualisation

---

## Phase 7 : Interface Utilisateur

### 🖥️ Layout principal
- **Sidebar** (#0F2854) avec navigation :
  - Dashboard
  - Clients
  - Ajouter client
  - Paramètres
- **Header** avec :
  - Titre de la page
  - Sélecteur de langue (FR/EN)
  - Bouton déconnexion
- Zone de contenu principale responsive

### 📱 Responsive design
- Adapté desktop et tablette
- Sidebar collapsible sur mobile
- Tables avec scroll horizontal sur petits écrans

---

## Données de démonstration

L'application inclura des données fictives pour tester toutes les fonctionnalités :
- 5-10 clients avec différents statuts
- Multi-locations pour certains clients
- Historique de paiements variés
- Exemples de cautions partielles et complètes

---

## Évolutions futures (Backend réel)

Lorsque vous serez prêt à connecter un backend :
- Migration vers Supabase/Cloud pour persistance des données
- Authentification sécurisée avec tokens
- Stockage des documents dans le cloud
- Envoi réel d'emails via Resend
- Intégration WhatsApp Business API

