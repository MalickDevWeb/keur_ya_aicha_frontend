import { useEffect, useMemo, useState } from 'react'
import { fetchAdmins, fetchEntreprises, updateAdmin } from '@/services/api'
import type { AdminDTO, EntrepriseDTO } from '@/dto/frontend/responses'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { useNavigate } from 'react-router-dom'
import { AdminsListSection } from './sections/AdminsListSection'
import { AdminsStatsSection } from './sections/AdminsStatsSection'
import type { AdminRow, ViewMode } from './types'

export function AdminsDashboard() {
  const navigate = useNavigate()
  const [admins, setAdmins] = useState<AdminDTO[]>([])
  const [entreprises, setEntreprises] = useState<EntrepriseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

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

  const rows = useMemo<AdminRow[]>(() => {
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
      const email = String(admin.email || '').toLowerCase()
      const status = String(admin.status || '').toLowerCase()
      const entNames = entreprises.map((e) => String(e.name || '').toLowerCase()).join(' ')
      return (
        name.includes(needle) ||
        email.includes(needle) ||
        status.includes(needle) ||
        entNames.includes(needle)
      )
    })
  }, [rows, search])

  const actifsCount = admins.filter((admin) => admin.status === 'ACTIF').length

  const setStatus = async (admin: AdminDTO, status: AdminDTO['status']) => {
    setBusyId(admin.id)
    try {
      const updated = await updateAdmin(admin.id, { status })
      setAdmins((prev) => prev.map((item) => (item.id === admin.id ? updated : item)))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6 animate-fade-in">
      <SectionWrapper>
        <SuperAdminHeader
          onAddAdmin={() => {
            sessionStorage.setItem('superadminOpenCreate', 'true')
            navigate('/pmt/admin')
          }}
        />
      </SectionWrapper>

      <SectionWrapper>
        <div className="rounded-[28px] border border-[#121B53]/15 bg-gradient-to-br from-[#121B53] via-[#1A2A78] to-[#0B153D] px-6 py-5 text-white shadow-[0_28px_70px_rgba(10,16,48,0.45)]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Super Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">Liste des administrateurs</h1>
          <p className="mt-1 text-sm text-white/70">Gérez les statuts, accès et entreprises associées.</p>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <AdminsStatsSection
          adminsCount={admins.length}
          entreprisesCount={entreprises.length}
          actifsCount={actifsCount}
        />
      </SectionWrapper>

      <SectionWrapper>
        <AdminsListSection
          rows={filteredRows}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          busyId={busyId}
          onSetStatus={setStatus}
        />
      </SectionWrapper>
    </main>
  )
}
