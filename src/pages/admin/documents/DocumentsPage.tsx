import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { useGoBack } from '@/hooks/useGoBack'
import { useStore } from '@/stores/dataStore'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { getCloudinaryOpenUrl } from '@/services/api/uploads.api'
import { getDocumentUploadLabel, prepareDocumentUploadFile } from '@/lib/documentUpload'
import { buildReadableDocumentName, toSafeFileBaseName } from '@/lib/documentDisplay'
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

const getDocumentDisplayName = (doc: DocumentRow | null) =>
  buildReadableDocumentName({
    name: doc?.name,
    type: doc?.type,
    context: doc?.rentalName || doc?.clientName,
    uploadedAt: doc?.uploadedAt,
  })

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
  const [viewerDocuments, setViewerDocuments] = useState<DocumentRow[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [modalAction, setModalAction] = useState<'download' | 'whatsapp' | 'download-all' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const previewObjectUrlRef = useRef<string | null>(null)

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
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
        previewObjectUrlRef.current = null
      }
    }
  }, [])

  const allDocuments = useMemo(() => buildDocumentsList(clients), [clients])

  const sourceDocuments = useMemo(() => {
    if (filterType === 'missing-contracts') return buildMissingContracts(clients)
    return allDocuments
  }, [allDocuments, clients, filterType])

  const filteredDocuments = useMemo(
    () => filterDocuments(sourceDocuments, clients, searchQuery, filterType),
    [sourceDocuments, clients, searchQuery, filterType]
  )
  const actionableDocuments = useMemo(
    () => filteredDocuments.filter((doc) => !doc.isMissing),
    [filteredDocuments]
  )

  const groupedAll = useMemo(() => groupDocumentsByType(allDocuments), [allDocuments])
  const groupedFiltered = useMemo(() => groupDocumentsByType(filteredDocuments), [filteredDocuments])

  const totalsAll = getGroupCounts(groupedAll)
  const totalsFiltered = getGroupCounts(groupedFiltered)
  const showTotals = Boolean(searchQuery || filterType)
  const modalDoc = viewerDocuments[viewerIndex] || null
  const canGoToPreviousDocument = viewerDocuments.length > 1 && viewerIndex > 0
  const canGoToNextDocument = viewerDocuments.length > 1 && viewerIndex < viewerDocuments.length - 1

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
      const preparedUpload = await prepareDocumentUploadFile(file)
      const name = docName.trim() || getDocumentUploadLabel(file) || 'Document'
      await addDocument(clientId, rentalId, {
        name,
        type: docType,
        signed,
        file: preparedUpload.file,
      })
      toast({
        title: 'Succès',
        description: preparedUpload.wasConvertedFromImage
          ? `Photo convertie en PDF puis importée avec succès pour "${name}".`
          : `Document "${name}" importé avec succès!`,
      })
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

  const generateAndGetBlob = async (doc: DocumentRow) => {
    const { generatePdfForDocument } = await import('@/lib/pdfUtils')
    return await generatePdfForDocument(doc)
  }

  const getDocumentDisplayFileName = (doc: DocumentRow) => {
    const displayName = getDocumentDisplayName(doc)
    return `${toSafeFileBaseName(displayName)}.pdf`
  }

  const resetPreviewState = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    setPreviewUrl(null)
  }

  const downloadDocument = async (doc: DocumentRow) => {
    const safeFileName = getDocumentDisplayFileName(doc)
    if (doc.url && doc.type !== 'receipt') {
      const openUrl = await getCloudinaryOpenUrl(String(doc.url))
      const link = document.createElement('a')
      link.href = openUrl
      link.download = safeFileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      return
    }

    const blob = await generateAndGetBlob(doc)
    const { downloadBlob } = await import('@/lib/pdfUtils')
    downloadBlob(blob, safeFileName)
  }

  const closeViewer = () => {
    resetPreviewState()
    setViewerDocuments([])
    setViewerIndex(0)
  }

  const openViewer = (documents: DocumentRow[], startIndex = 0) => {
    const realDocuments = documents.filter((doc) => !doc.isMissing)
    if (realDocuments.length === 0) {
      toast({
        title: 'Aperçu indisponible',
        description: 'Aucun document réel à afficher dans cette sélection.',
        variant: 'destructive',
      })
      return
    }

    resetPreviewState()
    setViewerDocuments(realDocuments)
    setViewerIndex(Math.max(0, Math.min(startIndex, realDocuments.length - 1)))
  }

  const handleViewDocument = (doc: DocumentRow) => {
    if (doc.isMissing) {
      toast({
        title: 'Document manquant',
        description: 'Ce document n’existe pas encore. Téléversez-le d’abord.',
        variant: 'destructive',
      })
      return
    }
    openViewer([doc])
  }

  const handleViewAllDocuments = () => {
    openViewer(actionableDocuments)
  }

  useEffect(() => {
    let cancelled = false

    const loadPreview = async () => {
      resetPreviewState()
      if (!modalDoc) {
        setIsPreviewLoading(false)
        return
      }

      setIsPreviewLoading(true)
      try {
        const nextPreview =
          modalDoc.url && modalDoc.type !== 'receipt'
            ? { url: await getCloudinaryOpenUrl(String(modalDoc.url)), shouldRevoke: false }
            : { url: URL.createObjectURL(await generateAndGetBlob(modalDoc)), shouldRevoke: true }
        if (cancelled) {
          if (nextPreview.shouldRevoke) URL.revokeObjectURL(nextPreview.url)
          return
        }

        if (nextPreview.shouldRevoke) {
          previewObjectUrlRef.current = nextPreview.url
        }
        setPreviewUrl(nextPreview.url)
      } catch (error: unknown) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Impossible de charger le document.'
        toast({ title: 'Erreur', description: message, variant: 'destructive' })
        setPreviewUrl(null)
      } finally {
        if (!cancelled) setIsPreviewLoading(false)
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
    }
  }, [modalDoc, toast])

  const handleModalDownload = async () => {
    if (!modalDoc) return
    setModalAction('download')
    try {
      await downloadDocument(modalDoc)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de générer le PDF.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setModalAction(null)
    }
  }

  const handleModalSendWhatsapp = async () => {
    if (!modalDoc) return
    const displayName = getDocumentDisplayName(modalDoc)
    const fileName = getDocumentDisplayFileName(modalDoc)
    setModalAction('whatsapp')
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
      const shared = await shareBlobViaWebShare(blob, fileName, displayName)
      if (shared) return

      const text = shareableUrl
        ? `Voici le document ${displayName} : ${shareableUrl}`
        : `Voici le document ${displayName}`
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
    } finally {
      setModalAction(null)
    }
  }

  const handleOpenCurrentDocumentInNewTab = () => {
    if (!previewUrl) return
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDownloadDirect = async (doc: DocumentRow) => {
    if (doc.isMissing) {
      toast({
        title: 'Document manquant',
        description: 'Ce document n’existe pas encore. Téléversez-le d’abord.',
        variant: 'destructive',
      })
      return
    }

    try {
      await downloadDocument(doc)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de télécharger le document.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    }
  }

  const handleDownloadAllDocuments = async () => {
    if (actionableDocuments.length === 0) {
      toast({
        title: 'Aucun document',
        description: 'Il n’y a aucun document réel à télécharger dans cette sélection.',
        variant: 'destructive',
      })
      return
    }

    setModalAction('download-all')
    try {
      for (const [index, documentItem] of actionableDocuments.entries()) {
        await downloadDocument(documentItem)
        if (index < actionableDocuments.length - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 150))
        }
      }
      toast({
        title: 'Téléchargements lancés',
        description: `${actionableDocuments.length} document(s) ont été préparés pour téléchargement.`,
      })
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Impossible de télécharger tous les documents.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setModalAction(null)
    }
  }

  const handleDelete = (doc: DocumentRow) => {
    if (doc.isMissing) return
    setDeleteTarget(doc)
  }

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteDocument(deleteTarget.clientId, deleteTarget.rentalId, deleteTarget.id)
      const displayName = getDocumentDisplayName(deleteTarget)
      toast({ title: 'Document supprimé', description: `"${displayName}" a été supprimé.` })
      setDeleteTarget(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer le document.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  const hasNoResults = filteredDocuments.length === 0 && (searchQuery || filterType)
  const hasNoDocuments = allDocuments.length === 0

  return (
    <div className="space-y-6">
      <SectionWrapper>
        <DocumentsHeaderSection
          filterType={filterType}
          canViewAll={actionableDocuments.length > 0}
          canDownloadAll={actionableDocuments.length > 0}
          isDownloadingAll={modalAction === 'download-all'}
          onBack={() => goBack('/dashboard')}
          onViewAll={handleViewAllDocuments}
          onDownloadAll={() => {
            void handleDownloadAllDocuments()
          }}
        />
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
            onView={handleViewDocument}
            onDownload={(doc) => {
              void handleDownloadDirect(doc)
            }}
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
        previewUrl={previewUrl}
        isPreviewLoading={isPreviewLoading}
        activeAction={modalAction}
        currentIndex={viewerIndex}
        totalDocuments={viewerDocuments.length}
        canGoPrevious={canGoToPreviousDocument}
        canGoNext={canGoToNextDocument}
        onPrevious={() => setViewerIndex((current) => Math.max(0, current - 1))}
        onNext={() => setViewerIndex((current) => Math.min(viewerDocuments.length - 1, current + 1))}
        onOpenInNewTab={handleOpenCurrentDocumentInNewTab}
        onClose={closeViewer}
        onDownload={handleModalDownload}
        onSendWhatsapp={handleModalSendWhatsapp}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le document ?"
        description={
          deleteTarget ? `Le document "${getDocumentDisplayName(deleteTarget)}" sera supprimé.` : ''
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
