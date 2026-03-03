import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import SendDownloadModal from '@/components/SendDownloadModal'
import { useStore } from '@/stores/dataStore'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import type { ClientDTO } from '@/dto/backend/responses'
import type { PaymentFilters, PaymentRow, ReceiptDocument, ViewMode } from './types'
import { buildPaymentRows, filterPaymentRows, buildPaymentStats, getPaymentDetails, buildReceiptDocument } from './utils'
import { PaymentsHeaderSection } from './sections/PaymentsHeaderSection'
import { PaymentsStatsSection } from './sections/PaymentsStatsSection'
import { PaymentsFiltersSection } from './sections/PaymentsFiltersSection'
import { PaymentsCardsSection } from './sections/PaymentsCardsSection'
import { PaymentsTableSection } from './sections/PaymentsTableSection'

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000
const CRITICAL_OVERDUE_DAYS = 30

type PaymentQuickFilter = '' | 'overdue' | 'critical-overdue'

const getDaysLate = (dueDate: string) => {
  const dueDateTime = new Date(dueDate).getTime()
  if (Number.isNaN(dueDateTime)) return -1
  return Math.floor((Date.now() - dueDateTime) / MILLIS_PER_DAY)
}

const isOverduePayment = (payment: PaymentRow) => {
  const dueDateTime = new Date(String(payment.dueDate)).getTime()
  if (Number.isNaN(dueDateTime) || dueDateTime >= Date.now()) return false
  const status = String(payment.status)
  const hasPendingStatus = status === 'unpaid' || status === 'partial' || status === 'late'
  return hasPendingStatus
}

const isCriticalOverduePayment = (payment: PaymentRow) =>
  isOverduePayment(payment) && getDaysLate(String(payment.dueDate)) >= CRITICAL_OVERDUE_DAYS

export default function PaymentsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const clients = useStore((state) => state.clients)
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    statusFilter: 'all',
  })
  const [quickFilter, setQuickFilter] = useState<PaymentQuickFilter>('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [modalDoc, setModalDoc] = useState<ReceiptDocument | null>(null)

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter === 'overdue' || filter === 'critical-overdue') {
      setQuickFilter(filter)
      return
    }
    setQuickFilter('')
  }, [searchParams])

  const rows = useMemo(() => buildPaymentRows(clients), [clients])
  const filteredRows = useMemo(() => {
    const baseRows = filterPaymentRows(rows, filters)
    if (!quickFilter) return baseRows
    if (quickFilter === 'critical-overdue') return baseRows.filter(isCriticalOverduePayment)
    return baseRows.filter(isOverduePayment)
  }, [rows, filters, quickFilter])
  const stats = useMemo(() => buildPaymentStats(filteredRows), [filteredRows])

  const hasActiveFilters = filters.statusFilter !== 'all' || quickFilter !== ''

  const clearQuickFilterParam = () => {
    const next = new URLSearchParams(searchParams)
    if (!next.has('filter')) return
    next.delete('filter')
    setSearchParams(next, { replace: true })
  }

  const handleClearFilters = () => {
    setFilters((prev) => ({ ...prev, statusFilter: 'all' }))
    setQuickFilter('')
    clearQuickFilterParam()
  }

  const getClientName = (payment: typeof rows[number]) => {
    if (payment.clientName && payment.clientName.trim() && payment.clientName !== 'undefined undefined') {
      return payment.clientName
    }
    const client = clients.find((item) => item.id === payment.clientId)
    if (client?.firstName && client?.lastName) {
      return `${client.firstName} ${client.lastName}`
    }
    return 'Client inconnu'
  }

  const openReceiptModal = (payment: typeof rows[number]) => {
    const client = clients.find((item) => item.id === payment.clientId) as ClientDTO | undefined
    setModalDoc(buildReceiptDocument(payment, client))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        <SectionWrapper>
          <PaymentsHeaderSection onAddPayment={() => navigate('/payments/add')} />
        </SectionWrapper>

        <SectionWrapper>
          <PaymentsStatsSection stats={stats} />
        </SectionWrapper>

        <Card>
          <CardHeader className="pb-4">
            <PaymentsFiltersSection
              filters={filters}
              onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              onStatusChange={(value) => setFilters((prev) => ({ ...prev, statusFilter: value }))}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((prev) => !prev)}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            {quickFilter && (
              <p className="mt-3 text-xs text-muted-foreground">
                Filtre rapide actif:{' '}
                {quickFilter === 'critical-overdue'
                  ? `paiements en retard critique (>= ${CRITICAL_OVERDUE_DAYS} jours)`
                  : 'paiements en retard'}
              </p>
            )}
          </CardHeader>

          <CardContent className={viewMode === 'cards' ? 'p-4 sm:p-6' : 'p-4 md:p-0'}>
            {viewMode === 'cards' ? (
              <PaymentsCardsSection
                rows={filteredRows}
                getClientName={getClientName}
                getPaymentDetails={getPaymentDetails}
                onView={(payment) => navigate(`/rentals/${payment.rentalId}`)}
                onEdit={(payment) => navigate(`/payments/${payment.rentalId}/edit/${payment.id}`)}
                onOpenReceipt={openReceiptModal}
              />
            ) : (
              <PaymentsTableSection
                rows={filteredRows}
                getClientName={getClientName}
                getPaymentDetails={getPaymentDetails}
                onView={(payment) => navigate(`/rentals/${payment.rentalId}`)}
                onEdit={(payment) => navigate(`/payments/${payment.rentalId}/edit/${payment.id}`)}
                onOpenReceipt={openReceiptModal}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <SendDownloadModal document={modalDoc} onClose={() => setModalDoc(null)} />
    </div>
  )
}
