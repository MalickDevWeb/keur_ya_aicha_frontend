import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SendDownloadModal from '@/components/SendDownloadModal'
import { useGoBack } from '@/hooks/useGoBack'
import { useStore } from '@/stores/dataStore'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { SignedContractsHeaderSection } from './signed-contracts/SignedContractsHeaderSection'
import { SignedContractsStatsSection } from './signed-contracts/SignedContractsStatsSection'
import { SignedContractsTableSection } from './signed-contracts/SignedContractsTableSection'
import {
  buildSignedContracts,
  formatSignedContractCurrency,
  formatSignedContractDate,
  type SignedContractRow,
} from './signed-contracts/utils'

export default function SignedContractsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/documents')
  const { toast } = useToast()
  const clients = useStore((state) => state.clients)
  const deleteDocument = useStore((state) => state.deleteDocument)
  const [modalDoc, setModalDoc] = useState<SignedContractRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SignedContractRow | null>(null)
  const signedContracts = useMemo(() => buildSignedContracts(clients), [clients])
  const propertiesCount = new Set(signedContracts.map((row) => row.rentalId)).size
  const totalRevenue = signedContracts.reduce((sum, row) => sum + (row.rentalRent ?? 0), 0)
  const revenueLabel = formatSignedContractCurrency(totalRevenue)

  const handleDelete = (row: SignedContractRow) => {
    setDeleteTarget(row)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteDocument(deleteTarget.clientId, deleteTarget.rentalId, deleteTarget.id)
      toast({ title: 'Contrat supprimé', description: `"${deleteTarget.name}" a été supprimé.` })
      setDeleteTarget(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer le contrat.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <SectionWrapper>
        <SignedContractsHeaderSection onBack={() => goBack('/documents')} />
      </SectionWrapper>

      <SectionWrapper>
        <SignedContractsStatsSection total={signedContracts.length} properties={propertiesCount} revenueLabel={revenueLabel} />
      </SectionWrapper>

      <SectionWrapper>
        <SignedContractsTableSection
          rows={signedContracts}
          formatDate={formatSignedContractDate}
          formatCurrency={formatSignedContractCurrency}
          onOpenDownload={(row) => setModalDoc(row)}
          onPreview={(row) => navigate(`/documents/${row.id}/edit`)}
          onDelete={handleDelete}
        />
      </SectionWrapper>

      <SendDownloadModal
        open={!!modalDoc}
        onClose={() => setModalDoc(null)}
        document={
          modalDoc
            ? {
                id: modalDoc.id,
                name: modalDoc.name,
                type: 'contract',
                url: modalDoc.url,
                fileName: `${modalDoc.name || 'contrat'}.pdf`,
              }
            : null
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le contrat ?"
        description={deleteTarget ? `Le contrat "${deleteTarget.name}" sera supprimé.` : ''}
        confirmText="Supprimer"
        isDestructive
        onConfirm={() => {
          void confirmDelete()
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
