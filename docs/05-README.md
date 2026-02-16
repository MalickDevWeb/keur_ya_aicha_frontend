# Keur Ya Aicha - Application de Gestion Immobilière

## 📋 Description

Application frontend de gestion immobilière pour "Keur Ya Aicha" - gestion des clients, locations, paiements et documents.

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- Bun ou npm
- JSON Server sur port 4001
- Serveur Vite sur port 8084

### Installation

```bash
cd /home/pmt/KeurYaAicha/kya/frontend
bun install
```

### Lancer l'Application

```bash
# Terminal 1: JSON Server
bun run json-server --watch db/db.json --port 4001 --routes json-server.routes.json

# Terminal 2: Vite dev server
bun run dev
```

L'application sera disponible sur: `http://localhost:8084`

### Identifiants de Test

- **Username**: admin
- **Password**: admin123

## 📁 Structure du Projet

```
frontend/
├── src/
│   ├── components/     # Composants React réutilisables
│   ├── contexts/       # Contextes React (Auth, Data, Toast)
│   ├── dto/           # Data Transfer Objects
│   ├── hooks/         # Hooks personnalisés
│   ├── layouts/       # Layouts de page
│   ├── lib/          # Utilitaires et types
│   ├── pages/        # Pages de l'application
│   ├── services/     # Services API
│   └── validators/   # Validation Zod
├── docs/             # Documentation détaillée
├── templates/        # Modèles (CSV, Excel)
└── server/          # Serveur Node.js
```

## 📚 Documentation

Voir le dossier [`docs/`](docs/) pour la documentation détaillée:

| Fichier                                    | Description                      |
| ------------------------------------------ | -------------------------------- |
| [`docs/README.md`](docs/README.md)         | Guide principal                  |
| [`docs/CLOUDINARY.md`](docs/CLOUDINARY.md) | Upload photos/PDF via Cloudinary |
| [`docs/LOGGING.md`](docs/LOGGING.md)       | Système de logging et débogage   |
| [`docs/PALETTE.md`](docs/PALETTE.md)       | Thèmes et couleurs               |
| [`docs/API.md`](docs/API.md)               | Documentation API                |
| [`docs/VALIDATION.md`](docs/VALIDATION.md) | Validation des formulaires       |

## ✨ Fonctionnalités

| Module               | Fonctionnalités                        |
| -------------------- | -------------------------------------- |
| **Authentification** | Login/Logout, session sécurisée        |
| **Gestion Clients**  | Créer, modifier, archiver, blacklister |
| **Locations**        | Ajouter locations, suivre baux         |
| **Paiements**        | Enregistrer paiements, historique      |
| **Dépôts**           | Suivre dépôts de garantie              |
| **Documents**        | Upload/download PDF & images           |
| **Paramètres**       | Thème, langue                          |

## 🛠️ Technologies

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn-ui, Tailwind CSS
- **State**: Context API
- **Validation**: Zod, React Hook Form
- **Backend**: JSON Server
- **Stockage**: Cloudinary (fichiers)
- **Auth**: SessionStorage

## 🔧 Configuration

Les variables d'environnement sont dans `.env`:

```env
VITE_API_URL=http://localhost:4001
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_API_KEY=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

## 🧪 Tests

```bash
# Lancer les tests
bun test

# Tests unitaires
bun run test:unit

# Tests d'intégration
bun run test:integration
```

## 📄 Licence

Propriété de Keur Ya Aicha
