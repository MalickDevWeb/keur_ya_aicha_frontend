import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Shield, Users } from 'lucide-react'
import { ResponsiveContainer, Pie, PieChart, Cell, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/layouts/MainLayout'
import { useAuth } from '@/contexts/AuthContext'
import { CardStat } from '@/components/CardStat'
import { fetchAdmins, fetchAdminRequests, fetchEntreprises, fetchUsers, fetchClients } from '@/services/api'

export default function SuperAdminStatsPage() {
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()

  if (!user) return <SuperAdminLogin />
  if (role !== 'SUPER_ADMIN') return <ForbiddenMessage />

  return (
    <MainLayout>
      <SuperAdminStats />
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
      navigate('/pmt/admin/stats', { replace: true })
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
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
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

function SuperAdminStats() {
  const [adminsCount, setAdminsCount] = useState(0)
  const [entreprisesCount, setEntreprisesCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [paymentStats, setPaymentStats] = useState({ paid: 0, unpaid: 0, partial: 0 })

  useEffect(() => {
    let active = true
    const load = async () => {
      const [admins, requests, entreprises, users, clients] = await Promise.all([
        fetchAdmins(),
        fetchAdminRequests(),
        fetchEntreprises(),
        fetchUsers(),
        fetchClients(),
      ])
      if (!active) return
      setAdminsCount(admins.length)
      setEntreprisesCount(entreprises.length)
      setPendingCount(requests.filter((r: any) => r.status === 'EN_ATTENTE').length)
      const stats = { paid: 0, unpaid: 0, partial: 0 }
      clients.forEach((client: any) => {
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
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const totalPayments = paymentStats.paid + paymentStats.unpaid + paymentStats.partial
  const paymentDistribution = useMemo(
    () => [
      { name: 'Payées', value: paymentStats.paid },
      { name: 'Non payées', value: paymentStats.unpaid },
      { name: 'Partielles', value: paymentStats.partial },
    ],
    [paymentStats]
  )
  const pieColors = ['#0ea5e9', '#ef4444', '#f97316']

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6 animate-fade-in">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Stats globales & paiements</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble sur les administrations actives</p>
      </section>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <CardStat title="Admins" value={adminsCount} icon={Users} variant="default" />
        <CardStat title="Entreprises" value={entreprisesCount} icon={Building2} variant="success" />
        <CardStat title="Demandes en attente" value={pendingCount} icon={Shield} variant={pendingCount > 0 ? 'warning' : 'default'} />
      </div>

      <div className="grid gap-4 rounded-3xl border border-border bg-card/80 p-4 shadow-xl sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Répartition des paiements</p>
          <p className="text-sm text-foreground/80">Visualise le ratio paiements payés, non payés et partiels.</p>
          <ul className="mt-3 space-y-1 text-sm">
            {paymentDistribution.map((entry) => (
              <li key={entry.name}>
                <span className="font-semibold">{entry.name}</span>{' '}
                {`(${totalPayments === 0 ? 0 : Math.round((entry.value / totalPayments) * 100)}% • ${entry.value})`}
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-muted-foreground">
            Total paiements suivis : <span className="font-semibold">{totalPayments}</span>
          </div>
          {totalPayments === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">Aucune donnée de paiement disponible.</p>
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
    </main>
  )
}
