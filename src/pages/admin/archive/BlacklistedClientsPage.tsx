import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useStore } from '@/stores/dataStore'
import { useToast } from '@/contexts/ToastContext'
import { useGoBack } from '@/hooks/useGoBack'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import type { ArchiveClient } from './types'
import { formatArchiveDate, matchesClientSearch } from './utils'
import { BlacklistedHeaderSection } from './blacklisted/sections/BlacklistedHeaderSection'
import { BlacklistedBannerSection } from './blacklisted/sections/BlacklistedBannerSection'
import { BlacklistedStatsSection } from './blacklisted/sections/BlacklistedStatsSection'
import { BlacklistedSearchSection } from './blacklisted/sections/BlacklistedSearchSection'
import { BlacklistedListSection } from './blacklisted/sections/BlacklistedListSection'

type ConfirmDialogState = {
  open: boolean
  clientId: string
  clientName: string
  action: 'blacklist' | 'remove'
  isLoading: boolean
}

export default function BlacklistedClientsPage() {
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
    action: 'blacklist',
    isLoading: false,
  })

  const blacklistedClients = useMemo(
    () =>
      (clients as ArchiveClient[])
        .filter((client) => client.status === 'blacklisted')
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

  const openConfirm = (clientId: string, action: 'blacklist' | 'remove') => {
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
      const newStatus = confirmDialog.action === 'remove' ? 'active' : 'blacklisted'
      await updateClient(confirmDialog.clientId, { status: newStatus })

      const actionText = confirmDialog.action === 'remove' ? 'retiré' : 'ajouté à la liste noire'
      addToast({
        type: 'success',
        title: confirmDialog.action === 'remove' ? 'Client retiré' : 'Client ajouté',
        message: `${confirmDialog.clientName} a été ${actionText}`,
      })
      setConfirmDialog((prev) => ({ ...prev, open: false }))
      setSearchQuery('')
    } catch {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: `Impossible de ${confirmDialog.action === 'remove' ? 'retirer' : 'ajouter'} le client`,
      })
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const rentalsBlacklisted = blacklistedClients.reduce((sum, client) => sum + client.rentals.length, 0)

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-6">
      <SectionWrapper>
        <BlacklistedHeaderSection onBack={() => goBack('/archive')} />
      </SectionWrapper>

      <SectionWrapper>
        <BlacklistedBannerSection />
      </SectionWrapper>

      <SectionWrapper>
        <BlacklistedStatsSection
          blacklistedCount={blacklistedClients.length}
          activeCount={activeClients.length}
          rentalsCount={rentalsBlacklisted}
        />
      </SectionWrapper>

      <SectionWrapper>
        <BlacklistedSearchSection
          searchQuery={searchQuery}
          results={searchResults}
          onSearchChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          onBlacklist={(clientId) => openConfirm(clientId, 'blacklist')}
        />
      </SectionWrapper>

      <SectionWrapper>
        <BlacklistedListSection
          clients={blacklistedClients}
          formatDate={formatArchiveDate}
          onRemove={(clientId) => openConfirm(clientId, 'remove')}
          onView={(clientId) => navigate(`/clients/${clientId}`)}
        />
      </SectionWrapper>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.action === 'blacklist' ? 'Ajouter à la liste noire?' : 'Retirer de la liste noire?'}
        description={
          confirmDialog.action === 'blacklist'
            ? `${confirmDialog.clientName} sera ajouté à la liste noire. Cette action est grave et peut affecter les paiements futurs.`
            : `${confirmDialog.clientName} sera retiré de la liste noire et redeviendra un client actif.`
        }
        confirmText={confirmDialog.action === 'blacklist' ? 'Ajouter à la liste noire' : 'Retirer'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        isLoading={confirmDialog.isLoading}
        isDestructive={confirmDialog.action === 'blacklist'}
      />
    </div>
  )
}
