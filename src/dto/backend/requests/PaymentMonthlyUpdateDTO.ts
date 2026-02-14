import { PaymentRecordDTO } from '../responses/PaymentDTO'

export interface PaymentMonthlyUpdateDTO {
  paidAmount?: number
  status?: string
  payments?: PaymentRecordDTO[]
}
