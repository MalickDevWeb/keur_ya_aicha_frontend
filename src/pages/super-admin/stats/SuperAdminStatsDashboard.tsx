import { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { fetchAdmins, fetchAdminRequests, fetchEntreprises, fetchClients } from '@/services/api'
import type { AdminRequestDTO } from '@/dto/frontend/responses'
import type { ClientDTO } from '@/dto/backend/responses'
import { PIE_COLORS } from '../core/constants'
import { buildPaymentDistribution, buildPaymentStats } from './utils'
import type { PaymentStats } from './types'
import { StatsSummarySection } from './sections/StatsSummarySection'
import { PaymentsDistributionSection } from './sections/PaymentsDistributionSection'

export function SuperAdminStatsDashboard() {
  const [adminsCount, setAdminsCount] = useState(0)
  const [entreprisesCount, setEntreprisesCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({ paid: 0, unpaid: 0, partial: 0 })

  useEffect(() => {
    let active = true
    const load = async () => {
      const [admins, requests, entreprises, clients] = await Promise.all([
        fetchAdmins(),
        fetchAdminRequests(),
        fetchEntreprises(),
        fetchClients(),
      ])
      if (!active) return
      const activeAdmins = admins.filter((admin) => admin.status === 'ACTIF')
      const activeAdminIds = new Set(activeAdmins.map((admin) => admin.id))
      const activeEntreprises = entreprises.filter((entreprise) =>
        entreprise.adminId ? activeAdminIds.has(entreprise.adminId) : false
      )
      setAdminsCount(activeAdmins.length)
      setEntreprisesCount(activeEntreprises.length)
      setPendingCount((requests as AdminRequestDTO[]).filter((r) => r.status === 'EN_ATTENTE').length)
      setPaymentStats(buildPaymentStats(clients as ClientDTO[]))
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const totalPayments = paymentStats.paid + paymentStats.unpaid + paymentStats.partial
  const paymentDistribution = useMemo(() => buildPaymentDistribution(paymentStats), [paymentStats])

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6 animate-fade-in">
      <SectionWrapper>
        <SuperAdminHeader />
      </SectionWrapper>

      <SectionWrapper>
        <StatsSummarySection
          adminsCount={adminsCount}
          entreprisesCount={entreprisesCount}
          pendingCount={pendingCount}
        />
      </SectionWrapper>

      <SectionWrapper>
        <PaymentsDistributionSection
          paymentDistribution={paymentDistribution}
          totalPayments={totalPayments}
          pieColors={[...PIE_COLORS]}
        />
      </SectionWrapper>
    </main>
  )
}
