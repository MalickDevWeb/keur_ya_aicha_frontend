# Questions / reponses du jury - KYA (Keur Ya Aicha)

## Question 1

**Question :** Pourquoi avoir choisi React/Vite pour le frontend ?

**Reponse :** React permet de structurer l interface en composants réutilisables, tandis que Vite accélère énormément le développement et le build. C est un bon compromis entre productivité, performance et maintenabilité.

## Question 2

**Question :** Pourquoi un backend Next.js séparé au lieu d un backend Express classique ?

**Reponse :** Le projet utilisait déjà un écosystème TypeScript moderne. Next.js App Router permet d exposer des routes API propres, tout en gardant une organisation claire. Le vrai point important n est pas Next lui-même, mais l architecture en couches mise autour.

## Question 3

**Question :** Pourquoi avoir ajouté une gouvernance Super Admin ?

**Reponse :** Parce qu un produit multi-entreprises ou multi-admins a besoin d un niveau de contrôle central : approbation, maintenance, supervision, audit et impersonation encadrée.

## Question 4

**Question :** Comment l application évite les doublons lors des imports ?

**Reponse :** L import n insère pas immédiatement. Les lignes sont d abord analysées, comparées aux contraintes métier et aux données existantes, puis corrigées si besoin avant insertion. Les erreurs sont journalisées par import run.

## Question 5

**Question :** Pourquoi un journal d import est-il important ?

**Reponse :** Il permet la traçabilité. On sait quel fichier a été importé, combien de lignes ont réussi, quelles erreurs ont été détectées et quelle page doit être montrée à l utilisateur.

## Question 6

**Question :** Comment fonctionne la sécurité du projet ?

**Reponse :** Elle combine plusieurs niveaux : JWT, cookies, CSRF, contrôle des rôles, isolation par admin, blocage IP, seconde authentification Super Admin et journal d audit.

## Question 7

**Question :** Comment garantissez-vous qu un admin ne voie pas les clients d un autre admin ?

**Reponse :** Les requêtes backend résolvent le propriétaire logique des données à partir du contexte d authentification. L ownership est ensuite appliqué dans les services et les DAO.

## Question 8

**Question :** Pourquoi avoir utilisé Zustand ?

**Reponse :** Zustand est léger, simple à lire et adapté à un store métier centralisé. Il évite une surcouche complexe tout en gardant une bonne lisibilité dans le frontend.

## Question 9

**Question :** Comment l application gère-t-elle le mode desktop ?

**Reponse :** La version Electron réutilise le même cœur frontend, avec une configuration runtime qui permet de pointer vers l API souhaitée sans recompiler l application.

## Question 10

**Question :** Pourquoi les notifications passent-elles par un système d événements ?

**Reponse :** Cela découple la logique métier du fournisseur externe. Le backend publie un événement métier, puis un ou plusieurs écouteurs gèrent l envoi par Brevo ou d autres canaux plus tard.

## Question 11

**Question :** Quels sont les types d emails prévus ?

**Reponse :** Des emails transactionnels : approbation d admin, notifications de paiement, relances client, alertes Super Admin et informations liées au fonctionnement du service.

## Question 12

**Question :** Comment avez-vous géré le responsive mobile ?

**Reponse :** Les layouts, les composants et les pages critiques ont été revus pour éviter les débordements, clarifier les actions et conserver une lecture confortable sur téléphone.

## Question 13

**Question :** Pourquoi avoir intégré les documents dans la plateforme ?

**Reponse :** Parce que les contrats, reçus et pièces justificatives font partie du cycle locatif. Les sortir de la plateforme casse le suivi et la traçabilité.

## Question 14

**Question :** Comment fonctionne le paiement d abonnement administrateur ?

**Reponse :** Le backend vérifie le mois attendu, bloque les doublons, distingue les méthodes de paiement et ne notifie réellement le Super Admin que lorsque le paiement est finalisé.

## Question 15

**Question :** Quel a été un bug important corrigé ?

**Reponse :** Le login admin après approbation pouvait échouer à cause du format du téléphone. Le correctif a permis d accepter le numéro avec ou sans préfixe +221.

## Question 16

**Question :** Quel a été un point UX important ?

**Reponse :** Le flux d import. Il a fallu empêcher les chargements infinis, ajouter une progression visible, clarifier le mapping et permettre la correction avant insertion.

## Question 17

**Question :** Quelle est la valeur technique principale du backend ?

**Reponse :** La séparation nette entre routes, contrôleurs, services, interfaces et DAO. Cela rend le backend plus défendable en soutenance qu un simple ensemble de routes CRUD monolithiques.

## Question 18

**Question :** Comment ce projet peut-il évoluer ?

**Reponse :** Vers l analytique locative, l intégration SMS/WhatsApp, une signature documentaire plus poussée et une CI/CD complète avec tests e2e.

## Question 19

**Question :** Pourquoi ce projet est-il pertinent comme sujet de soutenance ?

**Reponse :** Parce qu il combine besoin métier réel, architecture logicielle, sécurité, intégration d outils externes, modélisation UML, déploiement et expérience utilisateur.

## Question 20

**Question :** Que montrer en démo si le temps est court ?

**Reponse :** Validation d un admin, login, création d un client, import contrôlé puis paiement abonnement. Ce parcours suffit à démontrer la gouvernance, le cœur métier et la qualité technique.
