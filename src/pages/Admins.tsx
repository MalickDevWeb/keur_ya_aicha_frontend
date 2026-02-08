import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MainLayout } from '@/layouts/MainLayout'
import { useAuth } from '@/contexts/AuthContext'
import { AdminDTO, EntrepriseDTO, fetchAdmins, fetchEntreprises, updateAdmin } from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/SearchInput'
import { Grid3x3, List, Shield, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminsPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  if (!user) return <SuperAdminLogin />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <AdminsDashboard />
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
      navigate('/pmt/admin/admins', { replace: true })
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

function AdminsDashboard() {
  const [admins, setAdmins] = useState<AdminDTO[]>([])
  const [entreprises, setEntreprises] = useState<EntrepriseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const [adminsData, entreprisesData] = await Promise.all([fetchAdmins(), fetchEntreprises()])
        if (!active) return
        setAdmins(adminsData)
        setEntreprises(entreprisesData)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const entrepriseByAdmin = useMemo(() => {
    const map = new Map<string, EntrepriseDTO[]>()
    entreprises.forEach((ent) => {
      if (!ent.adminId) return
      const list = map.get(ent.adminId) || []
      list.push(ent)
      map.set(ent.adminId, list)
    })
    return map
  }, [entreprises])

  const rows = useMemo(() => {
    return admins.map((admin) => ({
      admin,
      entreprises: entrepriseByAdmin.get(admin.id) || [],
    }))
  }, [admins, entrepriseByAdmin])

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(({ admin, entreprises }) => {
      const name = String(admin.name || '').toLowerCase()
      const username = String(admin.username || '').toLowerCase()
      const email = String(admin.email || '').toLowerCase()
      const status = String(admin.status || '').toLowerCase()
      const entNames = entreprises.map((e) => String(e.name || '').toLowerCase()).join(' ')
      return (
        name.includes(needle) ||
        username.includes(needle) ||
        email.includes(needle) ||
        status.includes(needle) ||
        entNames.includes(needle)
      )
    })
  }, [rows, search])

  const setStatus = async (admin: AdminDTO, status: AdminDTO['status']) => {
    setBusyId(admin.id)
    try {
      const updated = await updateAdmin(admin.id, { status })
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? updated : a)))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6 animate-fade-in">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Liste admins + actions</h1>
        <p className="text-sm text-muted-foreground">Gérer les statuts et accès des comptes admin.</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-slate-900/80 to-slate-950/60 text-white shadow-xl">
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
        <Card className="border-0 bg-gradient-to-br from-emerald-700/80 to-emerald-950/70 text-white shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">Entreprises</p>
                <p className="text-2xl font-semibold">{entreprises.length}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-indigo-600/80 to-indigo-950/70 text-white shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">Actifs</p>
                <p className="text-2xl font-semibold">{admins.filter((a) => a.status === 'ACTIF').length}</p>
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
            <SearchInput
              value={search}
              onChange={setSearch}
              className="flex-1"
              placeholder="Nom, username, email ou entreprise"
            />
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
            <div className="text-center py-12 text-muted-foreground">Aucun admin enregistré.</div>
          ) : viewMode === 'cards' ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
              {filteredRows.map(({ admin, entreprises }) => {
                const actionsDisabled = busyId === admin.id
                return (
                  <Card
                    key={admin.id}
                    className={cn(
                      'overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all',
                      'bg-gradient-to-br from-white to-slate-50'
                    )}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin</p>
                          <h3 className="text-lg font-semibold">{admin.name}</h3>
                          <p className="text-xs text-muted-foreground">@{admin.username}</p>
                        </div>
                        <Badge variant="secondary">{admin.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Entreprises: {entreprises.length === 0 ? '—' : entreprises.map((e) => e.name || '—').join(', ')}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {admin.status !== 'ACTIF' && (
                          <Button size="sm" variant="outline" disabled={actionsDisabled} onClick={() => setStatus(admin, 'ACTIF')}>
                            Activer
                          </Button>
                        )}
                        {admin.status !== 'SUSPENDU' && (
                          <Button size="sm" variant="outline" disabled={actionsDisabled} onClick={() => setStatus(admin, 'SUSPENDU')}>
                            Suspendre
                          </Button>
                        )}
                        {admin.status !== 'BLACKLISTE' && (
                          <Button size="sm" variant="outline" disabled={actionsDisabled} onClick={() => setStatus(admin, 'BLACKLISTE')}>
                            Blacklister
                          </Button>
                        )}
                        {admin.status !== 'ARCHIVE' && (
                          <Button size="sm" variant="outline" disabled={actionsDisabled} onClick={() => setStatus(admin, 'ARCHIVE')}>
                            Archiver
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
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
                {filteredRows.map(({ admin, entreprises }) => {
                  const actionsDisabled = busyId === admin.id
                  return (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{admin.name}</span>
                          <span className="text-xs text-muted-foreground">@{admin.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="secondary">{admin.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entreprises.length === 0 ? '—' : entreprises.map((ent) => ent.name || '—').join(', ')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {admin.status !== 'ACTIF' && (
                            <Button size="sm" variant="outline" disabled={actionsDisabled} onClick={() => setStatus(admin, 'ACTIF')}>
                              Activer
                            </Button>
                          )}
                          {admin.status !== 'SUSPENDU' && (
                            <Button size="sm" variant="outline" disabled={actionsDisabled} onClick={() => setStatus(admin, 'SUSPENDU')}>
                              Suspendre
                            </Button>
                          )}
                          {admin.status !== 'BLACKLISTE' && (
                            <Button size="sm" variant="outline" disabled={actionsDisabled} onClick={() => setStatus(admin, 'BLACKLISTE')}>
                              Blacklister
                            </Button>
                          )}
                          {admin.status !== 'ARCHIVE' && (
                            <Button size="sm" variant="outline" disabled={actionsDisabled} onClick={() => setStatus(admin, 'ARCHIVE')}>
                              Archiver
                            </Button>
                          )}
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
    </main>
  )
}
