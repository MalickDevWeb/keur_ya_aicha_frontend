# Règles de Validation Frontend

## 📋 Vue d'ensemble

Toutes les validations critiques sont désormais effectuées côté frontend avant soumission. Cela garantit que les données invalides ne peuvent pas être envoyées au serveur.

---

## 👤 Informations Personnelles (Clients)

### Nom (lastName)

- ✅ **Obligatoire** : Le champ ne peut pas être vide
- ✅ **Longueur** : Minimum 2 caractères, maximum 50
- ✅ **Format** : Lettres uniquement (pas de chiffres)
- ✅ **Accents** : Support des lettres accentuées (é, è, ê, etc.)
- ❌ Exemples invalides :
  - `A` (1 caractère)
  - `Ali123` (contient des chiffres)
  - `123456` (que des chiffres)

### Prénom (firstName)

- ✅ **Obligatoire** : Le champ ne peut pas être vide
- ✅ **Longueur** : Minimum 2 caractères, maximum 50
- ✅ **Format** : Lettres uniquement (pas de chiffres)
- ✅ **Accents** : Support des lettres accentuées
- ❌ Exemples invalides : Mêmes règles que le nom

### Numéro de téléphone (phone)

- ✅ **Obligatoire** : Le champ ne peut pas être vide
- ✅ **Formats acceptés** :
  - `+221 77 123 45 67` (format standard avec espacements)
  - `+22177123456` (sans espacements)
  - `77123456` (sans préfixe pays)
  - `771234567` (9 chiffres)
- ✅ **Opérateurs** : Commencent par 77 ou 78 (Sentel, Orange, Free)
- ✅ **Longueur totale** : 9 chiffres après le préfixe
- ❌ Exemples invalides :
  - `701234567` (opérateur non sénégalais)
  - `7712345` (trop court)
  - `+2217712345678` (trop long)

### CNI (Carte Nationale d'Identité)

- ✅ **Obligatoire** : Le champ ne peut pas être vide
- ✅ **Format** : Exactement 13 chiffres uniquement
- ✅ **Exemple** : `1234567890123`
- ❌ Exemples invalides :
  - `12345678` (12 caractères)
  - `12345678901234` (14 caractères)
  - `BA123456789CD` (lettres)
  - `123-456-789-0123` (caractères spéciaux)

---

## 🏠 Informations de Location/Bien

### Nom du bien (propertyName)

- ✅ **Obligatoire** : Le champ ne peut pas être vide
- ✅ **Longueur** : Minimum 1 caractère, maximum 100
- ✅ **Format** : Lettres, chiffres, tirets, apostrophes, slashes
- ❌ Exemples invalides :
  - `` (champ vide)
  - `Apt@456` (caractères spéciaux interdits)

### Type de bien (propertyType)

- ✅ **Obligatoire** : Doit sélectionner une option
- ✅ **Options valides** :
  - `studio`
  - `room` (chambre)
  - `apartment` (appartement)
  - `villa`
  - `other` (autre)

### Date de début (startDate)

- ✅ **Obligatoire** : La date ne peut pas être vide
- ✅ **Format** : Date valide (YYYY-MM-DD)
- ❌ Exemples invalides :
  - `` (vide)
  - `32/13/2024` (date inexistante)

### Loyer mensuel (monthlyRent)

- ✅ **Obligatoire** : Le champ ne peut pas être vide
- ✅ **Montant** : Minimum 1000 FCFA
- ✅ **Maximum** : 100 000 000 FCFA
- ✅ **Type** : Nombre positif uniquement
- ❌ Exemples invalides :
  - `` (vide)
  - `-50000` (négatif)
  - `0` (zéro)
  - `abc` (non numérique)

### Caution totale (depositTotal)

- ✅ **Obligatoire** : Le champ ne peut pas être vide
- ✅ **Montant** : Minimum 0, maximum 100 000 000 FCFA
- ✅ **Type** : Nombre positif ou zéro
- ❌ Exemples invalides :
  - `-100000` (négatif)
  - `abc` (non numérique)

### Caution payée (depositPaid)

- ✅ **Obligatoire** : Le champ ne peut pas être vide
- ✅ **Montant** : Minimum 0, maximum 100 000 000 FCFA
- ✅ **Validations croisées** : **Doit être ≤ caution totale**
- ❌ Exemples invalides :
  - `-50000` (négatif)
  - `300000` (si total = 200000)

---

## 💳 Informations de Paiement

### Montant du paiement (amount)

- ✅ **Obligatoire** : Le champ ne peut pas être vide
- ✅ **Montant** : Supérieur à 0
- ✅ **Maximum** : 100 000 000 FCFA
- ✅ **Type** : Nombre positif uniquement
- ❌ Exemples invalides :
  - `` (vide)
  - `0` (zéro)
  - `-50000` (négatif)

### Date du paiement (date)

- ✅ **Obligatoire** : La date ne peut pas être vide
- ✅ **Format** : Date valide (YYYY-MM-DD)
- ❌ Exemples invalides :
  - `` (vide)
  - `31/02/2024` (date inexistante)

### Numéro de reçu (receiptNumber)

- ✅ **Optionnel** : Peut être vide
- ✅ **Format** : Alphanumériques, tirets, slashes uniquement
- ✅ **Exemple** : `REC-2024-001`, `DEP/2024/01`
- ❌ Exemples invalides :
  - `REC@2024` (caractères spéciaux interdits)

### Notes (notes)

- ✅ **Optionnel** : Peut être vide
- ✅ **Longueur maximum** : 500 caractères
- ❌ Exemples invalides :
  - Notes de plus de 500 caractères

---

## 🛡️ Validations Spéciales

### Validations Croisées

1. **Caution payée vs Caution totale**
   - `depositPaid ≤ depositTotal`
   - Erreur si non respecté

2. **Montant vs Max Amount** (dans les modales)
   - `amount ≤ maxAmount`
   - Empêche le surpaiement

---

## 🎯 Champs Obligatoires par Formulaire

### Ajouter un Client

| Champ        | Obligatoire | Validations                         |
| ------------ | ----------- | ----------------------------------- |
| lastName     | ✅ Oui      | Lettres uniquement, 2-50 caractères |
| firstName    | ✅ Oui      | Lettres uniquement, 2-50 caractères |
| phone        | ✅ Oui      | Format sénégalais valide            |
| cni          | ✅ Oui      | 13 chiffres uniquement              |
| propertyType | ✅ Oui      | Enum valide                         |
| propertyName | ✅ Oui      | 1-100 caractères                    |
| startDate    | ✅ Oui      | Date valide                         |
| monthlyRent  | ✅ Oui      | Nombre > 0, < 100M                  |
| totalDeposit | ✅ Oui      | Nombre ≥ 0, < 100M                  |
| paidDeposit  | ✅ Oui      | Nombre ≥ 0, ≤ totalDeposit          |

### Ajouter une Location

| Champ        | Obligatoire | Validations        |
| ------------ | ----------- | ------------------ |
| propertyName | ✅ Oui      | 1-100 caractères   |
| propertyType | ✅ Oui      | Enum valide        |
| monthlyRent  | ✅ Oui      | Nombre > 0, < 100M |
| depositTotal | ✅ Oui      | Nombre ≥ 0, < 100M |
| startDate    | ✅ Oui      | Date valide        |

### Ajouter un Paiement

| Champ         | Obligatoire | Validations               |
| ------------- | ----------- | ------------------------- |
| rentalId      | ✅ Oui      | Sélection requise         |
| amount        | ✅ Oui      | Nombre > 0, < 100M        |
| date          | ✅ Oui      | Date valide               |
| receiptNumber | ❌ Non      | Alphanumériques seulement |
| notes         | ❌ Non      | Max 500 caractères        |

---

## 🚀 Messages d'Erreur Améliorés

Les messages d'erreur sont désormais clairs et utiles :

```
❌ "Le nom doit contenir au moins 2 lettres (pas de chiffres)"
❌ "Numéro sénégalais invalide. Format: +221 77 123 45 67"
❌ "La CNI doit contenir exactement 13 chiffres"
❌ "La caution payée ne peut pas dépasser la caution totale"
❌ "Le montant doit être un nombre positif"
```

---

## 📝 Fichiers Modifiés

1. **src/validators/clientValidator.ts** - Schémas de validation centralisés
2. **src/pages/AddClient.tsx** - Validation complète lors de l'ajout d'un client
3. **src/pages/AddRental.tsx** - Validation lors de l'ajout d'une location
4. **src/pages/AddPayment.tsx** - Validation lors de l'ajout d'un paiement
5. **src/components/DepositModal.tsx** - Validation dans la modale caution
6. **src/components/PaymentModal.tsx** - Validation dans la modale paiement

---

## 💡 Notes Importantes

- ✅ Toutes les validations sont effectuées en **temps réel** dans le formulaire
- ✅ Les messages d'erreur apparaissent au niveau du champ
- ✅ L'utilisateur ne peut pas soumettre un formulaire invalide
- ✅ Les données sont formatées automatiquement quand possible (ex: numéro de téléphone)
- ✅ Support complet des accents et caractères spéciaux valides
