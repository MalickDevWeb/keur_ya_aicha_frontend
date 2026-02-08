# Historique des Modifications

## v2.0.0 - Refactorisation Documentation

### Modifications

- Réorganisation de la documentation dans `docs/`
- Création de [`docs/CLOUDINARY.md`](CLOUDINARY.md) pour l'upload photos/PDF
- Création de [`docs/LOGGING.md`](LOGGING.md) pour le système de logging
- Consolidation des multiples fichiers README en fichiers thématiques

---

## v1.5.0 - Améliorations Formulaires

### Nouveaux Composants

- **`formSchemas.ts`** - Schémas Zod centralisés pour tous les formulaires
- **`FormError.tsx`** - Composant d'affichage des erreurs de validation
- **`ConfirmDialog.tsx`** - Dialogues de confirmation pour actions critiques
- **`useApiCall.ts`** - Hook pour les appels API avec retry automatique

### Améliorations

- Validation Zod sur tous les formulaires
- Confirmation avant archivage/blacklist
- Meilleure gestion des erreurs HTTP (401, 403, 404, 5xx)
- Retry automatique (jusqu'à 2 tentatives)

---

## v1.0.0 - Système de Logging

### Fonctionnalités Ajoutées

- Logging avec emojis pour toutes les opérations
- Couverture 100% des API calls et CRUD operations
- Guide de débogage complet dans [`LOGGING.md`](LOGGING.md)

### Fichiers Instrumentés

| Fichier                        | Fonctions                  |
| ------------------------------ | -------------------------- |
| `src/services/api.ts`          | Toutes les fonctions API   |
| `src/contexts/DataContext.tsx` | Toutes les opérations CRUD |
| `src/pages/Dashboard.tsx`      | Handlers de paiement       |
| `src/pages/AddClient.tsx`      | Création de client         |
| `src/pages/AddRental.tsx`      | Ajout de location          |
| `src/pages/AddPayment.tsx`     | Ajout de paiement          |
| `src/pages/Clients.tsx`        | Navigation                 |
| `src/pages/ClientDetail.tsx`   | Archive/Blacklist          |

---

## v0.5.0 - Intégration Cloudinary

### Fonctionnalités

- Upload de photos et documents vers Cloudinary
- Hook `useCloudinaryUpload` pour faciliter l'intégration
- Validation des types de fichiers (images, PDF)
- Gestion des erreurs et progress tracking

### Configuration

```
VITE_CLOUDINARY_CLOUD_NAME=djp423xyr
VITE_CLOUDINARY_API_KEY=858647214159638
VITE_CLOUDINARY_UPLOAD_PRESET=Unsigned
```

---

## v0.1.0 - Release Initiale

### Fonctionnalités de Base

- Authentification (admin/admin123)
- Gestion des clients (CRUD)
- Locations et paiements
- Archives et blacklist
- Thèmes multiples (Orange, Dark, Gray, Clinic)
- Internationalisation (Français/Anglais)
