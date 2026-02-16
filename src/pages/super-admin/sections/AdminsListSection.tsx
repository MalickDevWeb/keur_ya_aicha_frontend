import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CardStat } from '@/components/CardStat'
import { StatsCards } from '@/pages/common/StatsCards'
import { Building2, Shield, Users } from 'lucide-react'
import { AdminDTO, AdminStatus, ADMIN_STATUS_COLORS, ADMIN_STATUS_LABELS, EntrepriseDTO } from '@/dto/frontend/responses'
import type { AdminAction } from '../types'

type AdminsListSectionProps = {
  admins: AdminDTO[]
  entreprises: EntrepriseDTO[]
  actifAdminsCount: number
  adminSearch: string
  onAdminSearchChange: (value: string) => void
  filteredAdmins: AdminDTO[]
  getAdminActions: (admin: AdminDTO) => AdminAction[]
}

export function AdminsListSection({
  admins,
  entreprises,
  actifAdminsCount,
  adminSearch,
  onAdminSearchChange,
  filteredAdmins,
  getAdminActions,
}: AdminsListSectionProps) {
  const activeAdminIds = new Set(admins.filter((admin) => admin.status === 'ACTIF').map((admin) => admin.id))
  const activeEntreprisesCount = entreprises.filter((entreprise) =>
    entreprise.adminId ? activeAdminIds.has(entreprise.adminId) : false
  ).length
  const showEntreprises = activeEntreprisesCount > 0
  const statsGridClassName = showEntreprises
    ? 'grid gap-4 grid-cols-1 sm:grid-cols-2'
    : 'grid gap-4 grid-cols-1'

  return (
    <section id="liste-admins" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Liste admins + actions</h2>
        <p className="text-sm text-muted-foreground">Gérer les statuts et accès des comptes admin</p>
      </div>
      <StatsCards gridClassName={statsGridClassName}>
        <CardStat title="Admins actifs" value={actifAdminsCount} icon={Users} variant="default" />
        {showEntreprises ? (
          <CardStat title="Entreprises actives" value={activeEntreprisesCount} icon={Building2} variant="success" />
        ) : null}
      </StatsCards>
      <Card className="rounded-3xl border border-border bg-white/80">
        <CardHeader>
          <CardTitle>Admins</CardTitle>
          <Input
            value={adminSearch}
            onChange={(e) => onAdminSearchChange(e.target.value)}
            placeholder="Rechercher par nom, email ou entreprise"
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${ADMIN_STATUS_COLORS[admin.status] || 'bg-gray-100 text-gray-800'}`}>
                          {ADMIN_STATUS_LABELS[admin.status as AdminStatus] || admin.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {entreprise?.name || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {actions.map((action, idx) => (
                            <Button
                              key={`${admin.id}-${idx}`}
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
    </section>
  )
}
