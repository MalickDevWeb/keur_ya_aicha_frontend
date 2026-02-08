per# Cloudinary - Upload Photos et PDF

## 📋 Vue d'ensemble

Ce document décrit la configuration et l'utilisation du système d'upload de fichiers (photos, PDF) via Cloudinary.

## ⚙️ Configuration

### Variables d'Environnement

| Variable                        | Valeur            | Description                 |
| ------------------------------- | ----------------- | --------------------------- |
| `VITE_CLOUDINARY_CLOUD_NAME`    | `djp423xyr`       | Nom du compte Cloudinary    |
| `VITE_CLOUDINARY_API_KEY`       | `858647214159638` | Clé API publique            |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `Unsigned`        | Preset d'upload (non-signé) |

### Fichiers de Configuration

- **Frontend**: [`.env`](../.env)
- **Server**: [`server/.env`](../server/.env)

## 🚀 Utilisation

### Via le Hook `useCloudinaryUpload`

```tsx
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload'

function DocumentUpload() {
  const { upload, isUploading, progress, error } = useCloudinaryUpload()

  const handleFileSelect = async (file: File) => {
    const result = await upload(file, {
      folder: 'kya/documents',
      resource_type: 'auto',
    })

    if (result) {
      console.log('URL du fichier:', result.url)
      // Enregistrer dans la base de données
    }
  }

  return (
    <input
      type="file"
      accept="image/*,.pdf"
      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
    />
  )
}
```

### Via le Service Cloudinary

```ts
import { uploadToCloudinary } from '../services/cloudinary'

// Upload simple
const result = await uploadToCloudinary(file)

// Upload avec options
const result = await uploadToCloudinary(file, {
  folder: 'kya/clients',
  public_id: 'cni-scan',
  resource_type: 'image',
})
```

## 📁 Types de Fichiers Supportés

| Type          | MIME Types        | Extensions                     |
| ------------- | ----------------- | ------------------------------ |
| **Images**    | `image/*`         | .jpg, .jpeg, .png, .gif, .webp |
| **PDF**       | `application/pdf` | .pdf                           |
| **Documents** | `application/*`   | .doc, .docx                    |

## 📤 Options d'Upload

```ts
interface UploadOptions {
  folder?: string // Dossier de stockage (ex: 'kya/clients')
  resource_type?: 'image' | 'video' | 'raw' | 'auto'
  public_id?: string // Nom personnalisé du fichier
  tags?: string[] // Tags pour organisation
}
```

### Exemples

```ts
// Photo de profil client
await uploadToCloudinary(file, {
  folder: 'kya/clients',
  resource_type: 'image',
})

// Scan CNI
await uploadToCloudinary(file, {
  folder: 'kya/documents/cni',
  public_id: `${clientId}-cni`,
})

// Contrat de bail (PDF)
await uploadToCloudinary(file, {
  folder: 'kya/contracts',
  resource_type: 'raw',
})
```

## 🔧 Implémentation Technique

### Service d'Upload

Emplacement: [`src/services/cloudinary.ts`](../src/services/cloudinary.ts)

```ts
// URL de l'API Cloudinary
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/djp423xyr'

export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryResult | null> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'Unsigned')
  formData.append('folder', options.folder || 'kya/uploads')

  if (options.public_id) {
    formData.append('public_id', options.public_id)
  }

  try {
    const response = await fetch(`${CLOUDINARY_URL}/${options.resource_type || 'image'}/upload`, {
      method: 'POST',
      body: formData,
    })

    return await response.json()
  } catch (error) {
    console.error('Upload failed:', error)
    return null
  }
}
```

### Hook Personnalisé

Emplacement: [`src/hooks/useCloudinaryUpload.ts`](../src/hooks/useCloudinaryUpload.ts)

```ts
export function useCloudinaryUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File, options?: UploadOptions): Promise<CloudinaryResult | null> => {
    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      const result = await uploadToCloudinary(file, options)

      if (result) {
        console.log('✅ Upload réussi:', result.url)
        return result
      }

      setError("Échec de l'upload")
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return { upload, isUploading, progress, error }
}
```

## 🧪 Tests

### Test Manuel

```bash
# Vérifier la configuration
node test-cloudinary.mjs

# Tester l'upload
node test-document-upload.mjs
```

### Scénarios de Test

1. **Upload d'image** (.jpg, .png)
2. **Upload de PDF** (.pdf)
3. **Upload de gros fichiers** (> 5MB)
4. **Vérification URL** après upload
5. **Suppression** de fichier uploadé

## 📊 Structure des Données

### DocumentDTO

```ts
interface DocumentDTO {
  id: string
  clientId: string
  rentalId?: string
  name: string
  type: 'cni' | 'contract' | 'photo' | 'other'
  url: string // URL Cloudinary
  publicId: string // ID Cloudinary pour suppression
  uploadedAt: string
  size: number
}
```

## 🐛 Dépannage

### Erreurs Courantes

| Erreur                    | Cause                        | Solution                                               |
| ------------------------- | ---------------------------- | ------------------------------------------------------ |
| `Upload preset not found` | preset "Unsigned" inexistant | Vérifier dans Cloudinary Dashboard → Settings → Upload |
| `Signature invalid`       | Clé API secrète incorrecte   | Vérifier `server/.env`                                 |
| `Network error`           | Problème de connexion        | Vérifier la connexion internet                         |
| `File too large`          | Fichier > 10MB               | Réduire la taille du fichier                           |

### Vérifier la Configuration

1. Aller sur [Cloudinary Dashboard](https://cloudinary.com/console)
2. Vérifier **Settings → Upload**
3. Confirmer que le preset "Unsigned" existe
4. Vérifier les **Allowed formats**

### Debug Avancé

```bash
# Tester l'upload avec curl
curl -X POST \
  -F "file=@test-image.jpg" \
  -F "upload_preset=Unsigned" \
  "https://api.cloudinary.com/v1_1/djp423xyr/image/upload"
```

## 🔐 Sécurité

- **Unsigned uploads**: Limité aux fichiers publics
- **Pas de clés secrètes** côté client (risque de sécurité)
- **Validation**: Vérifier le type MIME avant upload
- **Taille**: Limiter à 10MB maximum

## 📝 Bonnes Pratiques

1. **Organisation des dossiers**:
   - `kya/clients/{clientId}/photos`
   - `kya/clients/{clientId}/documents`
   - `kya/contracts`

2. **Nommage**:
   - Utiliser `public_id` pour les noms cohérents
   - Éviter les caractères spéciaux

3. **Métadonnées**:
   - Ajouter des `tags` pour la recherche
   - Stocker le `resource_type` correctement

## 🔗 Liens Utiles

- [Cloudinary Dashboard](https://cloudinary.com/console)
- [Documentation Upload](https://cloudinary.com/documentation/upload_options)
- [API Reference](https://cloudinary.com/documentation/api_reference)
