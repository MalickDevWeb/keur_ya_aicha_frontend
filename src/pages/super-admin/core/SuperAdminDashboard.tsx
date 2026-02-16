import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { jsPDF } from 'jspdf'
import { CreateAdminDialog } from '../sections/CreateAdminDialog'
import { PendingRequestsSection } from '../sections/PendingRequestsSection'
import { GlobalStatsSection } from '../sections/GlobalStatsSection'
import type { CreatedAdmin } from './types'
import { CONTRACT_META, PIE_COLORS, SECTION_IDS } from './constants'
import { extractSuperAdminSectionHash } from './hash-routing'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import {
  buildContractText,
  buildCredentialsMessage,
  formatPhoneForWhatsapp,
  loadLogoDataUrl,
} from './utils'
import { useSuperAdminDashboard } from './useSuperAdminDashboard'
import type { AdminDTO } from '@/dto/frontend/responses'
import { Input } from '@/components/ui/input' // Fix missing Input import

interface SuperAdminDashboardProps {
  onCreatedAdmin?: (admin: AdminDTO) => void
}

export function SuperAdminDashboard({ onCreatedAdmin: _onCreatedAdmin }: SuperAdminDashboardProps) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const {
    admins,
    entreprises,
    adminPayments,
    pendingRequests,
    visiblePending,
    showAllPending,
    setShowAllPending,
    pendingSearch,
    setPendingSearch,
    pendingOnlyEntreprise,
    setPendingOnlyEntreprise,
    approveErrors,
    approveRequest,
    paymentDistribution,
    totalPayments,
    createAdminDirect,
    createdAdmin,
    setCreatedAdmin,
    creating,
    createError,
    setCreateError,
    isCreateOpen,
    setIsCreateOpen,
    newName,
    setNewName,
    newEmail,
    setNewEmail,
    newEntreprise,
    setNewEntreprise,
    newPassword,
    setNewPassword,
    newPhone,
    setNewPhone,
    loading,
  } = useSuperAdminDashboard()

  const [filterBy, setFilterBy] = useState('entreprise')

  useEffect(() => {
    const handleHash = () => {
      const sectionId = extractSuperAdminSectionHash(window.location.hash)
      if (!sectionId) return
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  useEffect(() => {
    const shouldOpen = sessionStorage.getItem('superadminOpenCreate') === 'true'
    if (shouldOpen) {
      sessionStorage.removeItem('superadminOpenCreate')
      setIsCreateOpen(true)
    }
  }, [setIsCreateOpen])


  const downloadCredentialsPdf = async (data: CreatedAdmin) => {
    setPdfLoading(true)
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const logoDataUrl = await loadLogoDataUrl()

      const contractTitle = 'Contrat d’accès administrateur'
      const contractDate = new Date(data.createdAt).toLocaleDateString()
      const contractText = buildContractText(data.name)

      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageWidth, 44, 'F')
      doc.setFillColor(250, 250, 252)
      doc.rect(0, 44, pageWidth, pageHeight - 44, 'F')

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', 12, 10, 18, 18)
      }

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('Keur Ya Aicha', logoDataUrl ? 36 : 14, 20)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('Contrat & Identifiants Admin', logoDataUrl ? 36 : 14, 29)

      doc.setDrawColor(203, 213, 225)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(12, 56, pageWidth - 24, 90, 5, 5, 'FD')

      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('Informations du compte', 18, 68)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      const rows = [
        ['Nom', data.name],
        ['Mot de passe', data.password],
        ['Email', data.email || '—'],
        ['Entreprise', data.entreprise || '—'],
        ['Créé le', new Date(data.createdAt).toLocaleString()],
      ]

      const leftX = 18
      const rightX = pageWidth / 2 + 6
      const y = 78
      rows.forEach(([label, value], index) => {
        const columnX = index < 3 ? leftX : rightX
        const rowY = index < 3 ? y + index * 10 : y + (index - 3) * 10
        doc.setTextColor(100, 116, 139)
        doc.text(`${label}`, columnX, rowY)
        doc.setTextColor(15, 23, 42)
        doc.text(String(value), columnX + 30, rowY)
      })

      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(12, 152, pageWidth - 24, 34, 4, 4, 'S')
      doc.setTextColor(71, 85, 105)
      doc.setFontSize(10)
      doc.text(
        'Conservez ces identifiants en lieu sûr. Changez le mot de passe lors de la première connexion.',
        18,
        166,
        { maxWidth: pageWidth - 36 }
      )

      doc.addPage()
      doc.setFillColor(250, 250, 252)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text(contractTitle, 14, 18)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(`Date : ${contractDate}`, 14, 28)

      doc.setFontSize(11)
      doc.setTextColor(30, 41, 59)
      let textY = 40
      contractText.forEach((line) => {
        if (!line) {
          textY += 6
          return
        }
        doc.text(line, 14, textY, { maxWidth: pageWidth - 28 })
        textY += 7
      })

      doc.setDrawColor(203, 213, 225)
      doc.roundedRect(14, pageHeight - 64, pageWidth - 28, 44, 5, 5, 'S')
      doc.setFontSize(10)
      doc.setTextColor(71, 85, 105)
      doc.text(`Fait à ${CONTRACT_META.signatureCity}, le ${contractDate}.`, 18, pageHeight - 50)
      doc.text('Signature et cachet de la Société', 18, pageHeight - 36)
      doc.text('Signature de l’Administrateur', pageWidth / 2 + 6, pageHeight - 36)

      doc.setTextColor(148, 163, 184)
      doc.setFontSize(9)
      doc.text('Document généré par le Super Admin', 12, pageHeight - 16)

      const safeName = String(data.name || 'admin').trim().toLowerCase().replace(/\s+/g, '-')
      doc.save(`admin-${safeName}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  const sendCredentialsWhatsapp = (data: CreatedAdmin) => {
    const phone = formatPhoneForWhatsapp(data.phone || '')
    if (!phone) return
    const appUrl = `${window.location.origin}/login`
    const message = encodeURIComponent(buildCredentialsMessage(data, appUrl))
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <SectionWrapper>
        <SuperAdminHeader onAddAdmin={() => setIsCreateOpen(true)} />
      </SectionWrapper>

      <CreateAdminDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        creating={creating}
        createError={createError}
        setCreateError={setCreateError}
        newName={newName}
        setNewName={setNewName}
        newEmail={newEmail}
        setNewEmail={setNewEmail}
        newEntreprise={newEntreprise}
        setNewEntreprise={setNewEntreprise}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        newPhone={newPhone}
        setNewPhone={setNewPhone}
        createdAdmin={createdAdmin}
        setCreatedAdmin={setCreatedAdmin}
        onCreate={createAdminDirect}
        onDownloadPdf={downloadCredentialsPdf}
        onSendWhatsapp={sendCredentialsWhatsapp}
        pdfLoading={pdfLoading}
      />

      <PendingRequestsSection
        sectionId={SECTION_IDS.pendingRequests}
        pendingSearch={pendingSearch}
        onPendingSearchChange={setPendingSearch}
        pendingOnlyEntreprise={pendingOnlyEntreprise}
        onToggleEntrepriseOnly={() => setPendingOnlyEntreprise(!pendingOnlyEntreprise)}
        pendingRequests={pendingRequests}
        visiblePending={visiblePending}
        showAllPending={showAllPending}
        onToggleShowAll={() => setShowAllPending(!showAllPending)}
        approveErrors={approveErrors}
        onApprove={approveRequest}
      />

        <GlobalStatsSection
          sectionId={SECTION_IDS.globalStats}
          admins={admins}
          entreprises={entreprises}
          pendingRequests={pendingRequests}
          adminPayments={adminPayments}
          paymentDistribution={paymentDistribution}
          totalPayments={totalPayments}
          pieColors={[...PIE_COLORS]}
        />
    </div>
  )
}
