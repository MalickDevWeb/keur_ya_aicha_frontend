import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SendDownloadModal from '@/components/SendDownloadModal'
import { useStore } from '@/stores/dataStore'
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
  const clients = useStore((state) => state.clients)
  const deleteDocument = useStore((state) => state.deleteDocument)
  const [modalDoc, setModalDoc] = useState<SignedContractRow | null>(null)
  const signedContracts = useMemo(() => buildSignedContracts(clients), [clients])
  const propertiesCount = new Set(signedContracts.map((row) => row.rentalId)).size
  const totalRevenue = signedContracts.reduce((sum, row) => sum + (row.rentalRent ?? 0), 0)
  const revenueLabel = formatSignedContractCurrency(totalRevenue)

  const handleDelete = (row: SignedContractRow) => {
    if (!window.confirm(`Supprimer le contrat "${row.name}" ?`)) return
    deleteDocument(row.clientId, row.rentalId, row.id)
  }

  return (
    <div className="space-y-6">
      <SectionWrapper>
        <SignedContractsHeaderSection onBack={() => navigate(-1)} />
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
    </div>
  )
}
