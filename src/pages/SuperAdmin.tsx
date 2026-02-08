import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/layouts/MainLayout'
import { CardStat } from '@/components/CardStat'
import { Building2, Shield, Users } from 'lucide-react'
import { ResponsiveContainer, Pie, PieChart, Cell, Tooltip, Legend } from 'recharts'
import { jsPDF } from 'jspdf'
import {
  AdminDTO,
  AdminRequestDTO,
  AdminStatus,
  ADMIN_STATUS_COLORS,
  ADMIN_STATUS_LABELS,
  AuditLogDTO,
  EntrepriseDTO,
  UserDTO,
  createAdmin,
  createEntreprise,
  createUser,
  fetchClients,
  fetchAdminRequests,
  fetchAdmins,
  fetchAuditLogs,
  fetchEntreprises,
  fetchUsers,
  updateAdmin,
  updateAdminRequest,
} from '@/services/api'

export default function SuperAdminPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  if (!user) return <SuperAdminLogin />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <SuperAdminDashboard />
    </MainLayout>
  )
}

function SuperAdminLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const ok = await login(username, password)
      if (!ok) {
        setError('Identifiants invalides')
        return
      }
      navigate('/pmt/admin', { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950/5 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Super Admin — Connexion</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium">Identifiant</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="superadmin" />
            </div>
            <div>
              <label className="text-sm font-medium">Mot de passe</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="superadmin123"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function ForbiddenMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950/5 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>🚫 Accès interdit – réservé au Super Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas les autorisations nécessaires pour accéder à cette zone.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function SuperAdminDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newEntreprise, setNewEntreprise] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [createdAdmin, setCreatedAdmin] = useState<{
    name: string
    username: string
    email?: string
    entreprise?: string
    password: string
    phone?: string
    createdAt: string
  } | null>(null)
  const defaultContractMeta = {
    companyName: 'Keur Ya Aicha',
    companyAddress: 'Petit Mboa, Dakar',
    representativeName: 'Super Admin',
    signatureCity: 'Petit Mboa',
    duration: '12 mois, renouvelable',
  }
  const [admins, setAdmins] = useState<AdminDTO[]>([])
  const [requests, setRequests] = useState<AdminRequestDTO[]>([])
  const [entreprises, setEntreprises] = useState<EntrepriseDTO[]>([])
  const [users, setUsers] = useState<UserDTO[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogDTO[]>([])
  const [logSearch, setLogSearch] = useState('')
  const [logFilter, setLogFilter] = useState('all')
  const [showAllLogs, setShowAllLogs] = useState(false)
  const [approveErrors, setApproveErrors] = useState<Record<string, string>>({})
  const [editingUsernames, setEditingUsernames] = useState<Record<string, string>>({})
  const [savingUsernameId, setSavingUsernameId] = useState<string | null>(null)
  const [pendingSearch, setPendingSearch] = useState('')
  const [pendingOnlyEntreprise, setPendingOnlyEntreprise] = useState(false)
  const [showAllPending, setShowAllPending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adminSearch, setAdminSearch] = useState('')
  const [paymentStats, setPaymentStats] = useState({ paid: 0, unpaid: 0, partial: 0 })

  const pendingRequests = useMemo(() => {
    const needle = pendingSearch.trim().toLowerCase()
    let list = requests.filter((r) => {
      if (r.status !== 'EN_ATTENTE') return false
      if (!needle) return true
      const name = String(r.name || '').toLowerCase()
      const username = String(r.username || '').toLowerCase()
      const email = String(r.email || '').toLowerCase()
      const phone = String(r.phone || '').toLowerCase()
      const entreprise = String(r.entrepriseName || '').toLowerCase()
      return (
        name.includes(needle) ||
        username.includes(needle) ||
        email.includes(needle) ||
        phone.includes(needle) ||
        entreprise.includes(needle)
      )
    })
    if (pendingOnlyEntreprise) {
      list = list.filter((r) => String(r.entrepriseName || '').trim().length > 0)
    }
    return list
  }, [requests, pendingSearch, pendingOnlyEntreprise])

  const visiblePending = showAllPending ? pendingRequests : pendingRequests.slice(0, 5)

  const totalPayments = paymentStats.paid + paymentStats.unpaid + paymentStats.partial

  const paymentDistribution = useMemo(() => {
    return [
      { name: 'Payées', value: paymentStats.paid },
      { name: 'Non payées', value: paymentStats.unpaid },
      { name: 'Partielles', value: paymentStats.partial },
    ]
  }, [paymentStats])

  const pieColors = ['#0ea5e9', '#ef4444', '#f97316']
  const formatLogDate = (value?: string) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('fr-FR')
  }
  const getActionBadge = (action?: string) => {
    const key = String(action || '').toLowerCase()
    if (key.includes('create') || key.includes('ajout')) return 'bg-emerald-100 text-emerald-800'
    if (key.includes('update') || key.includes('edit') || key.includes('modif')) return 'bg-blue-100 text-blue-800'
    if (key.includes('delete') || key.includes('remove') || key.includes('supprim')) return 'bg-red-100 text-red-800'
    if (key.includes('login') || key.includes('auth')) return 'bg-slate-100 text-slate-800'
    return 'bg-muted text-muted-foreground'
  }
  const filteredLogs = useMemo(() => {
    const needle = logSearch.trim().toLowerCase()
    let list = auditLogs
    if (logFilter !== 'all') {
      list = list.filter((l) => String(l.action || '').toLowerCase().includes(logFilter))
    }
    if (!needle) return list
    return list.filter((l) => {
      const hay = [
        l.actor,
        l.action,
        l.targetType,
        l.targetId,
        l.message,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(needle)
    })
  }, [auditLogs, logSearch, logFilter])
  const visibleLogs = showAllLogs ? filteredLogs : filteredLogs.slice(0, 10)

  const refresh = async () => {
    setLoading(true)
    try {
      const [adminsData, requestsData, entreprisesData, usersData, clientsData, logsData] = await Promise.all([
        fetchAdmins(),
        fetchAdminRequests(),
        fetchEntreprises(),
        fetchUsers(),
        fetchClients(),
        fetchAuditLogs(),
      ])
      setAdmins(adminsData)
      setRequests(requestsData)
      setEntreprises(entreprisesData)
      setUsers(usersData)
      setAuditLogs(logsData)
      const stats = { paid: 0, unpaid: 0, partial: 0 }
      clientsData.forEach((client: any) => {
        if (client?.status === 'archived' || client?.status === 'blacklisted') return
        ;(client?.rentals || []).forEach((rental: any) => {
          ;(rental?.payments || []).forEach((payment: any) => {
            if (payment?.status === 'paid') stats.paid += 1
            else if (payment?.status === 'partial') stats.partial += 1
            else stats.unpaid += 1
          })
        })
      })
      setPaymentStats(stats)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      if (!hash) return
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const approveRequest = async (req: AdminRequestDTO) => {
    if (!req.entrepriseName || !req.entrepriseName.trim()) {
      setApproveErrors((prev) => ({ ...prev, [req.id]: "Entreprise obligatoire pour valider la demande." }))
      return
    }

    // Refresh data to ensure we have the latest
    await refresh()

    // Check if user/admin already exists to prevent 409 Conflict
    const normalize = (val: string) => val.trim().toLowerCase()
    const effectiveUsername = editingUsernames[req.id]?.trim() || req.username
    const usernameNorm = normalize(effectiveUsername)
    const emailNorm = normalize(req.email || '')
    const phoneNorm = (req.phone || '').replace(/\s/g, '')

    // Check admins, users, AND other pending requests for duplicate username
    const usernameExists =
      admins.some((a) => normalize(a.username) === usernameNorm) ||
      requests.some((r) => normalize(r.username) === usernameNorm && r.id !== req.id) ||
      users.some((u) => normalize(u.username) === usernameNorm)
    if (usernameExists) {
      setApproveErrors((prev) => ({ ...prev, [req.id]: "Nom d'utilisateur déjà utilisé." }))
      return
    }

    // Nom complet peut être identique (pas de contrainte d'unicité)

    if (emailNorm) {
      const emailExists =
        admins.some((a) => normalize(a.email || '') === emailNorm) ||
        users.some((u) => normalize(u.email || '') === emailNorm) ||
        requests.some((r) => normalize(r.email || '') === emailNorm && r.id !== req.id)
      if (emailExists) {
        setApproveErrors((prev) => ({ ...prev, [req.id]: "Email déjà utilisé." }))
        return
      }
    }

    if (phoneNorm) {
      const phoneExists = users.some((u) => (u.phone || '').replace(/\s/g, '') === phoneNorm)
      if (phoneExists) {
        setApproveErrors((prev) => ({ ...prev, [req.id]: "Téléphone déjà utilisé." }))
        return
      }
    }

    const createdAt = new Date().toISOString()
    const userId = `user-${Math.random().toString(36).slice(2, 10)}`
    const adminId = `admin-${Math.random().toString(36).slice(2, 10)}`
    const entrepriseId = `ent-${Math.random().toString(36).slice(2, 10)}`

    try {
      setApproveErrors((prev) => ({ ...prev, [req.id]: '' }))
      await createUser({
        id: userId,
        username: effectiveUsername,
        password: 'admin123',
        name: req.name,
        email: req.email || '',
        role: 'ADMIN',
        status: 'ACTIF',
        createdAt,
      })
      await createAdmin({
        id: adminId,
        userId,
        username: effectiveUsername,
        name: req.name,
        email: req.email || '',
        status: 'ACTIF',
        entrepriseId,
        createdAt,
      })
      if (req.entrepriseName) {
        await createEntreprise({
          id: entrepriseId,
          name: req.entrepriseName,
          adminId,
          createdAt,
        })
      }
      await updateAdminRequest(req.id, { status: 'ACTIF' })
      await refresh()
    } catch (err: any) {
      setApproveErrors((prev) => ({
        ...prev,
        [req.id]: err?.message || "Impossible de valider la demande. Vérifie les doublons.",
      }))
    }
  }

  const saveUsername = async (req: AdminRequestDTO) => {
    const raw = editingUsernames[req.id]
    const nextValue = raw?.trim()
    if (!nextValue) {
      setApproveErrors((prev) => ({ ...prev, [req.id]: "Nom d'utilisateur obligatoire." }))
      return
    }
    setSavingUsernameId(req.id)
    try {
      const updated = await updateAdminRequest(req.id, { username: nextValue })
      setRequests((prev) => prev.map((r) => (r.id === req.id ? updated : r)))
      setApproveErrors((prev) => ({ ...prev, [req.id]: '' }))
    } catch (err: any) {
      setApproveErrors((prev) => ({
        ...prev,
        [req.id]: err?.message || "Impossible de modifier le nom d'utilisateur.",
      }))
    } finally {
      setSavingUsernameId(null)
    }
  }

  const createAdminDirect = async () => {
    if (!newUsername.trim() || !newName.trim()) {
      setCreateError("Nom d'utilisateur et nom complet requis.")
      return
    }
    if (!newEntreprise.trim()) {
      setCreateError("Entreprise obligatoire.")
      return
    }
    setCreateError('')
    setCreating(true)
    const createdAt = new Date().toISOString()
    const userId = `user-${Math.random().toString(36).slice(2, 10)}`
    const adminId = `admin-${Math.random().toString(36).slice(2, 10)}`
    const entrepriseId = `ent-${Math.random().toString(36).slice(2, 10)}`

    try {
      const normalize = (val: string) => val.trim().toLowerCase()
      const usernameNorm = normalize(newUsername)
      const nameNorm = normalize(newName)
      const entrepriseNorm = normalize(newEntreprise)
      const phoneNorm = newPhone.replace(/\s/g, '')

      const usernameExists =
        admins.some((a) => normalize(a.username) === usernameNorm) ||
        requests.some((r) => normalize(r.username) === usernameNorm) ||
        users.some((u) => normalize(u.username) === usernameNorm)
      if (usernameExists) {
        setCreateError("Ce nom d'utilisateur existe déjà.")
        return
      }

      const nameExists =
        admins.some((a) => normalize(a.name) === nameNorm) ||
        users.some((u) => normalize(u.name) === nameNorm)
      if (nameExists) {
        setCreateError('Un admin avec ce nom existe déjà.')
        return
      }

      if (entrepriseNorm) {
        const entrepriseExists = entreprises.some((e) => normalize(e.name) === entrepriseNorm)
        if (entrepriseExists) {
          setCreateError('Cette entreprise existe déjà.')
          return
        }
      }

      if (phoneNorm) {
        const phoneExists = users.some((u) => (u.phone || '').replace(/\s/g, '') === phoneNorm)
        if (phoneExists) {
          setCreateError('Ce numéro existe déjà.')
          return
        }
      }

      const password = newPassword.trim() || 'admin123'
      await createUser({
        id: userId,
        username: newUsername.trim(),
        password,
        name: newName.trim(),
        email: newEmail.trim() || '',
        phone: newPhone.trim() || '',
        role: 'ADMIN',
        status: 'ACTIF',
        createdAt,
      })
      await createAdmin({
        id: adminId,
        userId,
        username: newUsername.trim(),
        name: newName.trim(),
        email: newEmail.trim() || '',
        status: 'ACTIF',
        entrepriseId: newEntreprise.trim() ? entrepriseId : '',
        createdAt,
      })
      if (newEntreprise.trim()) {
        await createEntreprise({
          id: entrepriseId,
          name: newEntreprise.trim(),
          adminId,
          createdAt,
        })
      }
      setCreatedAdmin({
        name: newName.trim(),
        username: newUsername.trim(),
        email: newEmail.trim() || undefined,
        entreprise: newEntreprise.trim() || undefined,
        password,
        phone: newPhone.trim() || undefined,
        createdAt,
      })
      setNewUsername('')
      setNewName('')
      setNewEmail('')
      setNewEntreprise('')
      setNewPassword('')
      setNewPhone('')
      refresh()
    } finally {
      setCreating(false)
    }
  }

  const formatPhone = (phone: string) => phone.replace(/[^\d+]/g, '')

  const buildCredentialsMessage = (data: NonNullable<typeof createdAdmin>) => {
    const appUrl = `${window.location.origin}/login`
    const lines = [
      'FICHE CONTACT — ADMIN',
      '--------------------------------',
      `Nom complet : ${data.name}`,
      `Username : ${data.username}`,
      `Mot de passe : ${data.password}`,
      `Email : ${data.email || '—'}`,
      `Entreprise : ${data.entreprise || '—'}`,
      `Téléphone : ${data.phone || '—'}`,
      `Créé le : ${new Date(data.createdAt).toLocaleString()}`,
      `Lien: ${appUrl}`,
      '--------------------------------',
      'Connexion : utilisez ces identifiants pour accéder à l’espace admin.',
      'Conseil : changez le mot de passe après la première connexion.',
    ]
    return lines.join('\n')
  }

  const loadLogoDataUrl = async () => {
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

  const downloadCredentialsPdf = async (data: NonNullable<typeof createdAdmin>) => {
    setPdfLoading(true)
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const logoDataUrl = await loadLogoDataUrl()

      const contractTitle = 'Contrat d’accès administrateur'
      const contractDate = new Date(data.createdAt).toLocaleDateString()
      const contractText = [
        `Entre les soussignés :`,
        `${defaultContractMeta.companyName}, ${defaultContractMeta.companyAddress}, représentée par ${defaultContractMeta.representativeName},`,
        `ci-après dénommée "La Société",`,
        ``,
        `Et :`,
        `${data.name}, ci-après dénommé(e) "L’Administrateur".`,
        ``,
        `Article 1 — Objet`,
        `Le présent contrat a pour objet de définir les conditions d’accès et d’utilisation de la plateforme de gestion locative par L’Administrateur.`,
        ``,
        `Article 2 — Accès et identifiants`,
        `L’Administrateur reçoit des identifiants personnels et s’engage à les conserver de manière confidentielle.`,
        ``,
        `Article 3 — Obligations`,
        `L’Administrateur s’engage à utiliser la plateforme conformément aux lois en vigueur, à respecter la confidentialité des données et à signaler toute activité suspecte.`,
        ``,
        `Article 4 — Durée`,
        `Le présent contrat est conclu pour une durée de ${defaultContractMeta.duration} à compter de la date de signature.`,
        ``,
        `Article 5 — Résiliation`,
        `La Société se réserve le droit de suspendre ou résilier l’accès en cas de non-respect des présentes conditions.`,
        ``,
        `Article 6 — Confidentialité`,
        `Les parties s’engagent à préserver la confidentialité des informations et données traitées.`,
      ]

      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageWidth, 44, 'F')
      doc.setFillColor(250, 250, 252)
      doc.rect(0, 44, pageWidth, pageHeight - 44, 'F')

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', 12, 10, 18, 18)
      }

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('Keur Ya Aicha', logoDataUrl ? 36 : 14, 20)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('Contrat & Identifiants Admin', logoDataUrl ? 36 : 14, 29)

      doc.setDrawColor(203, 213, 225)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(12, 56, pageWidth - 24, 90, 5, 5, 'FD')

      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('Informations du compte', 18, 68)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      const rows = [
        ['Nom', data.name],
        ['Username', data.username],
        ['Mot de passe', data.password],
        ['Email', data.email || '—'],
        ['Entreprise', data.entreprise || '—'],
        ['Créé le', new Date(data.createdAt).toLocaleString()],
      ]

      const leftX = 18
      const rightX = pageWidth / 2 + 6
      let y = 78
      rows.forEach(([label, value], index) => {
        const columnX = index < 3 ? leftX : rightX
        const rowY = index < 3 ? y + index * 10 : y + (index - 3) * 10
        doc.setTextColor(100, 116, 139)
        doc.text(`${label}`, columnX, rowY)
        doc.setTextColor(15, 23, 42)
        doc.text(String(value), columnX + 30, rowY)
      })

      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(12, 152, pageWidth - 24, 34, 4, 4, 'S')
      doc.setTextColor(71, 85, 105)
      doc.setFontSize(10)
      doc.text(
        'Conservez ces identifiants en lieu sûr. Changez le mot de passe lors de la première connexion.',
        18,
        166,
        { maxWidth: pageWidth - 36 }
      )

      doc.addPage()
      doc.setFillColor(250, 250, 252)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text(contractTitle, 14, 18)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(`Date : ${contractDate}`, 14, 28)

      doc.setFontSize(11)
      doc.setTextColor(30, 41, 59)
      let textY = 40
      contractText.forEach((line) => {
        if (!line) {
          textY += 6
          return
        }
        doc.text(line, 14, textY, { maxWidth: pageWidth - 28 })
        textY += 7
      })

      doc.setDrawColor(203, 213, 225)
      doc.roundedRect(14, pageHeight - 64, pageWidth - 28, 44, 5, 5, 'S')
      doc.setFontSize(10)
      doc.setTextColor(71, 85, 105)
      doc.text(
        `Fait à ${defaultContractMeta.signatureCity}, le ${contractDate}.`,
        18,
        pageHeight - 50
      )
      doc.text('Signature et cachet de la Société', 18, pageHeight - 36)
      doc.text('Signature de l’Administrateur', pageWidth / 2 + 6, pageHeight - 36)

      doc.setTextColor(148, 163, 184)
      doc.setFontSize(9)
      doc.text('Document généré par le Super Admin', 12, pageHeight - 16)

      doc.save(`admin-${data.username}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  const sendCredentialsWhatsapp = (data: NonNullable<typeof createdAdmin>) => {
    const phone = formatPhone(data.phone || '')
    if (!phone) return
    const message = encodeURIComponent(buildCredentialsMessage(data))
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const changeAdminStatus = async (adminId: string, newStatus: AdminStatus) => {
    try {
      await updateAdmin(adminId, { status: newStatus })
      await refresh()
    } catch (err: any) {
      console.error('Failed to update admin status:', err)
    }
  }

  const getAdminActions = (admin: AdminDTO) => {
    switch (admin.status) {
      case 'ACTIF':
        return [
          { label: 'Suspendre', variant: 'secondary' as const, action: () => changeAdminStatus(admin.id, 'SUSPENDU') },
          { label: 'Blacklister', variant: 'destructive' as const, action: () => changeAdminStatus(admin.id, 'BLACKLISTE') },
          { label: 'Archiver', variant: 'outline' as const, action: () => changeAdminStatus(admin.id, 'ARCHIVE') },
        ]
      case 'SUSPENDU':
        return [
          { label: 'Activer', variant: 'default' as const, action: () => changeAdminStatus(admin.id, 'ACTIF') },
          { label: 'Blacklister', variant: 'destructive' as const, action: () => changeAdminStatus(admin.id, 'BLACKLISTE') },
          { label: 'Archiver', variant: 'outline' as const, action: () => changeAdminStatus(admin.id, 'ARCHIVE') },
        ]
      case 'BLACKLISTE':
        return [
          { label: 'Activer', variant: 'default' as const, action: () => changeAdminStatus(admin.id, 'ACTIF') },
          { label: 'Suspendre', variant: 'secondary' as const, action: () => changeAdminStatus(admin.id, 'SUSPENDU') },
          { label: 'Archiver', variant: 'outline' as const, action: () => changeAdminStatus(admin.id, 'ARCHIVE') },
        ]
      case 'ARCHIVE':
        return [
          { label: 'Activer', variant: 'default' as const, action: () => changeAdminStatus(admin.id, 'ACTIF') },
          { label: 'Suspendre', variant: 'secondary' as const, action: () => changeAdminStatus(admin.id, 'SUSPENDU') },
          { label: 'Blacklister', variant: 'destructive' as const, action: () => changeAdminStatus(admin.id, 'BLACKLISTE') },
        ]
      default:
        return []
    }
  }


  if (loading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Super Admin</h1>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Ajouter un admin</Button>
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (open) {
            setCreateError('')
          }
        }}
      >
        <DialogContent className="overflow-hidden p-0 sm:max-w-[700px]">
          <DialogHeader className="sr-only">
            <DialogTitle>Création d’un compte admin</DialogTitle>
            <DialogDescription>
              Formulaire de création et résumé des identifiants admin.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Super Admin</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {createdAdmin ? 'Compte créé' : 'Inscription directe'}
            </h2>
            <p className="mt-1 text-sm text-slate-200">
              {createdAdmin
                ? 'Les identifiants sont prêts pour téléchargement ou envoi.'
                : 'Création instantanée d’un compte admin avec remise des identifiants.'}
            </p>
          </div>
          <div className="space-y-6 p-6">
            {createdAdmin ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-slate-50 p-4">
                  <p className="text-sm font-semibold">Compte créé avec succès</p>
                  <p className="text-xs text-muted-foreground">
                    Identifiants prêts pour téléchargement ou envoi WhatsApp.
                  </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-white p-3 text-sm">
                      <p className="text-xs text-muted-foreground">Nom</p>
                      <p className="font-semibold">{createdAdmin.name}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-3 text-sm">
                      <p className="text-xs text-muted-foreground">Username</p>
                      <p className="font-semibold">{createdAdmin.username}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-3 text-sm">
                      <p className="text-xs text-muted-foreground">Mot de passe</p>
                      <p className="font-semibold">{createdAdmin.password}</p>
                    </div>
                  <div className="rounded-lg border border-border bg-white p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-semibold">{createdAdmin.email || '—'}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-3 text-sm sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Lien d’accès</p>
                    <p className="font-semibold">{`${window.location.origin}/login`}</p>
                  </div>
                </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => downloadCredentialsPdf(createdAdmin)} disabled={pdfLoading}>
                      {pdfLoading ? 'Génération...' : 'Télécharger PDF'}
                    </Button>
                    <Button onClick={() => sendCredentialsWhatsapp(createdAdmin)} disabled={!createdAdmin.phone}>
                      Envoyer WhatsApp
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false)
                      setCreatedAdmin(null)
                    }}
                  >
                    Fermer
                  </Button>
                  <Button
                    onClick={() => {
                      setCreatedAdmin(null)
                      setIsCreateOpen(true)
                    }}
                  >
                    Créer un autre
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom d'utilisateur</label>
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="ex. admin_keur"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom complet</label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nom et prénom"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email (optionnel)</label>
                    <Input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Entreprise (optionnel)</label>
                    <Input
                      value={newEntreprise}
                      onChange={(e) => setNewEntreprise(e.target.value)}
                      placeholder="Nom de l’entreprise"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Téléphone WhatsApp</label>
                    <Input
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+221 77 123 45 67"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mot de passe</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Laisser vide pour admin123"
                    />
                  </div>
                </div>
                {createError && <p className="text-sm text-destructive">{createError}</p>}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false)
                      setCreatedAdmin(null)
                    }}
                  >
                    Fermer
                  </Button>
                  <Button onClick={createAdminDirect} disabled={creating}>
                    {creating ? 'Création...' : 'Créer le compte'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <section id="demandes-en-attente" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Demandes en attente</h2>
        </div>
        <Card className="space-y-4 rounded-3xl border border-border bg-white/80 p-1 shadow-lg">
          <CardHeader className="bg-white rounded-2xl border border-border">
            <div>
              <CardTitle>Demandes Admin (EN_ATTENTE)</CardTitle>
              <p className="text-xs text-muted-foreground">Les comptes bloqués attendent validation & paiement initial</p>
            </div>
          </CardHeader>
          <CardContent className="bg-white rounded-2xl border border-border">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                placeholder="Rechercher par nom, téléphone, entreprise ou username"
              />
              <Button
                variant={pendingOnlyEntreprise ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPendingOnlyEntreprise((v) => !v)}
              >
                {pendingOnlyEntreprise ? 'Entreprise uniquement' : 'Filtrer par entreprise'}
              </Button>
            </div>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
            ) : (
              <div className="space-y-4">
                {visiblePending.map((req) => (
                  <div key={req.id} className="rounded-2xl border border-border bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{req.name}</p>
                        <p className="text-xs text-muted-foreground">{req.email || '—'}</p>
                        {req.phone ? <p className="text-xs text-muted-foreground">Téléphone : {req.phone}</p> : null}
                        {req.entrepriseName ? (
                          <p className="text-xs text-muted-foreground">Entreprise : {req.entrepriseName}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => approveRequest(req)}>
                          Valider
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Nom d&apos;utilisateur</label>
                        <div className="flex flex-wrap gap-2">
                          <Input
                            className="h-8 w-full"
                            value={editingUsernames[req.id] ?? req.username}
                            onChange={(e) => {
                              const value = e.target.value
                              setEditingUsernames((prev) => ({ ...prev, [req.id]: value }))
                              if (approveErrors[req.id]) {
                                setApproveErrors((prev) => ({ ...prev, [req.id]: '' }))
                              }
                            }}
                            placeholder="nouvel_identifiant"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingUsernameId === req.id}
                            onClick={() => saveUsername(req)}
                          >
                            {savingUsernameId === req.id ? 'Enregistrement...' : 'Enregistrer'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {approveErrors[req.id] ? (
                      <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        {approveErrors[req.id]}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            {pendingRequests.length > 5 && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => setShowAllPending((v) => !v)}>
                  {showAllPending ? 'Voir moins' : 'Voir tout'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      

      <section id="logs-audit" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Logs / audit</h2>
            <p className="text-sm text-muted-foreground">Dernières actions enregistrées</p>
          </div>
        </div>
        <Card className="rounded-3xl border border-border bg-white/80">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Logs / Audit</CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Total : {auditLogs.length}</span>
                <span>Affichés : {visibleLogs.length}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Rechercher (acteur, action, cible, message)"
              />
              <div className="flex gap-2">
                <Button
                  variant={logFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLogFilter('all')}
                >
                  Tout
                </Button>
                <Button
                  variant={logFilter === 'create' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLogFilter('create')}
                >
                  Créations
                </Button>
                <Button
                  variant={logFilter === 'update' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLogFilter('update')}
                >
                  Modifs
                </Button>
                <Button
                  variant={logFilter === 'delete' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLogFilter('delete')}
                >
                  Suppressions
                </Button>
              </div>
            </div>
            {filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun log disponible. Vérifie que `audit_logs` est rempli dans `db.json`.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Acteur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Cible</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">{formatLogDate(log.createdAt)}</TableCell>
                      <TableCell>{log.actor || '—'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getActionBadge(log.action)}`}>
                          {log.action || '—'}
                        </span>
                      </TableCell>
                      <TableCell>{log.targetType ? `${log.targetType}${log.targetId ? ` • ${log.targetId}` : ''}` : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.message || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {filteredLogs.length > 10 && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => setShowAllLogs((v) => !v)}>
                  {showAllLogs ? 'Voir moins' : 'Voir tout'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      

      <section id="stats-globales" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Stats globales & paiements</h2>
          <p className="text-sm text-muted-foreground">Vue d'ensemble sur les administrations actives</p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <CardStat title="Admins" value={admins.length} icon={Users} variant="default" />
          <CardStat title="Entreprises" value={entreprises.length} icon={Building2} variant="success" />
          <CardStat title="Demandes en attente" value={pendingRequests.length} icon={Shield} variant={pendingRequests.length > 0 ? 'warning' : 'default'} />
        </div>
        <div className="grid gap-4 rounded-3xl border border-border bg-card/80 p-4 shadow-xl sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Répartition des paiements</p>
            <p className="text-sm text-foreground/80 mb-3">Vue d'ensemble des paiements</p>
            <ul className="space-y-2 text-sm">
              {paymentDistribution.map((entry, index) => (
                <li key={entry.name} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pieColors[index % pieColors.length] }}
                    />
                    <span className="font-medium">{entry.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {entry.value} ({totalPayments === 0 ? 0 : Math.round((entry.value / totalPayments) * 100)}%)
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between py-2 border-t mt-2">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{totalPayments}</span>
              </li>
            </ul>
            {totalPayments === 0 && (
              <p className="mt-3 text-xs text-muted-foreground">Aucune donnée de paiement disponible.</p>
            )}
          </div>
          <div className="min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentDistribution}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  innerRadius={40}
                  label={(entry) => `${entry.name} (${entry.value})`}
                >
                  {paymentDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} locations`} />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      


    

<section id="liste-admins" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Liste admins + actions</h2>
          <p className="text-sm text-muted-foreground">Gérer les statuts et accès des comptes admin</p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <CardStat title="Admins" value={admins.length} icon={Users} variant="default" />
          <CardStat title="Entreprises" value={entreprises.length} icon={Building2} variant="success" />
          <CardStat title="Actifs" value={actifAdminsCount} icon={Shield} variant="success" />
        </div>
        <Card className="rounded-3xl border border-border bg-white/80">
          <CardHeader>
            <CardTitle>Admins</CardTitle>
            <Input
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="Rechercher par nom, username, email ou entreprise"
            />
          </CardHeader>
          <CardContent>
            {filteredAdmins.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun admin trouvé.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Entreprise(s)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => {
                    const entreprise = entreprises.find((e) => e.id === admin.entrepriseId)
                    const actions = getAdminActions(admin)
                    return (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{admin.name}</p>
                            <p className="text-xs text-muted-foreground">@{admin.username}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${ADMIN_STATUS_COLORS[admin.status] || 'bg-gray-100 text-gray-800'}`}>
                            {ADMIN_STATUS_LABELS[admin.status] || admin.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {entreprise?.name || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {actions.map((action, idx) => (
                              <Button
                                key={idx}
                                size="sm"
                                variant={action.variant}
                                onClick={action.action}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section></div>
  )
}
