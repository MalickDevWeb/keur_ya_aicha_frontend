import { useMemo, useState } from 'react'
import { useStore } from '@/stores/dataStore'
import type { Client, DepositPayment, MonthlyPayment, Rental } from '@/lib/types'
import { calculateDepositStatus, calculatePaymentStatus } from '@/lib/types'
import { format } from 'date-fns'
import type { CautionModalFormData, PaiementModalFormData } from '@/validators/frontend'
import { useToast } from '@/hooks/use-toast'

export type ReceiptData = {
  type: 'payment' | 'deposit'
  clientName: string
  propertyName: string
  propertyType: string
  amount: number
  date: Date | string
  receiptNumber: string
  periodStart?: Date | string
  periodEnd?: Date | string
  monthlyRent?: number
}

export function useRentalDetail(rentalId?: string) {
  const clients = useStore((state) => state.clients)
  const addMonthlyPayment = useStore((state) => state.addMonthlyPayment)
  const addDepositPayment = useStore((state) => state.addDepositPayment)
  const updateClient = useStore((state) => state.updateClient)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'payments' | 'deposit'>('payments')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [quickPaymentModalOpen, setQuickPaymentModalOpen] = useState(false)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [editingDepositId, setEditingDepositId] = useState<string | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [selectedPaymentForQuickPay, setSelectedPaymentForQuickPay] = useState<MonthlyPayment | null>(null)
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false)
  const [isDepositSubmitting, setIsDepositSubmitting] = useState(false)

  const { rental, client } = useMemo(() => {
    let foundRental: Rental | null = null
    let foundClient: Client | null = null
    for (const c of clients) {
      const r = c.rentals.find((rental) => rental.id === rentalId)
      if (r) {
        foundRental = r
        foundClient = c
        break
      }
    }
    return { rental: foundRental, client: foundClient }
  }, [clients, rentalId])

  const paymentStats = useMemo(() => {
    if (!rental) {
      return { total: 0, paid: 0, partial: 0, unpaid: 0, totalAmount: 0, paidAmount: 0, remaining: 0 }
    }
    const total = rental.payments.length
    const paid = rental.payments.filter((p) => calculatePaymentStatus(p) === 'paid').length
    const partial = rental.payments.filter((p) => calculatePaymentStatus(p) === 'partial').length
    const unpaid = rental.payments.filter((p) => {
      const status = calculatePaymentStatus(p)
      return status === 'unpaid' || status === 'late'
    }).length
    const totalAmount = rental.payments.reduce((sum, p) => sum + p.amount, 0)
    const paidAmount = rental.payments.reduce((sum, p) => sum + p.paidAmount, 0)
    return {
      total,
      paid,
      partial,
      unpaid,
      totalAmount,
      paidAmount,
      remaining: totalAmount - paidAmount,
    }
  }, [rental])

  const depositStatus = rental ? calculateDepositStatus(rental.deposit) : 'unpaid'
  const depositRemaining = rental ? Math.max(0, rental.deposit.total - rental.deposit.paid) : 0
  const nextPendingPayment = useMemo(() => {
    if (!rental) return null
    const pending = rental.payments
      .filter((payment) => calculatePaymentStatus(payment) !== 'paid')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    return pending[0] ?? null
  }, [rental])

  const selectedDepositPayment = useMemo(() => {
    if (!rental || !editingDepositId) return null
    return rental.deposit.payments?.find((payment) => payment.id === editingDepositId) ?? null
  }, [editingDepositId, rental])

  const depositModalDefaultValues = useMemo(() => {
    if (!selectedDepositPayment) return undefined
    return {
      amount: String(selectedDepositPayment.amount),
      date: format(new Date(selectedDepositPayment.date), 'yyyy-MM-dd'),
      receiptNumber: selectedDepositPayment.receiptNumber || '',
      notes: '',
    }
  }, [selectedDepositPayment])

  const depositMaxAmount = useMemo(() => {
    if (!selectedDepositPayment) return depositRemaining
    return depositRemaining + selectedDepositPayment.amount
  }, [depositRemaining, selectedDepositPayment])

  const handleAddPayment = async (data: PaiementModalFormData) => {
    if (!rental) return
    if (!nextPendingPayment) {
      toast({
        title: 'Aucun paiement en attente',
        description: 'Tous les paiements mensuels sont déjà soldés.',
      })
      setPaymentModalOpen(false)
      return
    }

    const amount = Number(data.amount)
    const remaining = Math.max(0, nextPendingPayment.amount - nextPendingPayment.paidAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        title: 'Montant invalide',
        description: 'Le montant doit être supérieur à 0.',
        variant: 'destructive',
      })
      return
    }
    if (amount > remaining) {
      toast({
        title: 'Montant trop élevé',
        description: `Le reste sur cette échéance est de ${remaining.toLocaleString('fr-SN')} FCFA.`,
        variant: 'destructive',
      })
      return
    }

    try {
      setIsPaymentSubmitting(true)
      await addMonthlyPayment(rental.id, nextPendingPayment.id, amount, {
        date: data.date,
        receiptNumber: data.receiptNumber,
        notes: data.notes,
      })
      setPaymentModalOpen(false)
      toast({
        title: 'Paiement enregistré',
        description: `${amount.toLocaleString('fr-SN')} FCFA ont été ajoutés.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'enregistrement du paiement."
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsPaymentSubmitting(false)
    }
  }

  const handleQuickPayPayment = (payment: MonthlyPayment) => {
    setSelectedPaymentForQuickPay(payment)
    setQuickPaymentModalOpen(true)
  }

  const handleQuickPayTotal = async () => {
    if (!selectedPaymentForQuickPay || !rental) return

    const amount = Math.max(0, selectedPaymentForQuickPay.amount - selectedPaymentForQuickPay.paidAmount)
    if (amount <= 0) {
      setQuickPaymentModalOpen(false)
      setSelectedPaymentForQuickPay(null)
      return
    }

    try {
      setIsPaymentSubmitting(true)
      await addMonthlyPayment(rental.id, selectedPaymentForQuickPay.id, amount)
      setQuickPaymentModalOpen(false)
      setSelectedPaymentForQuickPay(null)
      toast({
        title: 'Paiement enregistré',
        description: `${amount.toLocaleString('fr-SN')} FCFA ont été ajoutés.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'enregistrement du paiement."
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsPaymentSubmitting(false)
    }
  }

  const handleQuickPayPartial = async (amount: number) => {
    if (!selectedPaymentForQuickPay || !rental) return
    try {
      setIsPaymentSubmitting(true)
      await addMonthlyPayment(rental.id, selectedPaymentForQuickPay.id, amount)
      setQuickPaymentModalOpen(false)
      setSelectedPaymentForQuickPay(null)
      toast({
        title: 'Paiement partiel enregistré',
        description: `${amount.toLocaleString('fr-SN')} FCFA ont été ajoutés.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'enregistrement du paiement."
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsPaymentSubmitting(false)
    }
  }

  const handleAddDeposit = async (data: CautionModalFormData) => {
    if (!rental || !client) return
    const amount = Number(data.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        title: 'Montant invalide',
        description: 'Le montant doit être supérieur à 0.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsDepositSubmitting(true)

      if (editingDepositId) {
        const paymentToEdit = rental.deposit.payments.find((payment) => payment.id === editingDepositId)
        if (!paymentToEdit) {
          throw new Error('Paiement de caution introuvable.')
        }

        const updatedDepositPayments = rental.deposit.payments.map((payment) =>
          payment.id === editingDepositId
            ? {
                ...payment,
                amount,
                date: data.date || payment.date,
                receiptNumber: data.receiptNumber?.trim() || payment.receiptNumber,
              }
            : payment
        )

        const totalPaid = updatedDepositPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
        const cappedPaid = Math.min(rental.deposit.total, totalPaid)

        const updatedRentals = client.rentals.map((clientRental) => {
          if (clientRental.id !== rental.id) return clientRental
          return {
            ...clientRental,
            deposit: {
              ...clientRental.deposit,
              paid: cappedPaid,
              payments: updatedDepositPayments,
            },
          }
        })

        await updateClient(client.id, { rentals: updatedRentals })
        toast({
          title: 'Paiement de caution modifié',
          description: 'Les informations ont été mises à jour.',
        })
      } else {
        if (amount > depositRemaining) {
          throw new Error(`Le reste à percevoir est ${depositRemaining.toLocaleString('fr-SN')} FCFA.`)
        }

        await addDepositPayment(rental.id, amount, {
          date: data.date,
          receiptNumber: data.receiptNumber,
          notes: data.notes,
        })
        toast({
          title: 'Paiement de caution enregistré',
          description: `${amount.toLocaleString('fr-SN')} FCFA ont été ajoutés.`,
        })
      }

      setDepositModalOpen(false)
      setEditingDepositId(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'enregistrement du paiement de caution."
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsDepositSubmitting(false)
    }
  }

  const handleEditDeposit = (depositId: string) => {
    setEditingDepositId(depositId)
    setDepositModalOpen(true)
  }

  const handleOpenAddDeposit = () => {
    setEditingDepositId(null)
    setDepositModalOpen(true)
  }

  const handleDepositModalOpenChange = (open: boolean) => {
    setDepositModalOpen(open)
    if (!open) setEditingDepositId(null)
  }

  const handleQuickPaymentModalOpenChange = (open: boolean) => {
    setQuickPaymentModalOpen(open)
    if (!open) setSelectedPaymentForQuickPay(null)
  }

  const handleShowPaymentReceipt = (payment: MonthlyPayment) => {
    if (!client || !rental) return
    setSelectedReceipt({
      type: 'payment',
      clientName: `${client.firstName} ${client.lastName}`,
      propertyName: rental.propertyName,
      propertyType: rental.propertyType,
      amount: payment.paidAmount,
      date: payment.payments && payment.payments.length > 0 ? payment.payments[0].date : payment.periodEnd,
      receiptNumber: payment.payments && payment.payments.length > 0 ? payment.payments[0].receiptNumber : `REC-${format(new Date(payment.periodStart), 'yyyyMM')}`,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd,
      monthlyRent: rental.monthlyRent,
    })
    setReceiptModalOpen(true)
  }

  const handleShowDepositReceipt = (deposit: Rental['deposit'], depositPayment: DepositPayment) => {
    if (!client || !rental) return
    setSelectedReceipt({
      type: 'deposit',
      clientName: `${client.firstName} ${client.lastName}`,
      propertyName: rental.propertyName,
      propertyType: rental.propertyType,
      amount: depositPayment.amount,
      date: depositPayment.date,
      receiptNumber: depositPayment.receiptNumber,
    })
    setReceiptModalOpen(true)
  }

  return {
    rental,
    client,
    activeTab,
    setActiveTab,
    paymentModalOpen,
    setPaymentModalOpen,
    quickPaymentModalOpen,
    setQuickPaymentModalOpen,
    depositModalOpen,
    setDepositModalOpen,
    receiptModalOpen,
    setReceiptModalOpen,
    editingDepositId,
    selectedReceipt,
    selectedPaymentForQuickPay,
    isPaymentSubmitting,
    isDepositSubmitting,
    paymentStats,
    depositStatus,
    depositRemaining,
    depositMaxAmount,
    depositModalDefaultValues,
    handleAddPayment,
    handleQuickPayPayment,
    handleQuickPayTotal,
    handleQuickPayPartial,
    handleAddDeposit,
    handleEditDeposit,
    handleOpenAddDeposit,
    handleDepositModalOpenChange,
    handleQuickPaymentModalOpenChange,
    handleShowPaymentReceipt,
    handleShowDepositReceipt,
  }
}
