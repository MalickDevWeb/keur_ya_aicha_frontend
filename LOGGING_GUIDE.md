# 🔍 Guide de Débogage avec les Logs Console

## Vue d'ensemble

L'application a maintenant un système de logging complet avec des emojis et des contextes pour vous aider à déboguer et comprendre le flux des opérations.

## 📊 Codes Emojis

| Emoji | Signification | Contexte                                     |
| ----- | ------------- | -------------------------------------------- |
| 🟦    | DataContext   | Opération d'initialisation/mount du contexte |
| 🔄    | Reload        | Rechargement des données depuis l'API        |
| 📡    | API           | Appel API (requête initiée)                  |
| 🟢    | Handler       | Début d'un handler/action utilisateur        |
| 🟩    | Async Op      | Opération asynchrone en cours                |
| 🔵    | Click         | Action utilisateur (clic sur un bouton)      |
| 👁️    | View          | Navigation/affichage de détails              |
| ✏️    | Edit          | Modification d'une entité                    |
| 🏠    | Rental        | Action liée aux locations                    |
| 📦    | Archive       | Archivage d'un client                        |
| 🚫    | Blacklist     | Mise en liste noire d'un client              |
| ✅    | Success       | Opération réussie                            |
| ❌    | Error         | Erreur ou échec                              |
| ⚠️    | Warning       | Avertissement/information importante         |

## 🎯 Scénarios de Test

### 1. Test: Créer un Client

**Étapes:**

1. Ouvrir l'app: http://localhost:8085
2. Ouvrir DevTools: `F12` → Onglet **Console**
3. Aller à "Ajouter Client"
4. Remplir le formulaire:
   - Nom: `Diallo`
   - Prénom: `Amadou`
   - Téléphone: `221 77 123 4567`
   - CNI: `123456789`
   - Propriété: `Appartement B5`
   - Loyer: `150000`
   - Caution: `300000`
5. Cliquer "Créer"

**Logs attendus dans la console:**

```
🔵 [AddClient] onSubmit clicked with form data: {...}
🟦 [DataContext] addClient called: {...}
🟦 [DataContext] Creating client with payload: {...}
🟦 [DataContext] Serialized payload: {...}
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

### 2. Test: Enregistrer un Paiement (Principal)

**Étapes:**

1. Aller au Dashboard
2. Ouvrir DevTools: `F12` → Onglet **Console**
3. Trouver "Amadou Diallo - Appartement A1" (150,000 FCFA dû)
4. Cliquer "Payer"
5. Cliquer "Payer le total"

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
🔵 [Dashboard] Found payment object: {
  id: "pay-2",
  rentalId: "client-1-rental-0",
  status: "unpaid",
  amount: 150000,
  ...
}
🔵 [Dashboard] Payment modal opened
[User clicks "Payer le total"]
🟢 [Dashboard] handlePayTotal clicked
🟢 [Dashboard] Paying total: {
  rentalId: "client-1-rental-0",
  paymentId: "pay-2",
  amount: 150000
}
🟩 [DataContext] addMonthlyPayment called: {
  rentalId: "client-1-rental-0",
  paymentId: "pay-2",
  amount: 150000
}
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

### 3. Test: Voir Détails Client

**Étapes:**

1. Aller à "Clients"
2. Cliquer sur l'icône "Voir" (eye) pour un client
3. Vérifier les logs

**Logs attendus:**

```
👁️ [Clients] View client details: {
  clientId: "client-1",
  clientName: "Amadou Diallo"
}
```

### 4. Test: Ajouter une Location

**Étapes:**

1. Aller à "Clients"
2. Cliquer sur l'icône "Maison" pour ajouter location
3. Remplir le formulaire
4. Cliquer "Ajouter Location"

**Logs attendus:**

```
🔵 [AddRental] handleSubmit clicked with data: {...}
🟢 [AddRental] Adding rental for client: {
  clientId: "...",
  rentalData: {...}
}
🟦 [DataContext] addRental called: {...}  [NOT YET - à implémenter]
✅ [AddRental] Rental added successfully
```

### 5. Test: Archiver un Client

**Étapes:**

1. Aller à "Clients"
2. Cliquer sur un client pour voir les détails
3. Cliquer "Archiver"

**Logs attendus:**

```
📦 [ClientDetail] Archiving client: {
  clientId: "...",
  clientName: "..."
}
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

### 6. Test: Mettre en Liste Noire

**Étapes:**

1. Aller à "Clients" > "Voir Détails"
2. Cliquer "Blacklist"

**Logs attendus:**

```
🚫 [ClientDetail] Blacklisting client: {
  clientId: "...",
  clientName: "..."
}
[Similaire au test d'archivage avec status: "blacklisted"]
```

## 🔧 Dépannage

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

### Paiement enregistré mais pas mis à jour?

- Vérifiez le status dans la console: "paid" ou "unpaid"?
- Vérifiez paidAmount dans db.json: augmenté de 150000?
- Vérifiez que reloadClients s'est complété (✅ log)

## 📝 Structure des Logs

Chaque log suit ce format:

```
[EMOJI] [CONTEXT] Message: {details}
```

Exemples:

- `🟦 [DataContext] addClient called: {firstName, lastName, ...}`
- `✅ [API] Payment recorded: {id, amount, ...}`
- `❌ [Dashboard] Erreur lors du paiement: Error message`

## 🎨 Couleurs Console (DevTools)

- 🟦 Bleu → DataContext (état d'application)
- 🟢 Vert → Handler/Success démarré
- 🟩 Vert foncé → Opération asynchrone
- 📡 Réseau → Appel API
- ❌ Rouge → Erreur
- ✅ Vert → Succès confirmé

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

## 🚀 Prochaines Étapes

Après avoir validé les tests:

1. ✅ Vérifier que tous les logs apparaissent
2. ✅ Vérifier que les opérations réussissent (✅ logs)
3. ✅ Vérifier que db.json est mis à jour
4. ✅ Vérifier que l'UI se rafraîchit correctement
5. Si erreurs ❌: Partager les logs complets avec le développeur
