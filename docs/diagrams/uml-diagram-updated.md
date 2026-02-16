# Diagramme UML mis à jour

## Entités principales et relations

### Entités principales

- **User** : Classe de base pour tous les utilisateurs (Super Admin, Admin, Client).
- **Admin** : Hérite de `User` et représente les administrateurs.
- **SuperAdmin** : Hérite de `Admin` et représente les super administrateurs avec des permissions supplémentaires.
- **Client** : Hérite de `User` et représente les clients gérés par les administrateurs.
- **AdminClient** : Table d'association pour gérer la relation N:N entre `Admin` et `Client`.
- **Rental** : Représente les locations associées aux clients.

### Relations

1. **User** → **Admin** → **SuperAdmin** :
   - Relation d'héritage : `Admin` hérite de `User`, et `SuperAdmin` hérite de `Admin`.

2. **Admin** → **Client** (via `AdminClient`) :
   - Relation N:N : Un admin peut gérer plusieurs clients, et un client peut être associé à plusieurs admins.

3. **Client** → **Rental** :
   - Relation 1:N : Un client peut avoir plusieurs locations.

### Diagramme UML (texte)

```plaintext
+------------------+
| User             |
+------------------+
| - id: String     |
| - username: String|
| - password: String|
| - name: String    |
| - email: String   |
| - phone: String   |
| - role: String    |
| - status: String  |
| - createdAt: Date |
| - updatedAt: Date |
+------------------+
         ^
         |
+------------------+
| Admin            |
+------------------+
| - id: String     |  -- Hérité de User
| - entrepriseId: String |
| - paid: Boolean  |
| - paidAt: Date   |
+------------------+
         ^
         |
+------------------+
| SuperAdmin       |
+------------------+
| - id: String     |  -- Hérité de Admin
| - permissions: String[] |
+------------------+

+------------------+
| Client           |
+------------------+
| - id: String     |  -- Hérité de User
| - status: String  |
| - rentals: List<Rental> |
+------------------+

+------------------+
| AdminClient      |
+------------------+
| - adminId: String|  -- Référence à Admin
| - clientId: String|  -- Référence à Client
| - createdAt: Date |
+------------------+
         |
         | 1:N
         v
+------------------+
| Rental           |
+------------------+
| - id: String     |
| - clientId: String|
| - propertyType: String |
| - propertyName: String |
| - monthlyRent: Float   |
| - startDate: Date      |
| - deposit: Float       |
+------------------+

+------------------+
| Notifications    |
+------------------+
| - id: SERIAL     |  -- Table d'entités
| - user_id: INT  |  -- Référence à User
| - type: VARCHAR(50) |  -- Type de notification
| - message: TEXT |  -- Message de la notification
| - is_read: BOOLEAN |  -- Si la notification est lue
| - created_at: TIMESTAMP |  -- Date de création
+------------------+

+------------------+
| OTP              |
+------------------+
| - id: SERIAL     |  -- Table d'entités
| - user_id: INT  |  -- Référence à User
| - otp_code: VARCHAR(6) |  -- Code OTP
| - action: VARCHAR(50) |  -- Action pour laquelle le code OTP est utilisé
| - expires_at: TIMESTAMP |  -- Date d'expiration
| - is_used: BOOLEAN |  -- Si le code OTP est utilisé
| - created_at: TIMESTAMP |  -- Date de création
+------------------+
```

### Contraintes d'intégrité

1. **Clé étrangère entre `AdminClient` et `Admin`** :
   - `adminId` dans `AdminClient` fait référence à `id` dans `Admin`.
   - Contrainte : `ON DELETE CASCADE` pour supprimer les associations si un admin est supprimé.

2. **Clé étrangère entre `AdminClient` et `Client`** :
   - `clientId` dans `AdminClient` fait référence à `id` dans `Client`.
   - Contrainte : `ON DELETE CASCADE` pour supprimer les associations si un client est supprimé.

3. **Clé étrangère entre `Rental` et `Client`** :
   - `clientId` dans `Rental` fait référence à `id` dans `Client`.
   - Contrainte : `ON DELETE CASCADE` pour supprimer les locations associées lorsqu'un client est supprimé.

### Table `AuditLogs`

```sql
CREATE TABLE AuditLogs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    details TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE INDEX idx_auditlogs_timestamp ON AuditLogs(timestamp);
CREATE INDEX idx_auditlogs_user_id ON AuditLogs(user_id);
```

### Table `Notifications`

```sql
CREATE TABLE Notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_is_read ON Notifications(is_read);
```

### Table `OTP`

```sql
CREATE TABLE OTP (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    action VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE INDEX idx_otp_is_used ON OTP(is_used);
CREATE INDEX idx_otp_expires_at ON OTP(expires_at);
```

### Surveillance des anomalies

#### Requêtes SQL pour détecter les anomalies

```sql
-- Tentatives de connexion échouées
SELECT user_id, COUNT(*) AS failed_attempts
FROM AuditLogs
WHERE action = 'FAILED_LOGIN'
AND timestamp > NOW() - INTERVAL '1 HOUR'
GROUP BY user_id
HAVING COUNT(*) > 5;

-- Activité inhabituelle (plusieurs actions depuis la même IP)
SELECT ip_address, COUNT(*) AS action_count
FROM AuditLogs
WHERE timestamp > NOW() - INTERVAL '1 HOUR'
GROUP BY ip_address
HAVING COUNT(*) > 100;
```

### Archivage et sauvegarde des journaux

#### Script de sauvegarde

```bash
#!/bin/bash
# Script to archive and back up AuditLogs

BACKUP_DIR="/home/pmt/KeurYaAicha/kya/frontend/db/backups"
mkdir -p "$BACKUP_DIR"

# Archive logs older than 30 days
ARCHIVE_FILE="$BACKUP_DIR/auditlogs_$(date +%Y%m%d).sql"
echo "Archiving logs older than 30 days to $ARCHIVE_FILE"
psql -U postgres -d your_database_name -c "COPY (SELECT * FROM AuditLogs WHERE timestamp < NOW() - INTERVAL '30 DAYS') TO STDOUT" > "$ARCHIVE_FILE"

# Delete archived logs
echo "Deleting archived logs"
psql -U postgres -d your_database_name -c "DELETE FROM AuditLogs WHERE timestamp < NOW() - INTERVAL '30 DAYS';"

# Notify completion
echo "Backup and archive completed."
```

### Exemple SQL pour les relations

#### Table `AdminClient`

```sql
CREATE TABLE AdminClient (
    adminId VARCHAR(255) NOT NULL,
    clientId VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (adminId, clientId),
    FOREIGN KEY (adminId) REFERENCES Admins(id) ON DELETE CASCADE,
    FOREIGN KEY (clientId) REFERENCES Clients(id) ON DELETE CASCADE
);
```

#### Table `Rental`

```sql
CREATE TABLE Rentals (
    id VARCHAR(255) NOT NULL,
    clientId VARCHAR(255) NOT NULL,
    propertyType VARCHAR(255),
    propertyName VARCHAR(255),
    monthlyRent FLOAT,
    startDate DATE,
    deposit FLOAT,
    PRIMARY KEY (id),
    FOREIGN KEY (clientId) REFERENCES Clients(id) ON DELETE CASCADE
);
```
