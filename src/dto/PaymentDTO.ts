export interface PaymentRecordDTO {
  id: string
  amount: number
  date: string
  receiptNumber: string
}

export interface MonthlyPaymentDTO {
  id: string
  rentalId: string
  periodStart: string
  periodEnd: string
  dueDate: string
  amount: number
  paidAmount: number
  status: string
  payments: PaymentRecordDTO[]
}
