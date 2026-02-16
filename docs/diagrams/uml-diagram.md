# Diagramme UML des relations

## Entités principales et relations

### Entités principales

- **admin_requests** : Représente les demandes d'administration.
- **admins** : Représente les administrateurs approuvés.
- **clients** : Représente les clients gérés par les administrateurs.
- **entreprises** : Représente les entreprises associées aux administrateurs.
- **users** : Représente les utilisateurs, y compris les administrateurs et le super administrateur.

### Relations

1. **admin_requests** → **admins** :
   - Relation : `adminRequestId` dans `admins` fait référence à `id` dans `admin_requests`.
   - Type : 1:1 (une demande correspond à un administrateur).

2. **admins** → **users** :
   - Relation : `userId` dans `admins` fait référence à `id` dans `users`.
   - Type : 1:1 (un administrateur correspond à un utilisateur).

3. **admins** → **entreprises** :
   - Relation : `adminId` dans `entreprises` fait référence à `id` dans `admins`.
   - Type : 1:1 (un administrateur gère une entreprise).

4. **admins** → **clients** :
   - Relation : `adminId` dans `clients` fait référence à `id` dans `admins`.
   - Type : 1:N (un administrateur peut gérer plusieurs clients).

5. **clients** → **rentals** :
   - Relation : `clientId` dans `rentals` fait référence à `id` dans `clients`.
   - Type : 1:N (un client peut avoir plusieurs locations).

6. **rentals** → **payments** :
   - Relation : `rentalId` dans `payments` fait référence à `id` dans `rentals`.
   - Type : 1:N (une location peut avoir plusieurs paiements).

### Diagramme UML (texte)

```plaintext
+------------------+
| admin_requests   |
+------------------+
| id               |
| username         |
| name             |
| email            |
| ...              |
+------------------+
         |
         | 1:1
         v
+------------------+
| admins           |
+------------------+
| id               |
| userId           |
| adminRequestId   |
| username         |
| ...              |
+------------------+
         |
         | 1:1
         v
+------------------+
| users            |
+------------------+
| id               |
| username         |
| password         |
| role             |
| ...              |
+------------------+

+------------------+
| entreprises      |
+------------------+
| id               |
| name             |
| adminId          |
| ...              |
+------------------+

+------------------+
| clients          |
+------------------+
| id               |
| firstName        |
| lastName         |
| phone            |
| email            |
| status           |
| createdAt        |
+------------------+
         |
         | 1:N
         v
+------------------+
| dossiers         |
+------------------+
| id               |
| clientId         |  -- Référence à `clients.id`
| propertyType     |
| propertyName     |
| monthlyRent      |
| startDate        |
| deposit          |
+------------------+

+------------------+
| rentals          |
+------------------+
| id               |
| clientId         |
| propertyType     |
| ...              |
+------------------+
         |
         | 1:N
         v
+------------------+
| payments         |
+------------------+
| id               |
| rentalId         |
| amount           |
| ...              |
+------------------+
```

### Mise à jour : Généralisation entre `clients` et `dossiers`

#### Nouvelle structure UML

```plaintext
+------------------+
| clients          |
+------------------+
| id               |
| firstName        |
| lastName         |
| phone            |
| email            |
| status           |
| createdAt        |
+------------------+
         |
         | 1:N
         v
+------------------+
| dossiers         |
+------------------+
| id               |
| clientId         |  -- Référence à `clients.id`
| propertyType     |
| propertyName     |
| monthlyRent      |
| startDate        |
| deposit          |
+------------------+
```

#### Contraintes d'intégrité

- **Relation entre `clients` et `dossiers`** :
  - Clé étrangère : `clientId` dans `dossiers` fait référence à `id` dans `clients`.
  - Contrainte : `ON DELETE CASCADE` pour supprimer automatiquement les dossiers associés lorsqu'un client est supprimé.

#### Exemple SQL pour la relation

```sql
ALTER TABLE dossiers
ADD CONSTRAINT fk_client_dossier
FOREIGN KEY (clientId)
REFERENCES clients(id)
ON DELETE CASCADE;
```
