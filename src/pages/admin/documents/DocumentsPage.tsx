import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { useStore } from '@/stores/dataStore'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
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
        const link = document.createElement('a')
        link.href = modalDoc.url
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
      if (modalDoc.url && modalDoc.type !== 'receipt') {
        try {
          const response = await fetch(modalDoc.url)
          if (response.ok) blob = await response.blob()
        } catch {
          blob = null
        }
      }

      if (!blob) blob = await generateAndGetBlob(modalDoc)

      const { shareBlobViaWebShare, uploadBlobToFileIo } = await import('@/lib/pdfUtils')
      const shared = await shareBlobViaWebShare(blob, `${modalDoc.name || 'document'}.pdf`, modalDoc.name || 'Document')
      if (shared) return

      try {
        const link = await uploadBlobToFileIo(blob, `${modalDoc.name || 'document'}.pdf`)
        const text = `Voici le document ${modalDoc.name || ''} : ${link}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
      } catch {
        const text = `Voici le document ${modalDoc.name || ''}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible d’envoyer le document.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    }
  }

  const handleDelete = (doc: DocumentRow) => {
    if (doc.isMissing) return
    if (!window.confirm(`Supprimer le document "${doc.name}" ?`)) return
    deleteDocument(doc.clientId, doc.rentalId, doc.id)
  }

  const hasNoResults = filteredDocuments.length === 0 && (searchQuery || filterType)
  const hasNoDocuments = allDocuments.length === 0

  return (
    <div className="space-y-6">
      <SectionWrapper>
        <DocumentsHeaderSection filterType={filterType} onBack={() => navigate(-1)} />
      </SectionWrapper>

      <SectionWrapper>
        <DocumentsSearchSection value={searchQuery} total={filteredDocuments.length} onChange={setSearchQuery} />
      </SectionWrapper>

      <SectionWrapper>
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
    </div>
  )
}
