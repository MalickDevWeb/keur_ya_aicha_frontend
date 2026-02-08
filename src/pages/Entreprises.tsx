import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { Building2, Grid3x3, List, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/SearchInput'
import { cn } from '@/lib/utils'
import { MainLayout } from '@/layouts/MainLayout'
import { useAuth } from '@/contexts/AuthContext'
import { AdminDTO, EntrepriseDTO, fetchAdmins, fetchEntreprises } from '@/services/api'

export default function EntreprisesPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  if (!user) return <SuperAdminLogin />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <EntreprisesDashboard />
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
      navigate('/pmt/admin/entreprises', { replace: true })
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
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superadmin"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mot de passe</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error ? <div className="text-sm text-destructive">{error}</div> : null}
            <Button type="submit" disabled={loading} className="w-full">
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
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accès refusé</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vous n&apos;avez pas les droits pour accéder à cette page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function EntreprisesDashboard() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { setImpersonation } = useAuth()
  const [entreprises, setEntreprises] = useState<EntrepriseDTO[]>([])
  const [admins, setAdmins] = useState<AdminDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [enteringId, setEnteringId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const [entreprisesData, adminsData] = await Promise.all([fetchEntreprises(), fetchAdmins()])
        if (!active) return
        setEntreprises(entreprisesData)
        setAdmins(adminsData)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const adminsById = useMemo(() => {
    const map = new Map<string, AdminDTO>()
    admins.forEach((admin) => map.set(admin.id, admin))
    return map
  }, [admins])

  const rows = useMemo(() => {
    return entreprises.map((entreprise) => ({
      entreprise,
      admin: adminsById.get(entreprise.adminId || ''),
    }))
  }, [entreprises, adminsById])

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(({ entreprise, admin }) => {
      const name = String(entreprise.name || '').toLowerCase()
      const id = String(entreprise.id || '').toLowerCase()
      const adminName = String(admin?.name || '').toLowerCase()
      const adminUser = String(admin?.username || '').toLowerCase()
      return (
        name.includes(needle) ||
        id.includes(needle) ||
        adminName.includes(needle) ||
        adminUser.includes(needle)
      )
    })
  }, [rows, search])

  const handleEnterAdmin = async (admin?: AdminDTO | null) => {
    if (!admin) return
    setEnteringId(admin.id)
    try {
      await setImpersonation({ adminId: admin.id, adminName: admin.name, userId: admin.userId })
      navigate('/dashboard')
    } finally {
      setEnteringId(null)
    }
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6 animate-fade-in">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Entreprises</h1>
        <p className="text-sm text-muted-foreground">Vue des entreprises enregistrées</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-0 bg-gradient-to-br from-slate-900/80 to-slate-950/60 text-white shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">Entreprises</p>
                <p className="text-2xl font-semibold">{entreprises.length}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-emerald-700/80 to-emerald-950/70 text-white shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">Admins</p>
                <p className="text-2xl font-semibold">{admins.length}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput value={search} onChange={setSearch} className="flex-1" />
            <div className="flex gap-2 border-l pl-4">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                title="Vue en cartes"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                title="Vue en liste"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Chargement...</div>
          ) : filteredRows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t('clients.noResults')}</div>
          ) : viewMode === 'cards' ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
              {filteredRows.map(({ entreprise, admin }) => (
                <Card
                  key={entreprise.id}
                  className={cn(
                    'overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all',
                    'bg-gradient-to-br from-white to-slate-50'
                  )}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Entreprise</p>
                        <h3 className="text-lg font-semibold">{entreprise.name || '—'}</h3>
                      </div>
                      <div className="rounded-2xl bg-slate-900/5 p-2">
                        <Building2 className="h-5 w-5 text-slate-700" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Admin</span>
                      {admin ? (
                        <Badge variant="secondary">{admin.name} (@{admin.username})</Badge>
                      ) : (
                        <Badge variant="outline">—</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: <span className="font-mono">{entreprise.id}</span>
                    </div>
                    <div className="pt-2">
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={!admin || enteringId === admin?.id}
                        onClick={() => handleEnterAdmin(admin)}
                      >
                        {enteringId === admin?.id ? 'Ouverture...' : "Entrer dans l'espace"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map(({ entreprise, admin }) => (
                  <TableRow key={entreprise.id}>
                    <TableCell className="font-medium">{entreprise.name || '—'}</TableCell>
                    <TableCell>
                      {admin ? (
                        <Badge variant="secondary">{admin.name} (@{admin.username})</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entreprise.id}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={!admin || enteringId === admin?.id}
                        onClick={() => handleEnterAdmin(admin)}
                      >
                        {enteringId === admin?.id ? 'Ouverture...' : "Entrer dans l'espace"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
