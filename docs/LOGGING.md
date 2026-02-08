# Système de Logging - Guide Complet

## 📋 Vue d'ensemble

L'application utilise un système de logging avec emojis pour faciliter le débogage et comprendre le flux des opérations.

## 🎨 Codes Emojis

| Emoji | Signification | Contexte |
|-------|---------------|----------|
| 🟦 | DataContext | Opération d'initialisation/mount du contexte |
| 🔄 | Reload | Rechargement des données depuis l'API |
| 📡 | API | Appel API (requête initiée) |
| 🟢 | Handler | Début d'un handler/action utilisateur |
| 🟩 | Async Op | Opération asynchrone en cours |
| 🔵 | Click | Action utilisateur (clic sur un bouton) |
| 👁️ | View | Navigation/affichage de détails |
| ✏️ | Edit | Modification d'une entité |
| 🏠 | Rental | Action liée aux locations |
| 📦 | Archive | Archivage d'un client |
| 🚫 | Blacklist | Mise en liste noire d'un client |
| ✅ | Success | Opération réussie |
| ❌ | Error | Erreur ou échec |
| ⚠️ | Warning | Avertissement/information importante |

## 📊 Structure des Logs

Chaque log suit ce format:

```
[EMOJI] [CONTEXT] Message: {details}
```

### Exemples

```
🟦 [DataContext] addClient called: {firstName, lastName, ...}
✅ [API] Payment recorded: {id, amount, ...}
❌ [Dashboard] Erreur lors du paiement: Error message
```

## 🧪 Scénarios de Test

### 1. Créer un Client

**Logs attendus:**

```
🔵 [AddClient] onSubmit clicked with form data: {...}
🟦 [DataContext] addClient called: {...}
🟦 [DataContext] Creating client with payload: {...}
📡 [API] POST /clients: {...}
✅ [API] Client created: {...}
🔄 [DataContext] reloadClients called
📡 [API] GET /clients
✅ [API] Fetched 8 clients
🔄 [DataContext] Loaded 8 clients from API
✅ [DataContext] State updated with fetched clients
✅ [DataContext] Client created via API
✅ [DataContext] Clients reloaded
✅ [AddClient] Client created successfully: {...}
```

### 2. Enregistrer un Paiement

**Logs attendus:**

```
🔵 [Dashboard] handlePayment clicked: {
  clientId: "client-1",
  clientName: "Amadou Diallo",
  rentalId: "client-1-rental-0",
  propertyName: "Appartement A1",
  paymentStatus: "unpaid",
  amountDue: 150000
}
🔵 [Dashboard] Found payment object: {...}
🔵 [Dashboard] Payment modal opened
🟢 [Dashboard] handlePayTotal clicked
🟢 [Dashboard] Paying total: {...}
🟩 [DataContext] addMonthlyPayment called: {...}
🟩 [DataContext] Posting payment record to API...
📡 [API] POST /payments: {rentalId, paymentId, amount}
✅ [API] Payment recorded: {...}
🟩 [DataContext] Reloading clients...
🔄 [DataContext] reloadClients called
📡 [API] GET /clients
✅ [API] Fetched 7 clients
🔄 [DataContext] Loaded 7 clients from API
✅ [DataContext] State updated with fetched clients
✅ [DataContext] Payment recorded via API
✅ [DataContext] Clients reloaded after payment
✅ [Dashboard] Payment recorded successfully
```

### 3. Archiver un Client

**Logs attendus:**

```
📦 [ClientDetail] Archiving client: {...}
🟦 [DataContext] updateClient called: {id, data: {status: "archived"}}
📡 [API] PUT /clients/... {status: "archived"}
✅ [API] Client updated: {...}
🔄 [DataContext] reloadClients called
📡 [API] GET /clients
✅ [API] Fetched 6 clients
🔄 [DataContext] Loaded 6 clients from API
✅ [DataContext] State updated with fetched clients
✅ [DataContext] Client updated via API
✅ [DataContext] Clients reloaded after update
✅ [ClientDetail] Client archived, navigating to clients list
```

## 🐛 Dépannage

### Aucun log n'apparaît?

- ✅ DevTools ouvert? (F12)
- ✅ Onglet "Console" sélectionné?
- ✅ Pas de filter sur les logs? (coin haut à gauche: "All Levels")
- ✅ Page rechargée? (Ctrl+R)

### Erreur ❌ lors d'une action?

- Regardez le message d'erreur complet
- Exemple:
  ```
  ❌ [API] Error updating client: TypeError: fetch failed
  ```
- Vérifiez que json-server tourne: http://localhost:4001/clients
- Vérifiez `VITE_API_URL=http://localhost:4001` dans la console réseau

## 💡 Tips de Débogage

1. **Copier les logs:**
   ```
   Clic droit dans console → "Save as..."
   ```

2. **Filter les logs:**
   ```
   console.log() → Tapez "DataContext" ou "[API]" en haut
   ```

3. **Inspecter un objet:**
   ```
   Cliquez sur le {ellipsis} pour expanser les détails
   ```

4. **Vérifier db.json après chaque action:**
   ```
   Terminal: cat db/db.json | jq '.payments'
   ```

5. **Voir les requêtes réseau:**
   ```
   DevTools → Network tab → Filtrez par XHR
   ```

## 🎨 Couleurs Console (DevTools)

- 🟦 Bleu → DataContext (état d'application)
- 🟢 Vert → Handler/Success démarré
- 🟩 Vert foncé → Opération asynchrone
- 📡 Réseau → Appel API
- ❌ Rouge → Erreur
- ✅ Vert → Succès confirmé

## 📁 Fichiers Instrumentés

| Fichier | Fonctions |
|---------|-----------|
| `src/services/api.ts` | fetchClients, createClient, updateClient, etc. |
| `src/contexts/DataContext.tsx` | addClient, updateClient, addMonthlyPayment, etc. |
| `src/pages/Dashboard.tsx` | handlePayment, handlePayTotal |
| `src/pages/AddClient.tsx` | onSubmit |
| `src/pages/AddRental.tsx` | handleSubmit |
| `src/pages/AddPayment.tsx` | handleSubmit |
| `src/pages/Clients.tsx` | View, Edit, Add Rental |
| `src/pages/ClientDetail.tsx` | handleArchive, handleBlacklist |
