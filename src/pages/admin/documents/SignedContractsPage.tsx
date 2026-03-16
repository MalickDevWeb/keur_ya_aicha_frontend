import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SendDownloadModal from '@/components/SendDownloadModal'
import { useGoBack } from '@/hooks/useGoBack'
import { useStore } from '@/stores/dataStore'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { buildReadableDocumentName } from '@/lib/documentDisplay'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { listContracts, type Contract } from '@/services/api/contracts.api'
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
  const [contracts, setContracts] = useState<Contract[]>([])
  const [modalDoc, setModalDoc] = useState<SignedContractRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SignedContractRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const signedContracts = useMemo(() => buildSignedContracts(clients), [clients])
  const propertiesCount = new Set(signedContracts.map((row) => row.rentalId)).size
  const totalRevenue = signedContracts.reduce((sum, row) => sum + (row.rentalRent ?? 0), 0)
  const revenueLabel = formatSignedContractCurrency(totalRevenue)
  const modalDocDisplayName = modalDoc
    ? buildReadableDocumentName({
        name: modalDoc.name,
        type: 'contract',
        context: modalDoc.rentalName || modalDoc.clientName,
        uploadedAt: modalDoc.uploadedAt,
      })
    : ''

  const handleDelete = (row: SignedContractRow) => {
    setDeleteTarget(row)
  }

  // Charger les contrats depuis l'API (vrais contrats backend)
  useMemo(() => {
    void (async () => {
      try {
        const data = await listContracts()
        setContracts(data)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Impossible de charger les contrats.'
        toast({ title: 'Erreur', description: message, variant: 'destructive' })
      }
    })()
  }, [toast])

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteDocument(deleteTarget.clientId, deleteTarget.rentalId, deleteTarget.id)
      const displayName = buildReadableDocumentName({
        name: deleteTarget.name,
        type: 'contract',
        context: deleteTarget.rentalName || deleteTarget.clientName,
        uploadedAt: deleteTarget.uploadedAt,
      })
      toast({ title: 'Contrat supprimé', description: `"${displayName}" a été supprimé.` })
      setDeleteTarget(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer le contrat.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
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

      {contracts.length > 0 && (
        <SectionWrapper>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Contrats (backend)</h3>
            <p className="text-sm text-muted-foreground">
              Liste des contrats générés via l’API. Téléchargeables si le PDF a été généré.
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Client</th>
                    <th className="px-3 py-2 text-left">Statut</th>
                    <th className="px-3 py-2 text-left">PDF</th>
                    <th className="px-3 py-2 text-left">Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-2">{c.id.slice(0, 8)}…</td>
                      <td className="px-3 py-2">{c.clientId}</td>
                      <td className="px-3 py-2 capitalize">{c.statut.replace('_', ' ')}</td>
                      <td className="px-3 py-2">
                        {c.pdfUrl ? (
                          <a className="text-primary underline" href={c.pdfUrl} target="_blank" rel="noreferrer">
                            PDF
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Non généré</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{formatSignedContractDate(c.creeLe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SectionWrapper>
      )}

      <SendDownloadModal
        open={!!modalDoc}
        onClose={() => setModalDoc(null)}
        document={
          modalDoc
            ? {
                id: modalDoc.id,
                name: modalDocDisplayName,
                type: 'contract',
                url: modalDoc.url,
                fileName: `${modalDocDisplayName}.pdf`,
              }
            : null
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le contrat ?"
        description={
          deleteTarget
            ? `Le contrat "${buildReadableDocumentName({
                name: deleteTarget.name,
                type: 'contract',
                context: deleteTarget.rentalName || deleteTarget.clientName,
                uploadedAt: deleteTarget.uploadedAt,
              })}" sera supprimé.`
            : ''
        }
        confirmText="Supprimer"
        isDestructive
        isLoading={isDeleting}
        onConfirm={() => {
          void confirmDelete()
        }}
        onCancel={() => {
          if (isDeleting) return
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
