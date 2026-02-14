import { useMemo, useState } from 'react'
import { useStore } from '@/stores/dataStore'
import type { Client, DepositPayment, MonthlyPayment, Rental } from '@/lib/types'
import { calculateDepositStatus, calculatePaymentStatus } from '@/lib/types'
import { format } from 'date-fns'

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
  const [activeTab, setActiveTab] = useState<'payments' | 'deposit'>('payments')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [quickPaymentModalOpen, setQuickPaymentModalOpen] = useState(false)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [editingDepositId, setEditingDepositId] = useState<string | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [selectedPaymentForQuickPay, setSelectedPaymentForQuickPay] = useState<MonthlyPayment | null>(null)

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
  const depositRemaining = rental ? rental.deposit.total - rental.deposit.paid : 0

  const handleAddPayment = (_data: { amount: string; date: string; receiptNumber?: string; notes?: string }) => {
    setPaymentModalOpen(false)
  }

  const handleQuickPayPayment = (payment: MonthlyPayment) => {
    setSelectedPaymentForQuickPay(payment)
    setQuickPaymentModalOpen(true)
  }

  const handleQuickPayTotal = () => {
    if (selectedPaymentForQuickPay) {
      setQuickPaymentModalOpen(false)
    }
  }

  const handleQuickPayPartial = (_amount: number) => {
    if (selectedPaymentForQuickPay) {
      setQuickPaymentModalOpen(false)
    }
  }

  const handleAddDeposit = (_data: { amount: string; date: string; receiptNumber?: string; notes?: string }) => {
    setDepositModalOpen(false)
  }

  const handleEditDeposit = (depositId: string) => {
    setEditingDepositId(depositId)
    setDepositModalOpen(true)
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
    paymentStats,
    depositStatus,
    depositRemaining,
    handleAddPayment,
    handleQuickPayPayment,
    handleQuickPayTotal,
    handleQuickPayPartial,
    handleAddDeposit,
    handleEditDeposit,
    handleShowPaymentReceipt,
    handleShowDepositReceipt,
  }
}
