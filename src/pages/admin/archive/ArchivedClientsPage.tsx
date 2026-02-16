import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useStore } from '@/stores/dataStore'
import { useToast } from '@/contexts/ToastContext'
import { useGoBack } from '@/hooks/useGoBack'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import type { ArchiveClient } from './types'
import { formatArchiveDate, matchesClientSearch } from './utils'
import { ArchivedHeaderSection } from './archived/sections/ArchivedHeaderSection'
import { ArchivedStatsSection } from './archived/sections/ArchivedStatsSection'
import { ArchivedSearchSection } from './archived/sections/ArchivedSearchSection'
import { ArchivedListSection } from './archived/sections/ArchivedListSection'

type ConfirmDialogState = {
  open: boolean
  clientId: string
  clientName: string
  action: 'archive' | 'reactivate'
  isLoading: boolean
}

export default function ArchivedClientsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/archive')
  const clients = useStore((state) => state.clients)
  const updateClient = useStore((state) => state.updateClient)
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    clientId: '',
    clientName: '',
    action: 'reactivate',
    isLoading: false,
  })

  const archivedClients = useMemo(
    () =>
      (clients as ArchiveClient[])
        .filter((client) => client.status === 'archived')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [clients]
  )

  const activeClients = useMemo(
    () => (clients as ArchiveClient[]).filter((client) => client.status === 'active'),
    [clients]
  )

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return activeClients.filter((client) => matchesClientSearch(client, searchQuery))
  }, [searchQuery, activeClients])

  const openConfirm = (clientId: string, action: 'archive' | 'reactivate') => {
    const client = (clients as ArchiveClient[]).find((item) => item.id === clientId)
    setConfirmDialog({
      open: true,
      clientId,
      clientName: `${client?.firstName} ${client?.lastName}`.trim(),
      action,
      isLoading: false,
    })
  }

  const handleConfirmAction = async () => {
    setConfirmDialog((prev) => ({ ...prev, isLoading: true }))
    try {
      const newStatus = confirmDialog.action === 'reactivate' ? 'active' : 'archived'
      await updateClient(confirmDialog.clientId, { status: newStatus })

      const actionText = confirmDialog.action === 'reactivate' ? 'réactivé' : 'archivé'
      addToast({
        type: 'success',
        title: confirmDialog.action === 'reactivate' ? 'Client réactivé' : 'Client archivé',
        message: `${confirmDialog.clientName} a été ${actionText}`,
      })
      setConfirmDialog((prev) => ({ ...prev, open: false }))
      setSearchQuery('')
    } catch {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: `Impossible de ${confirmDialog.action === 'reactivate' ? 'réactiver' : 'archiver'} le client`,
      })
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const rentalsArchived = archivedClients.reduce((sum, client) => sum + client.rentals.length, 0)

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-6">
      <SectionWrapper>
        <ArchivedHeaderSection onBack={() => goBack('/archive')} />
      </SectionWrapper>

      <SectionWrapper>
        <ArchivedStatsSection
          archivedCount={archivedClients.length}
          activeCount={activeClients.length}
          rentalsCount={rentalsArchived}
        />
      </SectionWrapper>

      <SectionWrapper>
        <ArchivedSearchSection
          searchQuery={searchQuery}
          results={searchResults}
          onSearchChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          onArchive={(clientId) => openConfirm(clientId, 'archive')}
        />
      </SectionWrapper>

      <SectionWrapper>
        <ArchivedListSection
          clients={archivedClients}
          formatDate={formatArchiveDate}
          onReactivate={(clientId) => openConfirm(clientId, 'reactivate')}
          onView={(clientId) => navigate(`/clients/${clientId}`)}
        />
      </SectionWrapper>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.action === 'reactivate' ? 'Réactiver le client?' : 'Archiver le client?'}
        description={
          confirmDialog.action === 'reactivate'
            ? `${confirmDialog.clientName} sera réactivé et réapparaîtra dans la liste des clients actifs.`
            : `${confirmDialog.clientName} sera archivé et ne sera plus visible dans la liste active.`
        }
        confirmText={confirmDialog.action === 'reactivate' ? 'Réactiver' : 'Archiver'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        isLoading={confirmDialog.isLoading}
        isDestructive={confirmDialog.action === 'archive'}
      />
    </div>
  )
}
