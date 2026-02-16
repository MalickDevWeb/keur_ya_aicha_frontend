# Frontend seulement (Vercel) - rapide

## Commandes minimales
```bash
cd /home/pmt/KeurYaAicha/kya/frontend
chmod +x scripts/deploy-frontend-vercel.sh
./scripts/deploy-frontend-vercel.sh
```

## Si le backend est deja deploye
```bash
./scripts/deploy-frontend-vercel.sh \
  --api-url https://api.mondomaine.com \
  --sign-url https://api.mondomaine.com/sign
```

## Si login Vercel bloque (token)
1. Creer un token sur Vercel: Account > Tokens
2. Deployer avec:

```bash
./scripts/deploy-frontend-vercel.sh --token TON_TOKEN_VERCEL
```

## Si le backend sera deploye plus tard
- Deploie le frontend maintenant avec la commande minimale.
- Plus tard, reexecute le script avec `--api-url` (et `--sign-url` si besoin).
- Alternative: definir ces variables directement dans Vercel Dashboard puis redeployer.

## Important
- Sans backend actif, l'app web s'ouvre mais la connexion ne pourra pas fonctionner.
