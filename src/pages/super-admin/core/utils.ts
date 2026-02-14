import type { AdminStatus } from '@/dto/frontend/responses'
import type { CreatedAdmin } from './types'
import { CREDENTIALS_SEPARATOR, CONTRACT_META } from './constants'

export const normalize = (value?: string) => String(value || '').trim().toLowerCase()

export const normalizePhone = (value: string) => value.replace(/\s/g, '')

export const formatPhoneForWhatsapp = (phone: string) => phone.replace(/[^\d+]/g, '')

export const formatLogDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('fr-FR')
}

export const getActionBadge = (action?: string) => {
  const key = String(action || '').toLowerCase()
  if (key.includes('create') || key.includes('ajout')) return 'bg-emerald-100 text-emerald-800'
  if (key.includes('update') || key.includes('edit') || key.includes('modif')) return 'bg-blue-100 text-blue-800'
  if (key.includes('delete') || key.includes('remove') || key.includes('supprim')) return 'bg-red-100 text-red-800'
  if (key.includes('login') || key.includes('auth')) return 'bg-slate-100 text-slate-800'
  return 'bg-muted text-muted-foreground'
}

export const buildCredentialsMessage = (data: CreatedAdmin, appUrl: string) => {
  const lines = [
    'FICHE CONTACT — ADMIN',
    CREDENTIALS_SEPARATOR,
    `Nom complet : ${data.name}`,
    `Username : ${data.username}`,
    `Mot de passe : ${data.password}`,
    `Email : ${data.email || '—'}`,
    `Entreprise : ${data.entreprise || '—'}`,
    `Téléphone : ${data.phone || '—'}`,
    `Créé le : ${new Date(data.createdAt).toLocaleString()}`,
    `Lien: ${appUrl}`,
    CREDENTIALS_SEPARATOR,
    'Connexion : utilisez ces identifiants pour accéder à l’espace admin.',
    'Conseil : changez le mot de passe après la première connexion.',
  ]
  return lines.join('\n')
}

export const loadLogoDataUrl = async () => {
  try {
    const response = await fetch('/logo.png')
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('logo_read_failed'))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export const createEntityId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

export const getAdminStatusActions = (status: AdminStatus) => {
  switch (status) {
    case 'ACTIF':
      return [
        { label: 'Suspendre', variant: 'secondary' as const, nextStatus: 'SUSPENDU' as const },
        { label: 'Blacklister', variant: 'destructive' as const, nextStatus: 'BLACKLISTE' as const },
        { label: 'Archiver', variant: 'outline' as const, nextStatus: 'ARCHIVE' as const },
      ]
    case 'SUSPENDU':
      return [
        { label: 'Activer', variant: 'default' as const, nextStatus: 'ACTIF' as const },
        { label: 'Blacklister', variant: 'destructive' as const, nextStatus: 'BLACKLISTE' as const },
        { label: 'Archiver', variant: 'outline' as const, nextStatus: 'ARCHIVE' as const },
      ]
    case 'BLACKLISTE':
      return [
        { label: 'Activer', variant: 'default' as const, nextStatus: 'ACTIF' as const },
        { label: 'Suspendre', variant: 'secondary' as const, nextStatus: 'SUSPENDU' as const },
        { label: 'Archiver', variant: 'outline' as const, nextStatus: 'ARCHIVE' as const },
      ]
    case 'ARCHIVE':
      return [
        { label: 'Activer', variant: 'default' as const, nextStatus: 'ACTIF' as const },
        { label: 'Suspendre', variant: 'secondary' as const, nextStatus: 'SUSPENDU' as const },
        { label: 'Blacklister', variant: 'destructive' as const, nextStatus: 'BLACKLISTE' as const },
      ]
    default:
      return []
  }
}

export const buildContractText = (adminName: string) => [
  'Entre les soussignés :',
  `${CONTRACT_META.companyName}, ${CONTRACT_META.companyAddress}, représentée par ${CONTRACT_META.representativeName},`,
  'ci-après dénommée "La Société",',
  '',
  'Et :',
  `${adminName}, ci-après dénommé(e) "L’Administrateur".`,
  '',
  'Article 1 — Objet',
  'Le présent contrat a pour objet de définir les conditions d’accès et d’utilisation de la plateforme de gestion locative par L’Administrateur.',
  '',
  'Article 2 — Accès et identifiants',
  'L’Administrateur reçoit des identifiants personnels et s’engage à les conserver de manière confidentielle.',
  '',
  'Article 3 — Obligations',
  'L’Administrateur s’engage à utiliser la plateforme conformément aux lois en vigueur, à respecter la confidentialité des données et à signaler toute activité suspecte.',
  '',
  'Article 4 — Durée',
  `Le présent contrat est conclu pour une durée de ${CONTRACT_META.duration} à compter de la date de signature.`,
  '',
  'Article 5 — Résiliation',
  'La Société se réserve le droit de suspendre ou résilier l’accès en cas de non-respect des présentes conditions.',
  '',
  'Article 6 — Confidentialité',
  'Les parties s’engagent à préserver la confidentialité des informations et données traitées.',
]
