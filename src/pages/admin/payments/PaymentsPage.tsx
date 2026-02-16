import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import SendDownloadModal from '@/components/SendDownloadModal'
import { useStore } from '@/stores/dataStore'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import type { ClientDTO } from '@/dto/backend/responses'
import type { PaymentFilters, ReceiptDocument, ViewMode } from './types'
import { buildPaymentRows, filterPaymentRows, buildPaymentStats, getPaymentDetails, buildReceiptDocument } from './utils'
import { PaymentsHeaderSection } from './sections/PaymentsHeaderSection'
import { PaymentsStatsSection } from './sections/PaymentsStatsSection'
import { PaymentsFiltersSection } from './sections/PaymentsFiltersSection'
import { PaymentsCardsSection } from './sections/PaymentsCardsSection'
import { PaymentsTableSection } from './sections/PaymentsTableSection'

export default function PaymentsPage() {
  const navigate = useNavigate()
  const clients = useStore((state) => state.clients)
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    statusFilter: 'all',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [modalDoc, setModalDoc] = useState<ReceiptDocument | null>(null)

  const rows = useMemo(() => buildPaymentRows(clients), [clients])
  const filteredRows = useMemo(() => filterPaymentRows(rows, filters), [rows, filters])
  const stats = useMemo(() => buildPaymentStats(filteredRows), [filteredRows])

  const hasActiveFilters = filters.statusFilter !== 'all'

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
              onClearFilters={() => setFilters((prev) => ({ ...prev, statusFilter: 'all' }))}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
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
