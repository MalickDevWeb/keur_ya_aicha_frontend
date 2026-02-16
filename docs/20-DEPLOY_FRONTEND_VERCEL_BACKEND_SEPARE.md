# Frontend Vercel + Backend separe

## Objectif
- Deployer uniquement le frontend sur Vercel.
- Garder tout le non-frontend (backend/db/scripts desktop) hors de Vercel.
- Conserver la possibilite de changer l'URL API depuis les parametres Super Admin.

## Ce qui est deja en place
- `vercel.json`: build Vite + rewrite SPA React Router.
- `.vercelignore`: exclut backend, releases, docs, artefacts desktop.
- Runtime API configurable au niveau app:
  - page: `Parametres > Configuration API (Super Admin)`
  - stockage web: `localStorage` du navigateur
  - stockage desktop Electron: fichier runtime local

## Etapes de deploiement
1. Deployer le backend sur un service Node persistant (Render/Railway/VPS).
2. Recuperer l'URL publique backend (ex: `https://api.mondomaine.com`).
3. Sur Vercel, creer le projet frontend.
4. Configurer les variables d'environnement Vercel:
   - `VITE_API_URL=https://api.mondomaine.com`
   - `VITE_CLOUDINARY_SIGN_URL=https://api.mondomaine.com/sign` (si utilise)
5. Deployer.

## Apres deploy
- Ouvrir l'application web.
- Se connecter en Super Admin.
- Aller dans `Parametres > Configuration API (Super Admin)`.
- Modifier:
  - URL API backend
  - URL Cloudinary Sign (optionnel)
- Enregistrer.

## Notes importantes
- Sans `VITE_API_URL` correct au premier deploy, la connexion peut echouer avant d'acceder aux parametres.
- En mode web, le changement runtime est local au navigateur utilise.
