import { useEffect, useState } from 'react'
import type { Client, MonthlyPayment, Rental } from '@/lib/types'
import { useStore } from '@/stores/dataStore'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/lib/i18n'
import { formatCurrency } from '@/lib/types'
import { listUndoActions, rollbackUndoAction } from '@/services/api'

type UndoEventDetail = {
  id?: string
  expiresAt?: string | null
  resource?: string
  resourceId?: string | null
}

export type SelectedPayment = {
  payment: MonthlyPayment
  rental: Rental
  maxAmount: number
}

export type SelectedDeposit = {
  rental: Rental
  maxAmount: number
}

export type EditPayment = {
  payment: MonthlyPayment
  rental: Rental
}

export function useClientDetailActions(client: Client | null) {
  const { t } = useI18n()
  const { toast } = useToast()
  const addMonthlyPayment = useStore((state) => state.addMonthlyPayment)
  const editMonthlyPayment = useStore((state) => state.editMonthlyPayment)
  const addDepositPayment = useStore((state) => state.addDepositPayment)
  const fetchClients = useStore((state) => state.fetchClients)
  const fetchStats = useStore((state) => state.fetchStats)
  const [selectedPayment, setSelectedPayment] = useState<SelectedPayment | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<EditPayment | null>(null)
  const [editPaymentModalOpen, setEditPaymentModalOpen] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<SelectedDeposit | null>(null)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [latestUndoId, setLatestUndoId] = useState<string | null>(null)
  const [isRollingBack, setIsRollingBack] = useState(false)

  const resolveLatestClientUndoId = async () => {
    if (!client?.id) return null
    const list = await listUndoActions(20)
    const latestForClient = list.find(
      (entry) =>
        entry.resource === 'clients' &&
        String(entry.resourceId || '') === String(client.id) &&
        new Date(entry.expiresAt).getTime() > Date.now()
    )
    return latestForClient?.id || null
  }

  const refreshUndoAvailability = async () => {
    try {
      const id = await resolveLatestClientUndoId()
      setLatestUndoId(id)
    } catch {
      setLatestUndoId(null)
    }
  }

  useEffect(() => {
    void refreshUndoAvailability()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id])

  useEffect(() => {
    const onUndoAvailable = (event: Event) => {
      const detail = (event as CustomEvent<UndoEventDetail>).detail
      if (!detail?.id) return
      if (detail.expiresAt && new Date(detail.expiresAt).getTime() <= Date.now()) return
      if (detail.resource === 'clients' && String(detail.resourceId || '') === String(client?.id || '')) {
        setLatestUndoId(detail.id)
      }
    }

    window.addEventListener('api-undo-available', onUndoAvailable)
    return () => {
      window.removeEventListener('api-undo-available', onUndoAvailable)
    }
  }, [client?.id])

  const openPaymentModal = (payment: MonthlyPayment, rental: Rental) => {
    setSelectedPayment({ payment, rental, maxAmount: payment.amount - payment.paidAmount })
    setPaymentModalOpen(true)
  }

  const openEditPaymentModal = (payment: MonthlyPayment, rental: Rental) => {
    setEditPayment({ payment, rental })
    setEditPaymentModalOpen(true)
  }

  const openDepositModal = (rental: Rental, maxAmount: number) => {
    setSelectedDeposit({ rental, maxAmount })
    setDepositModalOpen(true)
  }

  const handlePayTotal = async () => {
    if (!selectedPayment) return
    try {
      setIsLoading(true)
      await addMonthlyPayment(selectedPayment.rental.id, selectedPayment.payment.id, selectedPayment.maxAmount)
      toast({
        title: t('common.success'),
        description: `Paiement de ${formatCurrency(selectedPayment.maxAmount)} FCFA enregistré`,
      })
      await refreshUndoAvailability()
      setPaymentModalOpen(false)
      setSelectedPayment(null)
    } catch {
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'enregistrement du paiement",
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayPartial = async (amount: number) => {
    if (!selectedPayment) return
    try {
      setIsLoading(true)
      await addMonthlyPayment(selectedPayment.rental.id, selectedPayment.payment.id, amount)
      toast({
        title: t('common.success'),
        description: `Paiement de ${formatCurrency(amount)} FCFA enregistré`,
      })
      await refreshUndoAvailability()
      setPaymentModalOpen(false)
      setSelectedPayment(null)
    } catch {
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'enregistrement du paiement",
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditPayment = async (amount: number) => {
    if (!editPayment) return
    try {
      setIsLoading(true)
      await editMonthlyPayment(editPayment.rental.id, editPayment.payment.id, amount)
      toast({
        title: t('common.success'),
        description: 'Paiement corrigé',
      })
      await refreshUndoAvailability()
      setEditPaymentModalOpen(false)
      setEditPayment(null)
    } catch {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la correction du paiement',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDepositPayTotal = async () => {
    if (!selectedDeposit) return
    try {
      setIsLoading(true)
      await addDepositPayment(selectedDeposit.rental.id, selectedDeposit.maxAmount)
      toast({
        title: t('common.success'),
        description: `Paiement de caution de ${formatCurrency(selectedDeposit.maxAmount)} FCFA enregistré`,
      })
      await refreshUndoAvailability()
      setDepositModalOpen(false)
      setSelectedDeposit(null)
    } catch {
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'enregistrement du paiement de caution",
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDepositPayPartial = async (amount: number) => {
    if (!selectedDeposit) return
    try {
      setIsLoading(true)
      await addDepositPayment(selectedDeposit.rental.id, amount)
      toast({
        title: t('common.success'),
        description: `Paiement de caution de ${formatCurrency(amount)} FCFA enregistré`,
      })
      await refreshUndoAvailability()
      setDepositModalOpen(false)
      setSelectedDeposit(null)
    } catch {
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'enregistrement du paiement de caution",
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRollbackLatestAction = async () => {
    if (isRollingBack) return
    try {
      setIsRollingBack(true)
      let undoId = latestUndoId
      if (!undoId) {
        undoId = await resolveLatestClientUndoId()
        if (!undoId) {
          throw new Error("Aucune action récente à annuler")
        }
        setLatestUndoId(undoId)
      }

      await rollbackUndoAction(undoId)
      await Promise.all([fetchClients(), fetchStats()])
      toast({
        title: 'Rollback effectué',
        description: 'La dernière action a été annulée.',
      })
      await refreshUndoAvailability()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Rollback impossible'
      toast({
        title: 'Rollback impossible',
        description: message,
        variant: 'destructive',
      })
      if (message.toLowerCase().includes('expir')) {
        setLatestUndoId(null)
      }
    } finally {
      setIsRollingBack(false)
    }
  }

  return {
    selectedPayment,
    paymentModalOpen,
    setPaymentModalOpen,
    editPayment,
    editPaymentModalOpen,
    setEditPaymentModalOpen,
    selectedDeposit,
    depositModalOpen,
    setDepositModalOpen,
    isLoading,
    openPaymentModal,
    openEditPaymentModal,
    openDepositModal,
    handlePayTotal,
    handlePayPartial,
    handleEditPayment,
    handleDepositPayTotal,
    handleDepositPayPartial,
    canRollback: !!latestUndoId,
    isRollingBack,
    handleRollbackLatestAction,
  }
}
