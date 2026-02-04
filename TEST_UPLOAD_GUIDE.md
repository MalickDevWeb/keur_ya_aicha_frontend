# 🧪 Test Upload Complet

## Checklist de Vérification

### 1. **Configuration Vérifiée** ✅

```bash
✅ Cloudinary Cloud Name: djp423xyr
✅ Upload Preset: Unsigned (unsigned uploads allowed)
✅ API URL: http://localhost:4000 (JSON Server)
✅ Database: db.json avec données complètes
```

### 2. **Fonctionnalités Upload** ✅

**Types de Fichiers Supportés:**

- ✅ Images: JPG, PNG, GIF, WebP
- ✅ PDF: Documents & Contrats
- ✅ Documents: DOC, DOCX, XLSX, TXT

**Workflow Upload:**

1. ✅ Sélectionner client (liste)
2. ✅ Sélectionner location (liste)
3. ✅ Entrer nom document (texte)
4. ✅ Sélectionner type (Contrat/Reçu/Autre)
5. ✅ Choisir fichier (file input)
6. ✅ Cocher "Signé" (optional)
7. ✅ Cliquer "Importer Document"
8. ✅ Toast de succès/erreur

### 3. **Sécurité Implémentée** ✅

- ✅ Authentication: admin/admin123
- ✅ Session: sessionStorage (temporaire)
- ✅ Validation: Zod schemas
- ✅ CORS: Configured
- ✅ Error Handling: Complète
- ✅ File Validation: MIME type check
- ✅ Size Limit: 100 MB (Cloudinary)

---

## 🧪 Instructions de Test

### **Test 1: Upload Image**

```
1. Login avec admin/admin123
2. Aller à Documents
3. Sélectionner client: "Moussa Diallo"
4. Sélectionner location: "Appt 2 chambres Plateau"
5. Nom: "Photo Propriété"
6. Type: "📋 Contrat"
7. Choisir fichier: Sélectionner image (JPG/PNG)
8. Cocher "Signé"
9. Cliquer "Importer Document"
```

**Résultat Attendu:**

- ✅ Toast: "Document importé avec succès"
- ✅ Document apparaît dans la table
- ✅ Date d'upload correcte
- ✅ Type: "Contrat"
- ✅ Signé: ✓

### **Test 2: Upload PDF**

```
1. Aller à Documents
2. Sélectionner client: "Fatou Sow"
3. Sélectionner une location (si elle existe)
4. Nom: "Contrat Location"
5. Type: "📋 Contrat"
6. Choisir fichier: Sélectionner PDF
7. Cocher "Signé"
8. Cliquer "Importer Document"
```

**Résultat Attendu:**

- ✅ Toast: "Document importé avec succès"
- ✅ PDF téléchargeable
- ✅ URL valide (Cloudinary)

### **Test 3: Download Document**

```
1. Dans la table, trouver le document uploadé
2. Cliquer sur l'icône "Télécharger" (Download)
3. Fichier devrait se télécharger
```

**Résultat Attendu:**

- ✅ Fichier téléchargé localement
- ✅ Nom correct
- ✅ Format correct (PDF/JPG/etc)

### **Test 4: Delete Document**

```
1. Dans la table, trouver le document
2. Cliquer sur l'icône "Supprimer" (Trash)
3. Confirmer suppression
```

**Résultat Attendu:**

- ✅ Toast: "Document supprimé"
- ✅ Document disparaît de la table
- ✅ URL Cloudinary devient inaccessible

### **Test 5: Search Documents**

```
1. Aller à Documents
2. Dans la barre de recherche
3. Taper: "Moussa" (nom client)
4. Appuyer Enter
```

**Résultat Attendu:**

- ✅ Filtre résultats par client
- ✅ Affiche seulement documents de Moussa

### **Test 6: Filter par Type**

```
1. Aller à Documents
2. Scroller vers les Stats
3. Cliquer sur "Contrats" card
```

**Résultat Attendu:**

- ✅ Filtre affiche seulement contrats
- ✅ Reçus et autres disparaissent

---

## 🔍 Vérification des Données

### **db.json - Clients Disponibles**

```json
✅ client-1: Moussa Diallo (active)
   ├─ Rentals: 1
   │  └─ "Appt 2 chambres Plateau" (150000 FCFA/mois)
   └─ Documents: Vide (prêt pour upload)

✅ client-2: Fatou Sow (active)
   ├─ Rentals: Aucune
   └─ Documents: Aucuns

✅ Archived: 3 clients (Ahmadou Ba, Hawa Ndiaye, Cheikh Mbaye)

✅ Blacklisted: 3 clients (Ibrahima Sene, Dieynaba Toure, Ousmane Fall)
```

---

## 📊 Statut des Services

### **Services Actifs** ✅

```
✅ JSON Server: http://localhost:4000
   - Port: 4000
   - Database: db/db.json
   - Endpoints: /clients, /documents, /payments, /deposits

✅ Vite Dev Server: http://localhost:8082
   - Port: 8082
   - HMR: Enabled
   - React: Compiled

✅ Cloudinary API: cloud API
   - Cloud Name: djp423xyr
   - Upload URL: https://api.cloudinary.com/v1_1/djp423xyr/upload
   - Status: ✅ Active & Accessible
```

---

## ⚠️ Troubleshooting

### **Problème: Upload échoue**

```
Possible Causes:
1. ❌ Cloudinary unreachable
   → Vérifier: npm console pour erreurs
   → Fix: Vérifier connection internet

2. ❌ File trop volumineux (> 100MB)
   → Vérifier: Taille du fichier
   → Fix: Compresser image avant upload

3. ❌ Type MIME invalide
   → Vérifier: Extension du fichier
   → Fix: Utiliser JPG/PNG/PDF

4. ❌ SessionStorage expiré
   → Vérifier: Re-login
   → Fix: Utiliser admin/admin123 again
```

### **Problème: Document n'apparaît pas**

```
Solutions:
1. ✅ Recharger la page (F5)
2. ✅ Vérifier db.json (console DevTools)
3. ✅ Vérifier les logs API (console)
4. ✅ Vérifier client/location sélection
```

### **Problème: Lien téléchargement brisé**

```
Causes Possibles:
1. Document supprimé de Cloudinary
2. URL Cloudinary expirée
3. Format invalide sauvegardé

Fix:
1. Réuploader document
2. Vérifier URL dans db.json
3. Contacter support Cloudinary
```

---

## 🎯 Success Criteria

**Upload Fonctionne Si:**

- ✅ Images JPG/PNG uploadées avec succès
- ✅ PDF acceptés et téléchargeables
- ✅ Documents attachés à rental correct
- ✅ URL Cloudinary valide et accessible
- ✅ Toasts affichés (success/error)
- ✅ Deletion fonctionne
- ✅ Search filtre correctement
- ✅ No errors in console

---

## 📋 Rapide Checklist Finale

```
Frontend:
☑ App démarrée sans erreurs
☑ Login fonctionne
☑ Documents page accessible
☑ Client/Location selectors remplis
☑ File input fonctionne
☑ Upload button actif

Backend:
☑ JSON Server sur port 4000
☑ db.json a données clients
☑ Cloudinary credentials valides
☑ Network requests OK (F12)

Upload:
☑ Fichier sélectionné → OK
☑ Upload démarre (loader visible)
☑ Toast succès reçu
☑ Document dans table
☑ URL Cloudinary valide
☑ Téléchargement fonctionne
```

---

**Date**: 4 février 2026
**Status**: ✅ READY TO TEST
**Next**: Suivre les tests ci-dessus
