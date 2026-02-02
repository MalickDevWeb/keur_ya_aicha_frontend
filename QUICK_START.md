# 🚀 QUICK START - Logging Console

## ⚡ 30 Secondes pour Commencer

```bash
# 1. Démarrer l'app
npm run dev:all

# 2. Ouvrir dans le navigateur
http://localhost:8082

# 3. Ouvrir DevTools
Appuyez sur: F12

# 4. Aller à Console
Sélectionnez: Console tab (haut à droite)

# 5. Effectuer une action
- Aller Dashboard
- Cliquer "Payer" sur un client
- Regarder les logs s'afficher! 🎉
```

## 🎯 Scénarios de Test Rapides

### Test 1: Paiement (30 sec)

```
Dashboard → Amadou Diallo (150k) → Payer → "Payer le total"
Logs: 🔵 → 🟢 → 🟩 → 📡 → ✅
```

### Test 2: Créer Client (1 min)

```
Ajouter Client → Remplir → Créer
Logs: 🔵 → 🟦 → 📡 → ✅
```

### Test 3: Archive (30 sec)

```
Clients → Détails → Archiver
Logs: 📦 → 🟦 → 📡 → ✅
```

## 📊 Les 5 Logs à Chercher

| #   | Emoji | Contexte    | Significa          |
| --- | ----- | ----------- | ------------------ |
| 1   | 🔵    | [Dashboard] | Vous avez cliqué   |
| 2   | 🟢    | [Handler]   | Handler démarre    |
| 3   | 📡    | [API]       | Appel API          |
| 4   | 🔄    | [Reload]    | Données rechargées |
| 5   | ✅    | [Success]   | Succès!            |

## 🆘 Si Vous Voyez ❌

1. Vérifier que json-server tourne:

   ```bash
   curl http://localhost:4000/clients
   ```

2. Voir le message d'erreur complet
3. Vérifier db.json
4. Redémarrer: `npm run dev:all`

## 📁 Docs Complètes

- 📖 [LOGGING_GUIDE.md](./LOGGING_GUIDE.md) - Guide détaillé
- ✅ [VALIDATION_CHECKLIST.md](./VALIDATION_CHECKLIST.md) - Checklist complète
- 📊 [LOGGING_SUMMARY.md](./LOGGING_SUMMARY.md) - Résumé complet

## 🎨 Emojis Clés

- 🔵 Clic utilisateur
- 📡 API call
- ✅ Succès
- ❌ Erreur
- 🟦 DataContext
- 🔄 Reload

---

**Commencez maintenant:** `npm run dev:all` → http://localhost:8082 → F12 → Console
