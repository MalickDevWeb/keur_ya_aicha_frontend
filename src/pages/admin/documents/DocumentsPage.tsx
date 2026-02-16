import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { useGoBack } from '@/hooks/useGoBack'
import { useStore } from '@/stores/dataStore'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { getCloudinaryOpenUrl } from '@/services/api/uploads.api'
import type { DocumentFilter, DocumentGroup, DocumentRow } from './types'
import {
  buildDocumentsList,
  buildMissingContracts,
  filterDocuments,
  formatDocumentDate,
  groupDocumentsByType,
} from './utils'
import { DocumentsHeaderSection } from './sections/DocumentsHeaderSection'
import { DocumentsSearchSection } from './sections/DocumentsSearchSection'
import { DocumentsUploadSection } from './sections/DocumentsUploadSection'
import { DocumentsStatsSection } from './sections/DocumentsStatsSection'
import { DocumentsTableSection } from './sections/DocumentsTableSection'
import { DocumentActionDialog } from './sections/DocumentActionDialog'

const DEFAULT_DOC_TYPE: DocumentRow['type'] = 'contract'

const getGroupCounts = (groups: DocumentGroup[]) =>
  groups.reduce((acc, group) => {
    acc[group.type] = group.items.length
    return acc
  }, {} as Record<DocumentRow['type'], number>)

export default function DocumentsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/dashboard')
  const [searchParams] = useSearchParams()
  const clients = useStore((state) => state.clients)
  const addDocument = useStore((state) => state.addDocument)
  const deleteDocument = useStore((state) => state.deleteDocument)
  const { toast } = useToast()
  const [clientId, setClientId] = useState<string>('')
  const [rentalId, setRentalId] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState<DocumentRow['type']>(DEFAULT_DOC_TYPE)
  const [signed, setSigned] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<DocumentFilter>('')
  const [isUploading, setIsUploading] = useState(false)
  const [modalDoc, setModalDoc] = useState<DocumentRow | null>(null)
  const [modalGenerating, setModalGenerating] = useState(false)
  const [modalBlobUrl, setModalBlobUrl] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null)

  useEffect(() => {
    const filter = (searchParams.get('filter') || '') as DocumentFilter
    if (filter) setFilterType(filter)
  }, [searchParams])

  useEffect(() => {
    if (!clientId && clients.length > 0) {
      const firstClient = clients[0]
      setClientId(firstClient.id)
      setRentalId(firstClient.rentals?.[0]?.id || '')
    }
  }, [clientId, clients])

  useEffect(() => {
    if (filterType !== 'missing-contracts' || clients.length === 0) return

    for (const client of clients) {
      for (const rental of client.rentals ?? []) {
        const hasContract = (rental.documents ?? []).some((doc) => doc?.type === 'contract')
        if (!hasContract) {
          setClientId(client.id)
          setRentalId(rental.id)
          return
        }
      }
    }
  }, [filterType, clients])

  useEffect(() => {
    return () => {
      if (modalBlobUrl) URL.revokeObjectURL(modalBlobUrl)
    }
  }, [modalBlobUrl])

  const allDocuments = useMemo(() => buildDocumentsList(clients), [clients])

  const sourceDocuments = useMemo(() => {
    if (filterType === 'missing-contracts') return buildMissingContracts(clients)
    return allDocuments
  }, [allDocuments, clients, filterType])

  const filteredDocuments = useMemo(
    () => filterDocuments(sourceDocuments, clients, searchQuery, filterType),
    [sourceDocuments, clients, searchQuery, filterType]
  )

  const groupedAll = useMemo(() => groupDocumentsByType(allDocuments), [allDocuments])
  const groupedFiltered = useMemo(() => groupDocumentsByType(filteredDocuments), [filteredDocuments])

  const totalsAll = getGroupCounts(groupedAll)
  const totalsFiltered = getGroupCounts(groupedFiltered)
  const showTotals = Boolean(searchQuery || filterType)

  const handleClientChange = (nextClientId: string) => {
    setClientId(nextClientId)
    const nextClient = clients.find((client) => client.id === nextClientId)
    setRentalId(nextClient?.rentals?.[0]?.id || '')
  }

  const handleUpload = async () => {
    if (!clientId) {
      toast({ title: 'Erreur', description: 'Sélectionnez un client', variant: 'destructive' })
      return
    }

    if (!rentalId) {
      toast({ title: 'Erreur', description: 'Sélectionnez une localité', variant: 'destructive' })
      return
    }

    if (!file) {
      toast({ title: 'Erreur', description: 'Sélectionnez un fichier', variant: 'destructive' })
      return
    }

    try {
      setIsUploading(true)
      const name = docName || file.name || 'Document'
      await addDocument(clientId, rentalId, { name, type: docType, signed, file })
      toast({ title: 'Succès', description: `Document "${name}" importé avec succès!` })
      setDocName('')
      setFile(null)
      setSigned(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'import du document"
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const openActionDialog = (doc: DocumentRow) => {
    if (modalBlobUrl) URL.revokeObjectURL(modalBlobUrl)
    setModalBlobUrl(null)
    setModalDoc(doc)
  }

  const generateAndGetBlob = async (doc: DocumentRow) => {
    setModalGenerating(true)
    try {
      const { generatePdfForDocument } = await import('@/lib/pdfUtils')
      return await generatePdfForDocument(doc)
    } finally {
      setModalGenerating(false)
    }
  }

  const handleModalDownload = async () => {
    if (!modalDoc) return
    try {
      if (modalDoc.url && modalDoc.type !== 'receipt') {
        const openUrl = await getCloudinaryOpenUrl(String(modalDoc.url))
        const link = document.createElement('a')
        link.href = openUrl
        link.download = modalDoc.name || 'document'
        document.body.appendChild(link)
        link.click()
        link.remove()
        return
      }

      const blob = await generateAndGetBlob(modalDoc)
      const { downloadBlob } = await import('@/lib/pdfUtils')
      downloadBlob(blob, `${modalDoc.name || 'document'}.pdf`)
      const url = URL.createObjectURL(blob)
      setModalBlobUrl(url)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de générer le PDF.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    }
  }

  const handleModalSendWhatsapp = async () => {
    if (!modalDoc) return
    try {
      let blob: Blob | null = null
      let shareableUrl = ''
      if (modalDoc.url && modalDoc.type !== 'receipt') {
        try {
          const openUrl = await getCloudinaryOpenUrl(String(modalDoc.url))
          shareableUrl = openUrl
          const response = await fetch(openUrl)
          if (response.ok) blob = await response.blob()
        } catch {
          blob = null
        }
      }

      if (!blob) blob = await generateAndGetBlob(modalDoc)

      const { shareBlobViaWebShare } = await import('@/lib/pdfUtils')
      const shared = await shareBlobViaWebShare(blob, `${modalDoc.name || 'document'}.pdf`, modalDoc.name || 'Document')
      if (shared) return

      const text = shareableUrl
        ? `Voici le document ${modalDoc.name || ''} : ${shareableUrl}`
        : `Voici le document ${modalDoc.name || ''}`
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')

      if (!shareableUrl) {
        toast({
          title: 'Information',
          description: 'Le PDF est local. Joignez-le manuellement dans WhatsApp si nécessaire.',
        })
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible d’envoyer le document.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    }
  }

  const handleDelete = (doc: DocumentRow) => {
    if (doc.isMissing) return
    setDeleteTarget(doc)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteDocument(deleteTarget.clientId, deleteTarget.rentalId, deleteTarget.id)
      toast({ title: 'Document supprimé', description: `"${deleteTarget.name}" a été supprimé.` })
      setDeleteTarget(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer le document.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    }
  }

  const hasNoResults = filteredDocuments.length === 0 && (searchQuery || filterType)
  const hasNoDocuments = allDocuments.length === 0

  return (
    <div className="space-y-6">
      <SectionWrapper>
        <DocumentsHeaderSection filterType={filterType} onBack={() => goBack('/dashboard')} />
      </SectionWrapper>

      <SectionWrapper>
        <DocumentsSearchSection value={searchQuery} total={filteredDocuments.length} onChange={setSearchQuery} />
      </SectionWrapper>

      <SectionWrapper>
        <div id="upload-document" />
        <DocumentsUploadSection
          clients={clients}
          clientId={clientId}
          rentalId={rentalId}
          docName={docName}
          docType={docType}
          signed={signed}
          isUploading={isUploading}
          file={file}
          onClientChange={handleClientChange}
          onRentalChange={setRentalId}
          onNameChange={setDocName}
          onTypeChange={setDocType}
          onSignedChange={setSigned}
          onFileChange={setFile}
          onUpload={handleUpload}
        />
      </SectionWrapper>

      <SectionWrapper>
        <DocumentsStatsSection
          total={filteredDocuments.length}
          totalAll={allDocuments.length}
          contracts={totalsFiltered.contract || 0}
          contractsAll={totalsAll.contract || 0}
          receipts={totalsFiltered.receipt || 0}
          receiptsAll={totalsAll.receipt || 0}
          others={totalsFiltered.other || 0}
          othersAll={totalsAll.other || 0}
          showTotals={showTotals}
        />
      </SectionWrapper>

      {groupedFiltered.map((group) => (
        <SectionWrapper key={group.type}>
          <DocumentsTableSection
            group={group}
            formatDate={formatDocumentDate}
            onDownload={openActionDialog}
            onEdit={(doc) => navigate(`/documents/${doc.id}/edit`)}
            onDelete={handleDelete}
          />
        </SectionWrapper>
      ))}

      {hasNoResults && (
        <SectionWrapper>
          <div className="rounded-2xl border border-border bg-white/80 p-6 text-center text-sm text-muted-foreground">
            {searchQuery
              ? `Aucun document ne correspond à votre recherche "${searchQuery}"`
              : 'Aucun document trouvé avec les filtres appliqués'}
          </div>
        </SectionWrapper>
      )}

      {hasNoDocuments && (
        <SectionWrapper>
          <div className="rounded-2xl border border-border bg-white/80 p-6 text-center text-sm text-muted-foreground">
            Aucun document disponible
          </div>
        </SectionWrapper>
      )}

      <DocumentActionDialog
        document={modalDoc}
        previewUrl={modalBlobUrl}
        isGenerating={modalGenerating}
        onClose={() => {
          if (modalBlobUrl) URL.revokeObjectURL(modalBlobUrl)
          setModalBlobUrl(null)
          setModalDoc(null)
        }}
        onDownload={handleModalDownload}
        onSendWhatsapp={handleModalSendWhatsapp}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le document ?"
        description={deleteTarget ? `Le document "${deleteTarget.name}" sera supprimé.` : ''}
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
