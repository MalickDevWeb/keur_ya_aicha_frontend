# Build Electron Multi-OS + API Runtime (sans rebuild)

## Objectif
- Générer un installateur/exécutable desktop par OS: Linux, Windows, macOS.
- Garder la possibilité de changer l'API consommée après build.

## Commandes de build
- Linux: `npm run build:electron:linux`
- Windows: `npm run build:electron:win`
- macOS: `npm run build:electron:mac`
- Build Electron par défaut (OS courant): `npm run build:electron`

Les artefacts sont générés dans `dist/`.

## Important pour “n'importe quelle machine”
- Un build Linux ne s'installe pas sur Windows/macOS.
- Un build Windows ne s'installe pas sur Linux/macOS.
- Un build macOS ne s'installe pas sur Linux/Windows.
- Il faut exécuter le build sur chaque OS cible (ou utiliser CI matrix avec runners Linux + Windows + macOS).

## Configuration API après build

Nom du fichier runtime:
- `kya.runtime.json`

Depuis l'application:
- Menu Super Admin -> Paramètres -> section `Configuration API (Super Admin)`
- Actions disponibles: `Enregistrer`, `Recharger`, `Ouvrir dossier config`

## Gouvernance Super Admin (nouveau)

Dans `Super Admin -> Paramètres`, section `Gouvernance Plateforme (Super Admin)`:
- Mode maintenance global (blocage écritures + message global)
- Sécurité session (durée session, inactivité, seuil échecs login, lockout)
- Règles paiement (grâce, pénalité, blocage)
- Documents (taille max upload, MIME autorisés, rétention)
- Notifications (channels, événements, templates)
- Branding (nom app, logo, couleur primaire, footer)
- Audit & conformité (rétention logs, export, webhook alertes)

Persistance backend:
- clé setting: `platform_config_v1`

Champs supportés:
```json
{
  "apiBaseUrl": "https://api.example.com",
  "cloudinarySignUrl": "https://api.example.com/sign"
}
```

Règles de priorité:
1. Fichier portable à côté de l'exécutable
2. Fichier utilisateur (profil système)
3. Valeurs build (`.env` au moment du build)

Si `apiBaseUrl` est vide, l'app retombe sur la valeur build (`VITE_API_URL`).

## Où placer `kya.runtime.json`

- Linux AppImage (portable): même dossier que `Keur Ya Aicha-*.AppImage`
- Windows (portable): même dossier que `.exe`
- macOS (portable): dans le dossier qui contient l'app `.app` (ou config utilisateur)

Chemin config utilisateur (auto supporté par l'app):
- Linux: `~/.config/Keur Ya Aicha/kya.runtime.json`
- Windows: `%APPDATA%/Keur Ya Aicha/kya.runtime.json`
- macOS: `~/Library/Application Support/Keur Ya Aicha/kya.runtime.json`

## Validation rapide après installation
1. Créer/éditer `kya.runtime.json` avec la nouvelle API.
2. Redémarrer l'application.
3. Vérifier la connexion/login et les pages qui appellent le backend.

## Note technique
- Le packaging Electron est exécuté via `scripts/electron-builder-runner.mjs`.
- Ce wrapper force le mode `traversal` pour la collecte de dépendances, ce qui évite l'erreur `No JSON content found in output` sur certains environnements npm.

## Référence paramètres Super Admin
- Documentation complète: `docs/18-PARAMETRES_SUPER_ADMIN.md`
