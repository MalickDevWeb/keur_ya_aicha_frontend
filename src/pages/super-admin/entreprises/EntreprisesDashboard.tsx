import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/contexts/AuthContext'
import { fetchAdminPayments, fetchAdmins, fetchAdminRequests, fetchEntreprises } from '@/services/api'
import type { AdminDTO, AdminPaymentDTO, AdminRequestDTO, EntrepriseDTO } from '@/dto/frontend/responses'
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
  const [adminPayments, setAdminPayments] = useState<AdminPaymentDTO[]>([])
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
        const [entreprisesData, adminsData, requestsData, adminPaymentsData] = await Promise.all([
          fetchEntreprises(),
          fetchAdmins(),
          fetchAdminRequests(),
          fetchAdminPayments(),
        ])
        if (!active) return
        setEntreprises(entreprisesData)
        setAdmins(adminsData)
        setRequests(requestsData)
        setAdminPayments(adminPaymentsData)
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

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), [])

  const paymentsByAdmin = useMemo(() => {
    const map = new Map<string, AdminPaymentDTO[]>()
    adminPayments.forEach((payment) => {
      const list = map.get(payment.adminId) || []
      list.push(payment)
      map.set(payment.adminId, list)
    })
    map.forEach((list, key) => {
      map.set(
        key,
        [...list].sort((a, b) => String(b.paidAt || '').localeCompare(String(a.paidAt || '')))
      )
    })
    return map
  }, [adminPayments])

  const isAdminPaidThisMonth = (adminId?: string) => {
    if (!adminId) return false
    return (paymentsByAdmin.get(adminId) || []).some((payment) => payment.month === currentMonth)
  }

  const getLastPaidAt = (adminId?: string) => {
    if (!adminId) return null
    return paymentsByAdmin.get(adminId)?.[0]?.paidAt || null
  }

  const rows = useMemo<EntrepriseRow[]>(() => {
    return entreprises.map((entreprise) => ({
      entreprise,
      admin: adminsById.get(entreprise.adminId || ''),
      request:
        requestsById.get(adminsById.get(entreprise.adminId || '')?.adminRequestId || '') ||
        requestsByEntreprise.get(String(entreprise.name || '').trim().toLowerCase()),
    }))
  }, [entreprises, adminsById, requestsById, requestsByEntreprise])

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(({ entreprise, admin }) => {
      const name = String(entreprise.name || '').toLowerCase()
      const id = String(entreprise.id || '').toLowerCase()
      const adminName = String(admin?.name || '').toLowerCase()
      return name.includes(needle) || id.includes(needle) || adminName.includes(needle)
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
          isAdminPaidThisMonth={isAdminPaidThisMonth}
          getLastPaidAt={getLastPaidAt}
          selectedEntrepriseId={selectedEntrepriseId}
          onSelectEntreprise={setSelectedEntrepriseId}
          noResultsLabel={t('clients.noResults')}
        />
      </SectionWrapper>
    </main>
  )
}
