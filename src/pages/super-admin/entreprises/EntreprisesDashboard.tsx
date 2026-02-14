import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/contexts/AuthContext'
import { fetchAdmins, fetchAdminRequests, fetchEntreprises, updateAdminRequest } from '@/services/api'
import type { AdminDTO, AdminRequestDTO, EntrepriseDTO } from '@/dto/frontend/responses'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { EntreprisesListSection } from './sections/EntreprisesListSection'
import { EntreprisesStatsSection } from './sections/EntreprisesStatsSection'
import type { EntrepriseRow, ViewMode } from './types'

export function EntreprisesDashboard() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { setImpersonation } = useAuth()
  const [entreprises, setEntreprises] = useState<EntrepriseDTO[]>([])
  const [admins, setAdmins] = useState<AdminDTO[]>([])
  const [requests, setRequests] = useState<AdminRequestDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [enteringId, setEnteringId] = useState<string | null>(null)
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const [entreprisesData, adminsData, requestsData] = await Promise.all([
          fetchEntreprises(),
          fetchAdmins(),
          fetchAdminRequests(),
        ])
        if (!active) return
        setEntreprises(entreprisesData)
        setAdmins(adminsData)
        setRequests(requestsData)
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

  const requestsById = useMemo(() => {
    const map = new Map<string, AdminRequestDTO>()
    requests.forEach((request) => map.set(request.id, request))
    return map
  }, [requests])

  const requestsByEntreprise = useMemo(() => {
    const map = new Map<string, AdminRequestDTO>()
    requests.forEach((request) => {
      const key = String(request.entrepriseName || '').trim().toLowerCase()
      if (key) {
        map.set(key, request)
      }
    })
    return map
  }, [requests])

  const rows = useMemo<EntrepriseRow[]>(() => {
    return entreprises.map((entreprise) => ({
      entreprise,
      admin: adminsById.get(entreprise.adminId || ''),
      request:
        requestsById.get(adminsById.get(entreprise.adminId || '')?.adminRequestId || '') ||
        requestsByEntreprise.get(String(entreprise.name || '').trim().toLowerCase()),
    }))
  }, [entreprises, adminsById, requestsById, requestsByEntreprise])

  const handleMarkPaid = async (request?: AdminRequestDTO) => {
    if (!request) return
    const paidAt = new Date().toISOString()
    const updated = await updateAdminRequest(request.id, { paid: true, paidAt })
    setRequests((prev) => prev.map((r) => (r.id === request.id ? updated : r)))
  }

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(({ entreprise, admin }) => {
      const name = String(entreprise.name || '').toLowerCase()
      const id = String(entreprise.id || '').toLowerCase()
      const adminName = String(admin?.name || '').toLowerCase()
      const adminUser = String(admin?.username || '').toLowerCase()
      return name.includes(needle) || id.includes(needle) || adminName.includes(needle) || adminUser.includes(needle)
    })
  }, [rows, search])

  const handleEnterAdmin = async (admin?: AdminDTO) => {
    if (!admin) return
    const adminName = admin.name?.trim() || admin.username?.trim() || ''
    if (!admin.id || !adminName) return
    setEnteringId(admin.id)
    try {
      await setImpersonation({ adminId: admin.id, adminName, userId: admin.userId })
      navigate('/dashboard')
    } finally {
      setEnteringId(null)
    }
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6 animate-fade-in">
      <SectionWrapper>
        <SuperAdminHeader />
      </SectionWrapper>

      <SectionWrapper>
        <EntreprisesStatsSection entreprisesCount={entreprises.length} adminsCount={admins.length} />
      </SectionWrapper>

      <SectionWrapper>
        <EntreprisesListSection
          rows={filteredRows}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          enteringId={enteringId}
          onEnterAdmin={handleEnterAdmin}
          onMarkPaid={handleMarkPaid}
          selectedEntrepriseId={selectedEntrepriseId}
          onSelectEntreprise={setSelectedEntrepriseId}
          noResultsLabel={t('clients.noResults')}
        />
      </SectionWrapper>
    </main>
  )
}
