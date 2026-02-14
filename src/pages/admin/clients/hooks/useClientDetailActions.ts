import { useState } from 'react'
import type { Client, MonthlyPayment, Rental } from '@/lib/types'
import { useStore } from '@/stores/dataStore'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/lib/i18n'
import { formatCurrency } from '@/lib/types'

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

export function useClientDetailActions(_client: Client | null) {
  const { t } = useI18n()
  const { toast } = useToast()
  const addMonthlyPayment = useStore((state) => state.addMonthlyPayment)
  const editMonthlyPayment = useStore((state) => state.editMonthlyPayment)
  const addDepositPayment = useStore((state) => state.addDepositPayment)
  const [selectedPayment, setSelectedPayment] = useState<SelectedPayment | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<EditPayment | null>(null)
  const [editPaymentModalOpen, setEditPaymentModalOpen] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<SelectedDeposit | null>(null)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
  }
}
