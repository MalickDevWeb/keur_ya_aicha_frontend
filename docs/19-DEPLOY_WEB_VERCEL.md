# Deploiement Web: Frontend sur Vercel + Backend separe

## Pourquoi
- Le frontend (React/Vite) se deploie tres bien sur Vercel.
- Le backend actuel (`backend/src/index.mjs`) ecrit dans `backend/db/db.json`.
- Vercel Functions n'est pas adapte a ce backend car le filesystem est ephemere/read-only en runtime.

## Architecture recommandee
- Frontend: Vercel
- Backend API: Render / Railway / VPS (process Node persistant + stockage persistant)

## 1) Backend d'abord
Expose une URL HTTPS backend, par exemple:
- `https://kya-api.onrender.com`

Verifier:
- `GET https://kya-api.onrender.com/authContext`
- `POST https://kya-api.onrender.com/sign` (si Cloudinary signe cote backend)

## 2) Frontend sur Vercel
Le projet contient deja `vercel.json` (rewrite SPA React Router).

### Variables d'environnement Vercel
- `VITE_API_URL=https://kya-api.onrender.com`
- `VITE_CLOUDINARY_SIGN_URL=https://kya-api.onrender.com/sign` (optionnel selon votre flow)

### Settings Build Vercel
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js Version: `22.x` (recommande)

## 3) Deploy
- Connecter le repo dans Vercel.
- Ajouter les variables env (Production + Preview).
- Lancer Deploy.

## 4) Verification apres deploy
- Ouvrir `https://<ton-app>.vercel.app/login`
- Tester login + appels API.
- Si erreur CORS, autoriser le domaine Vercel cote backend.

## 5) Si tu veux garder Electron
- Vercel sert uniquement la version web.
- Les executables desktop (Linux/Windows/macOS) restent distribues separement.
