import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, Home, Users, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { QuickPaymentModal } from '@/components/QuickPaymentModal'
import { useI18n } from '@/lib/i18n'
import { useStore } from '@/stores/dataStore'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { DashboardHeaderSection } from './sections/DashboardHeaderSection'
import { DashboardStatsSection } from './sections/DashboardStatsSection'
import { DashboardEmptyStateSection } from './sections/DashboardEmptyStateSection'
import { DashboardPrioritySection } from './sections/DashboardPrioritySection'
import { buildPriorityClients, formatAmount, formatPaymentPeriod } from './utils'
import type { OverdueClient } from './types'
import type { MonthlyPayment } from '@/lib/types'

export default function DashboardPage() {
  const { t } = useI18n()
  const stats = useStore((state) => state.stats)
  const clients = useStore((state) => state.clients)
  const addMonthlyPayment = useStore((state) => state.addMonthlyPayment)
  const navigate = useNavigate()
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<{
    item: OverdueClient
    payment: MonthlyPayment
    maxAmount: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const priorityClients = useMemo(() => buildPriorityClients(clients), [clients])

  const statCards = [
    { title: t('dashboard.totalClients'), value: stats.totalClients, icon: Users, variant: 'default' as const },
    { title: t('dashboard.totalRentals'), value: stats.totalRentals, icon: Home, variant: 'default' as const },
    { title: t('dashboard.paidRentals'), value: stats.paidRentals, icon: CheckCircle, variant: 'success' as const },
    { title: t('dashboard.unpaidRentals'), value: stats.unpaidRentals, icon: AlertCircle, variant: 'danger' as const },
    { title: t('dashboard.partialRentals'), value: stats.partialRentals, icon: Clock, variant: 'warning' as const },
    {
      title: t('dashboard.monthlyIncome'),
      value: stats.monthlyIncome,
      icon: Wallet,
      isCurrency: true,
      variant: 'default' as const,
    },
  ]

  const handlePayment = (item: OverdueClient) => {
    setSelectedPayment({
      item,
      payment: item.payment,
      maxAmount: item.amountDue,
    })
    setPaymentModalOpen(true)
  }

  const handlePayTotal = async () => {
    if (!selectedPayment) return
    try {
      setIsLoading(true)
      const { payment, item } = selectedPayment
      await addMonthlyPayment(item.rental.id, payment.id, selectedPayment.maxAmount)
      setPaymentModalOpen(false)
      setSelectedPayment(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayPartial = async (amount: number) => {
    if (!selectedPayment) return
    try {
      setIsLoading(true)
      const { payment, item } = selectedPayment
      await addMonthlyPayment(item.rental.id, payment.id, amount)
      setPaymentModalOpen(false)
      setSelectedPayment(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionWrapper>
        <DashboardHeaderSection
          title={t('dashboard.title')}
          subtitle={`${t('auth.welcome')}, Administrateur`}
          onImport={() => navigate('/import/clients')}
          onAddClient={() => navigate('/clients/add')}
        />
      </SectionWrapper>

      <SectionWrapper>
        <DashboardStatsSection cards={statCards} />
      </SectionWrapper>

      {priorityClients.length === 0 && stats.totalRentals > 0 && (
        <SectionWrapper>
          <DashboardEmptyStateSection
            title="✨ Tous les clients ont payé !"
            description="Excellent travail ! Aucun paiement en attente pour le moment."
          />
        </SectionWrapper>
      )}

      {priorityClients.length > 0 && (
        <SectionWrapper>
          <DashboardPrioritySection
            items={priorityClients}
            amountFormatter={formatAmount}
            periodFormatter={formatPaymentPeriod}
            onPay={handlePayment}
            onViewClient={(clientId) => navigate(`/clients/${clientId}`)}
            onViewPayments={() => navigate('/payments')}
          />
        </SectionWrapper>
      )}

      {selectedPayment && (
        <QuickPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          onPayTotal={handlePayTotal}
          onPayPartial={handlePayPartial}
          clientName={`${selectedPayment.item.client.firstName} ${selectedPayment.item.client.lastName}`}
          propertyName={selectedPayment.item.rental.propertyName}
          amountDue={selectedPayment.maxAmount}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
