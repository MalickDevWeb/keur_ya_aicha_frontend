# Guide Metier - Equipe Operations & Administration

Ce document est volontairement non technique.
Il explique le fonctionnement du systeme pour les equipes:
- Super Admin
- Admin
- Operations
- Support

Public cible:
- personnes qui pilotent l'activite
- personnes qui valident les demandes
- personnes qui gerent les incidents

Ce guide complete les documents techniques:
- `backend/README.md`
- `backend/API_REFERENCE.md`

---

## 1) Objectif du systeme

Le systeme permet de:
1. gerer des comptes administrateurs
2. gerer des clients locataires
3. gerer le suivi des loyers, cautions et documents
4. gerer l'abonnement mensuel des administrateurs
5. tracer les actions sensibles (audit)
6. proteger la plateforme contre les abus (IP bloquees, alertes)
7. annuler certaines actions recentes (rollback)

---

## 2) Roles et responsabilites

## 2.1 Super Admin

Responsabilites principales:
1. valider ou refuser les demandes de nouveaux admins
2. surveiller les alertes securite
3. debloquer des IP si necessaire
4. verifier les paiements d'abonnement admin
5. intervenir en cas d'incident majeur

Pouvoirs cle:
- vision globale
- actions de securite
- validation manuelle des paiements especes

## 2.2 Admin

Responsabilites principales:
1. gerer son portefeuille clients
2. maintenir les dossiers clients a jour
3. enregistrer les paiements et informations locatives
4. suivre son abonnement mensuel

Contraintes:
- l'acces peut etre limite si abonnement impaye

## 2.3 Equipe Operations / Support

Responsabilites principales:
1. assister les admins et super admins
2. suivre les demandes en attente
3. surveiller les notifications critiques
4. documenter les incidents
5. escalader au Super Admin en cas de doute

---

## 3) Parcours metier: cycle de vie d'un admin

## 3.1 Inscription (demande admin)

Etapes:
1. un candidat soumet une demande
2. la demande passe en statut "en attente"
3. le Super Admin recoit une notification
4. le Super Admin analyse puis decide

Bonnes pratiques de verification:
1. verifier l'identite et le contact
2. verifier l'entreprise indiquee
3. verifier la coherence des informations

## 3.2 Decision Super Admin

Cas 1: validation
- le compte passe en actif
- l'admin peut se connecter

Cas 2: refus / suspension
- l'admin ne peut pas acceder aux fonctions metier

## 3.3 Suivi post-activation

A surveiller:
1. activite normale
2. paiements d'abonnement
3. alertes securite

---

## 4) Abonnement mensuel admin (regle metier)

## 4.1 Principe

Chaque admin doit avoir un abonnement mensuel a jour.

## 4.2 Delai de grace

Le systeme applique un delai de grace mensuel.
Au-dela, l'admin peut etre bloque sur certaines operations metier.

## 4.3 Effet metier d'un abonnement impaye

Quand un admin est bloque:
1. il garde l'acces aux ecrans necessaires pour regulariser
2. il ne peut plus executer plusieurs actions metier tant que le paiement n'est pas regularise

Message metier typique:
- abonnement mensuel impaye, paiement requis avant deblocage

## 4.4 Priorite de regularisation

Si plusieurs mois sont concernes:
- le systeme impose de payer d'abord le mois en retard prioritaire

---

## 5) Gestion des paiements admin

## 5.1 Methodes possibles

Methodes supportees:
1. Wave
2. Orange Money
3. Especes (cash)

## 5.2 Regles de validation

1. montant doit etre positif
2. un meme mois ne doit pas etre paye deux fois
3. un mois deja en cours de paiement ne doit pas etre duplique

## 5.3 Gouvernance des methodes

1. paiement especes: reserve a la validation Super Admin
2. autres methodes: suivent les regles de role

## 5.4 Statuts metier d'un paiement

Statuts typiques:
1. en attente
2. paye
3. echec
4. annule

## 5.5 Traitement webhook (confirmation provider)

Quand le fournisseur confirme:
1. le paiement passe a paye
2. le dossier admin est mis a jour
3. une trace audit est enregistree

---

## 6) Gestion clients (admin)

## 6.1 Creation d'un client

Informations minimales recommandees:
1. prenom
2. nom
3. telephone
4. statut

Recommandations:
1. ajouter email si disponible
2. ajouter CNI si disponible
3. verifier les doublons avant creation

## 6.2 Mise a jour d'un client

Regles metier:
1. conserver des donnees coherentes
2. eviter les doublons telephone/email
3. historiser les changements importants

## 6.3 Suppression / archivage

Avant suppression:
1. verifier l'impact metier
2. preferer archivage si politique interne l'exige
3. informer les parties prenantes

Note:
- les suppressions sensibles sont tracees dans l'audit

---

## 7) Gestion des imports

## 7.1 Objectif

Permettre l'import en lot de donnees (ex: clients).

## 7.2 Resultats attendus d'un import

Le systeme conserve:
1. nom du fichier
2. nombre total de lignes
3. lignes inserees
4. erreurs de lignes
5. indicateurs "lu / non lu"

## 7.3 Bonnes pratiques

1. lancer un petit fichier test avant un gros import
2. verifier les erreurs de mapping
3. corriger puis relancer
4. archiver les rapports d'import

## 7.4 Gouvernance

1. chaque admin voit ses imports
2. le super admin peut avoir une vision plus large

---

## 8) Securite operationnelle

## 8.1 Tentatives de connexion echouees

Le systeme detecte les echecs repetes.
Au-dela d'un seuil, une IP peut etre bloquee automatiquement.

## 8.2 IP bloquee

Effets:
1. requetes refusees pour cette IP
2. alerte securite envoyee aux super admins
3. audit enregistre

## 8.3 Deblocage IP

Procedure recommandee:
1. verifier la legitimite de l'utilisateur
2. verifier l'historique des tentatives
3. debloquer seulement si risque maitrise
4. suivre les recurrences

## 8.4 Hygiene de compte

1. eviter les mots de passe faibles
2. ne pas partager de compte entre personnes
3. fermer les sessions non utilisees

---

## 9) Notifications et audit

## 9.1 Notifications

Types metier importants:
1. demande admin
2. alerte securite

Actions quotidiennes operations:
1. lire les nouvelles notifications
2. qualifier (info, warning, critique)
3. traiter ou escalader

## 9.2 Audit

L'audit sert a:
1. comprendre qui a fait quoi
2. investiguer un incident
3. reconstituer une chronologie

Cas traces:
1. actions sensibles
2. erreurs importantes
3. demandes admin
4. evenements securite

---

## 10) Annulation d'actions (rollback)

## 10.1 Principe

Certaines actions recentes peuvent etre annulees.

## 10.2 Fenetre temporelle

Le rollback est possible dans une fenetre limitee.
Passe ce delai, l'annulation expire.

## 10.3 Gouvernance

1. super admin: capacite etendue
2. autres roles: capacite limitee a leurs actions

## 10.4 Bonnes pratiques

1. verifier la bonne action avant rollback
2. documenter la raison de l'annulation
3. prevenir les utilisateurs impactes

---

## 11) Procedures quotidiennes (SOP)

## 11.1 Routine debut de jour (Ops)

Checklist:
1. ouvrir le tableau de bord notifications
2. verifier alertes securite
3. verifier demandes admin en attente
4. verifier incidents non resolus
5. partager les priorites du jour

## 11.2 Routine Super Admin

Checklist:
1. traiter demandes admin en attente
2. verifier blocages IP et deblocages demandes
3. verifier paiements admin en anomalie
4. controler tendances audit (erreurs recurrentes)

## 11.3 Routine Admin

Checklist:
1. verifier statut abonnement
2. traiter les dossiers clients du jour
3. corriger les donnees incompletes
4. verifier imports et erreurs associees

---

## 12) Procedures hebdomadaires

## 12.1 Revue securite

1. nombre d'echecs de connexion
2. nombre d'IP bloquees/debloquees
3. comptes suspects ou inactifs
4. actions correctives lancees

## 12.2 Revue qualite donnees

1. doublons detectes
2. champs manquants critiques
3. imports avec erreurs frequentes
4. plan de correction

## 12.3 Revue paiements admin

1. admins en retard
2. paiements en attente
3. litiges ou incoherences
4. plan de regularisation

---

## 13) Procedures mensuelles

## 13.1 Cloture abonnement

1. liste des admins en retard
2. relance structuree
3. suivi regularisation
4. rapport final

## 13.2 Reporting direction

Indicateurs metier recommandes:
1. nombre d'admins actifs
2. nouvelles demandes admin
3. taux de regularisation abonnement
4. volume clients geres
5. incidents securite
6. temps moyen de resolution support

---

## 14) Gestion des incidents (runbook)

## 14.1 Incident: admin bloque pour impaye

Actions:
1. verifier mois requis
2. verifier tentative de paiement en cours
3. guider vers regularisation prioritaire
4. confirmer deblocage apres paiement valide

## 14.2 Incident: utilisateur legitime bloque par IP

Actions:
1. verifier historique d'alertes
2. verifier contexte (erreurs mot de passe, reseau partage)
3. deblocage controle
4. consignes utilisateur pour eviter recurrence

## 14.3 Incident: paiement confirme chez provider mais non reflété

Actions:
1. verifier reference transaction
2. verifier statut interne paiement
3. verifier traces audit associees
4. escalader technique si desynchronisation

## 14.4 Incident: import massif en erreur

Actions:
1. isoler le fichier source
2. verifier format colonnes
3. verifier donnees obligatoires
4. corriger echantillon puis retester
5. relancer import complet

---

## 15) Politique de communication interne

## 15.1 Niveaux d'urgence

1. Critique
- impact direct activite ou securite
- traitement immediat

2. Majeur
- impact operationnel fort
- traitement prioritaire

3. Normal
- impact limite
- traitement selon backlog

## 15.2 Escalade

1. Ops traite niveau normal
2. Ops escalade au Super Admin pour validation metier sensible
3. Ops escalade a l'equipe technique pour bug systeme

## 15.3 Trace obligatoire

Pour chaque incident:
1. date/heure
2. symptome
3. action prise
4. resultat
5. responsable

---

## 16) Bonnes pratiques metier

1. ne jamais valider "a l'aveugle" une demande admin
2. verifier les doublons avant creation client
3. preferer correction structuree plutot que patch urgent non trace
4. utiliser le rollback avec discipline
5. maintenir un reporting regulier
6. sensibiliser les admins aux regles d'abonnement

---

## 17) Checklists pretes a l'emploi

## 17.1 Validation d'une demande admin

Checklist:
1. identite coherent
2. telephone/email valides
3. entreprise coherent
4. besoin metier confirme
5. decision tracee

## 17.2 Deblocage IP

Checklist:
1. demandeur authentifie
2. verification tentative illegitime absente
3. deblocage justifie
4. suivi post-deblocage planifie

## 17.3 Validation paiement especes

Checklist:
1. admin cible confirme
2. mois concerne confirme
3. montant confirme
4. preuve recue
5. enregistrement final verifie

---

## 18) Indicateurs KPI recommandes

KPI operationnels:
1. delai moyen de validation demande admin
2. taux de demandes admin validees/refusees
3. taux d'erreurs d'import
4. delai moyen de resolution incident

KPI securite:
1. nombre d'IP bloquees/semaine
2. nombre de deblocages manuels
3. taux de recurrence incidents securite

KPI business:
1. taux de regularisation abonnement
2. nombre d'admins actifs mensuels
3. volume de clients suivis par admin

---

## 19) Glossaire metier

Admin:
- utilisateur qui gere des clients et operations locatives

Super Admin:
- role de gouvernance et controle

Demande admin:
- candidature d'un futur admin en attente de decision

Abonnement admin:
- paiement mensuel conditionnant certaines permissions metier

IP bloquee:
- adresse reseau temporairement interdite pour securite

Audit:
- journal des actions et evenements importants

Rollback:
- annulation d'une action recente, sous conditions

Import run:
- execution d'un import de donnees avec resultat detaille

---

## 20) Mode d'emploi du present guide

Pour une equipe Operations:
1. lire sections 2, 8, 11, 14, 17
2. utiliser les checklists quotidiennement
3. tenir une trace des decisions

Pour un Super Admin:
1. lire sections 3, 4, 5, 8, 12, 13, 14
2. appliquer les regles de validation strictement
3. piloter les KPI

Pour un Admin:
1. lire sections 4, 5, 6, 7, 11
2. maintenir ses donnees propres
3. regulariser rapidement tout retard abonnement

---

## 21) Limites actuelles connues (version metier)

1. certaines sessions sont globales au serveur et non individualisees
2. les controles d'acces restent en evolution
3. certains comportements legacy existent encore

Consequence:
- toujours verifier les operations sensibles
- escalader au besoin

---

## 22) Conclusion

Ce guide donne le cadre metier pour exploiter la plateforme de facon fiable.

Regle d'or:
- securite, tracabilite, et qualite des donnees avant vitesse d'execution.

Documents complementaires:
- technique general: `backend/README.md`
- reference API: `backend/API_REFERENCE.md`

## 23) SOP imprimables (1 page)

Dossier SOP:
- `backend/SOP/README.md`

SOP disponibles:
1. `backend/SOP/SOP-01-Validation-Demande-Admin.md`
2. `backend/SOP/SOP-02-Deblocage-IP.md`
3. `backend/SOP/SOP-03-Regularisation-Abonnement-Admin.md`
4. `backend/SOP/SOP-04-Validation-Paiement-Especes-SuperAdmin.md`
5. `backend/SOP/SOP-05-Incident-Paiement-Provider.md`
6. `backend/SOP/SOP-06-Echec-Import-Clients.md`
7. `backend/SOP/SOP-07-Rollback-Action.md`
8. `backend/SOP/SOP-08-Triage-Alertes-Securite.md`
